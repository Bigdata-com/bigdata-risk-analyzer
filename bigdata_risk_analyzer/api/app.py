from functools import partial
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import (
    BackgroundTasks,
    Body,
    Depends,
    FastAPI,
    File,
    Form,
    HTTPException,
    Security,
    UploadFile,
)
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError
from sqlmodel import Session, SQLModel, create_engine

from bigdata_risk_analyzer import LOG_LEVEL, __version__, logger
from bigdata_risk_analyzer.api.models import (
    EXAMPLE_COMPANY_LISTS,
    RiskAnalysisRequest,
    RiskAnalysisRequestBase,
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
from bigdata_risk_analyzer.universe import build_universe_from_ids, load_universe_csv

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
    logger.info("Starting Risk Analyzer service")
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
    template_values = get_example_values_from_schema(RiskAnalysisRequest)
    template_values["example_companies"] = EXAMPLE_COMPANY_LISTS
    template_values["demo_mode"] = settings.DEMO_MODE
    template_values["version"] = f"v{__version__}"

    return HTMLResponse(
        content=loader.get_template("api/index.html.jinja").render(**template_values),
        media_type="text/html",
    )


def _queue_analysis(
    request: RiskAnalysisRequestBase,
    universe_df,
    background_tasks: BackgroundTasks,
    storage_manager: StorageManager,
) -> JSONResponse:
    request_id: UUID = uuid4()
    storage_manager.update_status(request_id, WorkflowStatus.QUEUED)

    background_tasks.add_task(
        partial(
            process_request,
            request,
            universe_df=universe_df,
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


@app.post("/risk-analysis", response_model=RiskAnalysisResponse)
def analyze_risk(
    request: Annotated[RiskAnalysisRequest, Body()],
    background_tasks: BackgroundTasks,
    storage_manager: StorageManager = Depends(get_storage_manager),
    _: str = Security(query_scheme),
) -> JSONResponse:
    """This endpoint starts the generation of the risk analyzer workflow on the background
    and will return a request_id that can be used to check the status of the request in the
    `/status/{request_id}` endpoint.

    `companies` must be a list of RavenPack entity IDs. Watchlists are not supported; upload
    a CSV via `/risk-analysis/upload` for larger or metadata-rich universes.
    """
    try:
        universe_df = build_universe_from_ids(request.companies, api_key=settings.BIGDATA_API_KEY)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return _queue_analysis(request, universe_df, background_tasks, storage_manager)


@app.post("/risk-analysis/upload", response_model=RiskAnalysisResponse)
def analyze_risk_upload(
    background_tasks: BackgroundTasks,
    file: Annotated[UploadFile, File(description="Universe CSV with RP_ENTITY_ID + COMPANY_NAME columns.")],
    request: Annotated[
        str, Form(description="JSON-encoded request body (same fields as POST /risk-analysis, minus companies).")
    ],
    storage_manager: StorageManager = Depends(get_storage_manager),
    _: str = Security(query_scheme),
) -> JSONResponse:
    """Same as `POST /risk-analysis`, but the company universe comes from an uploaded CSV
    (columns: `RP_ENTITY_ID` [alias `RP_COMPANY_ID`], `COMPANY_NAME`, and optionally
    `TICKER`/`SECTOR`/`INDUSTRY`/`COUNTRY`) instead of a list of RP entity IDs.
    """
    try:
        parsed_request = RiskAnalysisRequestBase.model_validate_json(request)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors())

    try:
        universe_df = load_universe_csv(file.file, api_key=settings.BIGDATA_API_KEY)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return _queue_analysis(parsed_request, universe_df, background_tasks, storage_manager)


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
