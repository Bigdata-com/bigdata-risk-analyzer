from functools import partial
from typing import Annotated
from uuid import UUID, uuid4

from bigdata_client import Bigdata
from bigdata_client.models.search import DocumentType
from fastapi import BackgroundTasks, Body, Depends, FastAPI, HTTPException, Security
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, SQLModel, create_engine

from bigdata_risk_analyzer import LOG_LEVEL, __version__, logger
from bigdata_risk_analyzer.api.models import (
    ExampleWatchlists,
    RiskAnalysisRequest,
    RiskAnalyzerAcceptedResponse,
    RiskAnalyzerStatusResponse,
    WorkflowStatus,
)
from bigdata_risk_analyzer.api.secure import query_scheme
from bigdata_risk_analyzer.api.storage import StorageManager
from bigdata_risk_analyzer.api.utils import get_example_values_from_schema
from bigdata_risk_analyzer.models import RiskAnalysisResponse
from bigdata_risk_analyzer.service import process_request
from bigdata_risk_analyzer.settings import settings
from bigdata_risk_analyzer.templates import loader
from bigdata_risk_analyzer.traces import TraceEventName, send_trace

BIGDATA: Bigdata | None = None
engine = create_engine(settings.DB_STRING, echo=LOG_LEVEL == "DEBUG")


def create_db_and_tables():
    logger.info("Setting up data storage", db_string=settings.DB_STRING)
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


def get_storage_manager(session: Session = Depends(get_session)) -> StorageManager:
    return StorageManager(session)


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
    create_db_and_tables()
    yield


app = FastAPI(
    title="Risk Analyzer API",
    description="API for analyzing corporate exposure to specific risk channels  using Bigdata.com",
    version=__version__,
    lifespan=lifespan,
)

app.mount("/static", StaticFiles(directory=settings.STATIC_DIR), name="static")


@app.get(
    "/health",
    summary="Health check endpoint",
)
def health_check():
    return {"status": "ok", "version": __version__}


@app.get(
    "/",
    summary="Example frontend for testing the risk analyzer.",
    response_class=HTMLResponse,
)
async def sample_frontend(_: str = Security(query_scheme)) -> HTMLResponse:
    # Get example values from the schema for all fields
    example_values = get_example_values_from_schema(RiskAnalysisRequest)
    example_values["example_watchlists"] = list(dict(ExampleWatchlists).values())

    return HTMLResponse(
        content=loader.get_template("api/index.html.jinja").render(**example_values),
        media_type="text/html",
    )


@app.post("/risk-analysis", response_model=RiskAnalysisResponse)
def analyze_risk(
    request: Annotated[RiskAnalysisRequest, Body()],
    background_tasks: BackgroundTasks,
    storage_manager: StorageManager = Depends(get_storage_manager),
    _: str = Security(query_scheme),
) -> JSONResponse:
    """This endpoints starts the generation of therisk analyzer workflow on the background
    and will return a request_id that can be used to check the status of the request in the
    `/status/{request_id}` endpoint.
    Note: for now, it only supports news as document type.
    """
    # While we improve the UX of working with several document types with different sets of parameters
    # we will limit the document type to news
    DOCUMENT_TYPE = DocumentType.NEWS
    request.document_type = DOCUMENT_TYPE
    request_id = uuid4()

    storage_manager.update_status(request_id, WorkflowStatus.QUEUED)

    background_tasks.add_task(
        partial(
            process_request,
            request,
            bigdata=BIGDATA,
            request_id=request_id,
            storage_manager=storage_manager,
        )
    )
    return JSONResponse(
        status_code=202,
        content=RiskAnalyzerAcceptedResponse(
            request_id=str(request_id), status=WorkflowStatus.QUEUED
        ).model_dump(),
    )


@app.get(
    "/status/{request_id}",
    summary="Get the status of a risk analyzer report",
)
def get_status(
    request_id: UUID,
    storage_manager: StorageManager = Depends(get_storage_manager),
    _: str = Security(query_scheme),
) -> RiskAnalyzerStatusResponse:
    """Get the status of a risk analyzer report by its request_id. If the report is still running,
    you will get the current status and logs. If the report is completed, you will also get the
    complete report"""
    report = storage_manager.get_report(request_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Request ID not found")
    return report
