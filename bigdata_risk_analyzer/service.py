import math
from datetime import datetime
from importlib.metadata import version
from uuid import UUID

import pandas as pd
from bigdata_client import Bigdata
from bigdata_client.models.entities import Company
from bigdata_research_tools.tree import SemanticTree
from bigdata_research_tools.utils.observer import OberserverNotification, Observer
from bigdata_research_tools.workflows.risk_analyzer import RiskAnalyzer

from bigdata_risk_analyzer.api.models import RiskAnalysisRequest, WorkflowStatus
from bigdata_risk_analyzer.api.storage import StorageManager
from bigdata_risk_analyzer.models import (
    CompanyScoring,
    LabeledChunk,
    LabeledContent,
    RiskAnalysisResponse,
    RiskScore,
    RiskScoring,
    RiskTaxonomy,
)
from bigdata_risk_analyzer.traces import TraceEventName, send_trace


class WorkflowObserver(Observer):
    def __init__(self, request_id: UUID, storage_manager: StorageManager):
        self.request_id = request_id
        self.storage_manager = storage_manager

    def update(self, message: OberserverNotification):
        self.storage_manager.log_message(
            request_id=self.request_id,
            message=message.message,
        )


def prepare_companies(
    companies: list[str] | str,
    bigdata: Bigdata,
) -> list[Company]:
    """Prepare the list of companies for analysis. Ensure at least one of the forms of providing
    the companies is present and ensures all elements are companies."""
    if isinstance(companies, list):
        entities = bigdata.knowledge_graph.get_entities(companies)
    elif isinstance(companies, str):
        entities = bigdata.knowledge_graph.get_entities(
            bigdata.watchlists.get(companies).items
        )
    else:
        raise ValueError(
            "Companies must be either a list of RP entity IDs or a string representing a watchlist ID."
        )

    # Ensure there is entities, there is no duplicates and all entities are companies
    if len(entities) == 0:
        raise ValueError("No entities found in the provided universe or watchlist.")

    companies = [
        Company(**e.model_dump())  # ty: ignore[missing-argument]
        for e in entities
        if e is not None and e.entity_type == "COMP"
    ]

    dedupped_companies = {c.id: c for c in companies}

    return list(dedupped_companies.values())


def build_response(
    df_company: pd.DataFrame,
    df_motivation: pd.DataFrame,
    df_labeled: pd.DataFrame,
    risk_tree: SemanticTree,
) -> RiskAnalysisResponse:
    """
    Build the response for the output of the risk analysis workflow.
    """
    risk_scoring = {}
    for record in df_company.to_dict(orient="records"):
        company = record.pop("Company")
        ticker = record.pop("Ticker")
        sector = record.pop("Sector")
        industry = record.pop("Industry")
        motivation = df_motivation.loc[df_motivation["Company"] == company][
            "Motivation"
        ].values[0]
        composite_score = record.pop("Composite Score")
        risk_scoring[company] = CompanyScoring(
            ticker=ticker,
            sector=sector,
            industry=industry,
            motivation=motivation,
            composite_score=composite_score,
            risks=RiskScore(
                root={k: v for k, v in record.items() if not math.isnan(v)}
            ),
        )

    # Return results
    return RiskAnalysisResponse(
        risk_taxonomy=RiskTaxonomy(**risk_tree._to_dict()),  # ty: ignore[missing-argument]
        risk_scoring=RiskScoring(root=risk_scoring),
        content=LabeledContent(
            root=[
                LabeledChunk(
                    time_period=record["Time Period"],
                    date=record["Date"],
                    company=record["Company"],
                    sector=record["Sector"],
                    industry=record["Industry"],
                    country=record["Country"],
                    ticker=record["Ticker"],
                    document_id=record["Document ID"],
                    headline=record["Headline"],
                    quote=record["Quote"],
                    motivation=record["Motivation"],
                    sub_scenario=record["Sub-Scenario"],
                    risk_channel=record["Risk Channel"],
                    risk_factor=record["Risk Factor"],
                    highlights=record["Highlights"],
                )
                for record in df_labeled.to_dict(orient="records")
            ]
        ),
    )


def process_request(
    request: RiskAnalysisRequest,
    bigdata: Bigdata | None,
    request_id: UUID,
    storage_manager: StorageManager,
):
    try:
        storage_manager.update_status(request_id, WorkflowStatus.IN_PROGRESS)
        if not bigdata:
            raise ValueError("Bigdata client is not initialized.")

        workflow_execution_start = datetime.now()

        resolved_companies = prepare_companies(request.companies, bigdata)

        analyzer = RiskAnalyzer(
            llm_model=request.llm_model,
            main_theme=request.main_theme,
            companies=resolved_companies,
            start_date=request.start_date,
            end_date=request.end_date,
            keywords=request.keywords,
            document_type=request.document_type,
            fiscal_year=request.fiscal_year,
            control_entities=request.control_entities,
            rerank_threshold=request.rerank_threshold,
            focus=request.focus,
        )

        analyzer.register_observer(
            WorkflowObserver(request_id=request_id, storage_manager=storage_manager)
        )

        results = analyzer.screen_companies(
            document_limit=request.document_limit,
            batch_size=request.batch_size,
            frequency=request.frequency,
        )

        df_labeled = results["df_labeled"]
        df_company = results["df_company"]
        df_motivation = results["df_motivation"]
        risk_tree = results["risk_tree"]

        workflow_execution_end = datetime.now()

        # Send log
        send_trace(
            bigdata,
            event_name=TraceEventName.RISK_ANALYZER_REPORT_GENERATED,
            trace={
                "bigdataClientVersion": version("bigdata-client"),
                "workflowStartDate": workflow_execution_start.isoformat(
                    timespec="seconds"
                ),
                "workflowEndDate": workflow_execution_end.isoformat(timespec="seconds"),
                "watchlistLength": len(resolved_companies),
            },
        )

        response = build_response(
            df_company=df_company,
            df_motivation=df_motivation,
            df_labeled=df_labeled,
            risk_tree=risk_tree,
        )

        storage_manager.mark_workflow_as_completed(request_id, request, response)
        return response

    except Exception as e:
        storage_manager.log_message(
            request_id=request_id,
            message=f"Workflow failed with error: {str(e)}",
        )
        storage_manager.update_status(request_id, WorkflowStatus.FAILED)
        raise e
