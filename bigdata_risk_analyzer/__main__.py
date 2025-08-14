from datetime import datetime
from importlib.metadata import version

from bigdata_client.models.search import DocumentType
from bigdata_research_tools.workflows.risk_analyzer import RiskAnalyzer
from fastapi import HTTPException

from bigdata_risk_analyzer.api.app import app
from bigdata_risk_analyzer.api.models import RiskAnalysisRequest
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


def process_request(req: RiskAnalysisRequest, bigdata):
    try:
        workflow_execution_start = datetime.now()

        if req.company_universe:
            companies = bigdata.knowledge_graph.get_entities(req.company_universe)
        elif req.watchlist_id:
            companies = bigdata.knowledge_graph.get_entities(
                bigdata.watchlists.get(req.watchlist_id).items
            )
        else:
            raise ValueError(
                "Either company_universe or watchlist_id must be provided."
            )

        analyzer = RiskAnalyzer(
            llm_model=req.llm_model,
            main_theme=req.main_theme,
            companies=companies,
            start_date=req.start_date,
            end_date=req.end_date,
            keywords=req.keywords,
            document_type=DocumentType[req.document_type],
            control_entities=req.control_entities,
            rerank_threshold=req.rerank_threshold,
            focus=req.focus,
        )

        # Run workflow
        # 1) Taxonomy creation
        risk_tree, risk_summaries, terminal_labels = analyzer.create_taxonomy()

        # 2) Content Retrieval: Searches news for relevant discussions
        df_sentences = analyzer.retrieve_results(
            sentences=risk_summaries,
            freq=req.frequency,
            document_limit=req.document_limit,
            batch_size=req.batch_size,
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
                risks=RiskScore(root=record),
            )

        # Return results
        return RiskAnalysisResponse(
            risk_taxonomy=RiskTaxonomy(**risk_tree._to_dict()),  # ty: ignore[missing-argument]
            risk_scoring=RiskScoring(root=risk_scoring),
            content=LabeledContent(
                [
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

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
