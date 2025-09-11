from typing import Annotated

from bigdata_client import Bigdata
from fastapi import Body, FastAPI, Security
from fastapi.responses import HTMLResponse

from bigdata_risk_analyzer import __version__, logger
from bigdata_risk_analyzer.api.models import RiskAnalysisRequest
from bigdata_risk_analyzer.api.secure import query_scheme
from bigdata_risk_analyzer.api.utils import get_example_values_from_schema
from bigdata_risk_analyzer.models import RiskAnalysisResponse
from bigdata_risk_analyzer.service import DocumentType, process_request
from bigdata_risk_analyzer.settings import settings
from bigdata_risk_analyzer.templates import loader
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


@app.get("/")
async def sample_frontend(_: str = Security(query_scheme)):
    # Get example values from the schema for all fields
    example_values = get_example_values_from_schema(RiskAnalysisRequest)

    return HTMLResponse(
        content=loader.get_template("api/frontend.html.jinja").render(**example_values)
    )


@app.post("/risk-analysis", response_model=RiskAnalysisResponse)
def analyze_risk(
    request: Annotated[RiskAnalysisRequest, Body()], _: str = Security(query_scheme)
):
    # While we improve the UX of working with several document types with different sets of parameters
    # we will limit the document type to transcripts
    DOCUMENT_TYPE = DocumentType.TRANSCRIPTS

    return process_request(
        companies=request.companies,
        llm_model=request.llm_model,
        main_theme=request.main_theme,
        start_date=request.start_date,
        end_date=request.end_date,
        keywords=request.keywords,
        document_type=DOCUMENT_TYPE,
        control_entities=request.control_entities,
        rerank_threshold=request.rerank_threshold,
        focus=request.focus,
        frequency=request.frequency,
        fiscal_year=request.fiscal_year,
        document_limit=request.document_limit,
        batch_size=request.batch_size,
        bigdata=BIGDATA,
    )
