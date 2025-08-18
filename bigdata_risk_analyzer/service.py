import math
from datetime import datetime
from importlib.metadata import version

import pandas as pd
from bigdata_client import Bigdata
from bigdata_client.models.entities import Company
from bigdata_client.models.search import DocumentType
from bigdata_research_tools.themes import ThemeTree
from bigdata_research_tools.workflows.risk_analyzer import RiskAnalyzer
from fastapi import HTTPException

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


def prepare_companies(
    company_universe: list[str] | None,
    watchlist_id: str | None,
    bigdata: Bigdata,
) -> list[Company]:
    """Prepare the list of companies for analysis. Ensure at least one of the forms of providing
    the companies is present and ensures all elements are companies."""
    if company_universe:
        entities = bigdata.knowledge_graph.get_entities(company_universe)
    elif watchlist_id:
        entities = bigdata.knowledge_graph.get_entities(
            bigdata.watchlists.get(watchlist_id).items
        )
    else:
        raise ValueError("Either company_universe or watchlist_id must be provided.")

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
    risk_tree: ThemeTree,
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
    company_universe: list[str] | None,
    watchlist_id: str | None,
    llm_model: str,
    main_theme: str,
    start_date: str,
    end_date: str,
    keywords: list[str],
    document_type: DocumentType,
    control_entities: dict[str, list[str]] | None,
    rerank_threshold: float | None,
    focus: str,
    frequency: str,
    document_limit: int,
    batch_size: int,
    bigdata: Bigdata | None,
):
    if not bigdata:
        raise ValueError("Bigdata client is not initialized.")
    try:
        workflow_execution_start = datetime.now()

        companies = prepare_companies(company_universe, watchlist_id, bigdata)

        analyzer = RiskAnalyzer(
            llm_model=llm_model,
            main_theme=main_theme,
            companies=companies,
            start_date=start_date,
            end_date=end_date,
            keywords=keywords,
            document_type=document_type,
            control_entities=control_entities,
            rerank_threshold=rerank_threshold,
            focus=focus,
        )

        # Run workflow
        # 1) Taxonomy creation
        risk_tree, risk_summaries, terminal_labels = analyzer.create_taxonomy()

        # 2) Content Retrieval: Searches news for relevant discussions
        df_sentences = analyzer.retrieve_results(
            sentences=risk_summaries,
            freq=frequency,
            document_limit=document_limit,
            batch_size=batch_size,
        )

        # 3) Semantic Labeling: Uses AI to categorize content into appropriate sub-scenarios
        _, df_labeled = analyzer.label_search_results(
            df_sentences=df_sentences,
            terminal_labels=terminal_labels,
            risk_tree=risk_tree,
            additional_prompt_fields=["entity_sector", "entity_industry", "headline"],
        )

        # 4) Risk Scoring: Calculates company and industry-level exposure scores
        df_company, _, df_motivation = analyzer.generate_results(df_labeled)

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
                "watchlistLength": len(companies),
            },
        )

        return build_response(
            df_company=df_company,
            df_motivation=df_motivation,
            df_labeled=df_labeled,
            risk_tree=risk_tree,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
