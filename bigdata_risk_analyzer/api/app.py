from typing import Annotated

from bigdata_client import Bigdata
from fastapi import FastAPI, Query

from bigdata_risk_analyzer import __version__, logger
from bigdata_risk_analyzer.api.models import RiskAnalysisRequest
from bigdata_risk_analyzer.logging import logging
from bigdata_risk_analyzer.models.response import RiskAnalysisResponse
from bigdata_risk_analyzer.settings import settings

BIGDATA: Bigdata | None = None


def lifespan(app: FastAPI):
    global BIGDATA
    logger.info("Starting Risk Analyzer service")

    # Instantiate Bigdata client
    BIGDATA = Bigdata(api_key=settings.BIGDATA_API_KEY)

    logging.send_trace(
        BIGDATA,
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


@app.get("/health")
def health_check():
    return {"status": "ok", "version": __version__}


@app.post("/risk-analysis", response_model=RiskAnalysisResponse)
def analyze_risk(request: Annotated[RiskAnalysisRequest, Query()]):
    # Temporal while refactoring more code
    from bigdata_risk_analyzer.__main__ import process_request

    return process_request(request, BIGDATA)
