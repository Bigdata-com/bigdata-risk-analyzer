import os
from datetime import datetime
from importlib.metadata import version

from bigdata_client import Bigdata
from bigdata_client.models.search import DocumentType
from bigdata_research_tools.workflows.risk_analyzer import RiskAnalyzer
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

from bigdata_risk_analyzer import __version__, logger
from bigdata_risk_analyzer.logging import logging
from bigdata_risk_analyzer.models.request import RiskAnalysisRequest
from bigdata_risk_analyzer.models.response import (
    ContentOutput,
    RiskAnalysisResponse,
    RiskScoringOutput,
    TaxonomyOutput,
)

# Load environment variables
load_dotenv()
BIGDATA_USERNAME = os.getenv("BIGDATA_USERNAME")
BIGDATA_PASSWORD = os.getenv("BIGDATA_PASSWORD")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not all([BIGDATA_USERNAME, BIGDATA_PASSWORD, OPENAI_API_KEY]):
    raise EnvironmentError("Missing credentials in .env file")

# Instantiate Bigdata client
bigdata = Bigdata(BIGDATA_USERNAME, BIGDATA_PASSWORD)


def lifespan(app: FastAPI):
    logger.info("Starting Risk Analyzer service")
    logging.send_trace(
        bigdata,
        event_name=logging.TraceEventName.SERVICE_START,
        trace={
            "version": __version__,
        },
    )
    yield


app = FastAPI(
    title="Risk Analyzer & Thematic Screener API",
    description="API for analyzing corporate exposure to specific risk channels and thematic exposure using Bigdata.com",
    lifespan=lifespan,
)


@app.post("/risk-analysis", response_model=RiskAnalysisResponse)
def analyze_risk(req: RiskAnalysisRequest):
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
        df, df_labeled = analyzer.label_search_results(
            df_sentences=df_sentences,
            terminal_labels=terminal_labels,
            risk_tree=risk_tree,
            additional_prompt_fields=["entity_sector", "entity_industry", "headline"],
        )

        # 4) Risk Scoring: Calculates company and industry-level exposure scores
        df_company, df_industry, df_motivation = analyzer.generate_results(df_labeled)

        workflow_execution_end = datetime.now()

        # Send log
        logging.send_trace(
            bigdata,
            event_name=logging.TraceEventName.RISK_ANALYZER_REPORT_GENERATED,
            trace={
                "bigdataClientVersion": version("bigdata-client"),
                "workflowStartDate": workflow_execution_start.isoformat(
                    timespec="seconds"
                ),
                "workflowEndDate": workflow_execution_end.isoformat(timespec="seconds"),
                "watchlistLength": len(companies),
            },
        )

        # Return results
        return RiskAnalysisResponse(
            taxonomy=TaxonomyOutput(
                risk_tree=vars(risk_tree)
                if hasattr(risk_tree, "__dict__")
                else str(risk_tree),
                risk_summaries=risk_summaries,
                terminal_labels=terminal_labels,
            ),
            content=ContentOutput(
                df_sentences=df_sentences.to_dict(orient="records"),
                df=df.to_dict(orient="records"),
                df_labeled=df_labeled.to_dict(orient="records"),
            ),
            risk_scoring=RiskScoringOutput(
                df_company=df_company.to_dict(orient="records"),
                df_industry=df_industry.to_dict(orient="records"),
                df_motivation=df_motivation.to_dict(orient="records"),
            ),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
