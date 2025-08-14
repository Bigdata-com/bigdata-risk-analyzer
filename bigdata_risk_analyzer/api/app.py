from typing import Annotated

from bigdata_client import Bigdata
from fastapi import FastAPI, Query

from bigdata_risk_analyzer import __version__, logger
from bigdata_risk_analyzer.api.models import RiskAnalysisRequest
from bigdata_risk_analyzer.models import RiskAnalysisResponse
from bigdata_risk_analyzer.service import DocumentType, process_request
from bigdata_risk_analyzer.settings import settings
from bigdata_risk_analyzer.traces import TraceEventName, send_trace

BIGDATA: Bigdata | None = None


def lifespan(app: FastAPI):
    global BIGDATA
    logger.info("Starting Risk Analyzer service")

    # Instantiate Bigdata client
    BIGDATA = Bigdata(api_key=settings.BIGDATA_API_KEY)

    send_trace(
        BIGDATA,
        event_name=TraceEventName.SERVICE_START,
        trace={
            "version": __version__,
        },
    )
    yield


app = FastAPI(
    title="Risk Analyzer API",
    description="API for analyzing corporate exposure to specific risk channels  using Bigdata.com",
    version=__version__,
    lifespan=lifespan,
)


@app.get("/health")
def health_check():
    return {"status": "ok", "version": __version__}


@app.post("/risk-analysis", response_model=RiskAnalysisResponse)
def analyze_risk(request: Annotated[RiskAnalysisRequest, Query()]):
    return process_request(
        company_universe=request.company_universe,
        watchlist_id=request.watchlist_id,
        llm_model=request.llm_model,
        main_theme=request.main_theme,
        start_date=request.start_date,
        end_date=request.end_date,
        keywords=request.keywords,
        document_type=DocumentType[request.document_type],
        control_entities=request.control_entities,
        rerank_threshold=request.rerank_threshold,
        focus=request.focus,
        frequency=request.frequency,
        document_limit=request.document_limit,
        batch_size=request.batch_size,
        bigdata=BIGDATA,
    )
