from datetime import date, datetime, timedelta
from enum import Enum, StrEnum
from typing import List, Literal, Optional, Self

from bigdata_client.models.search import DocumentType
from pydantic import BaseModel, Field, model_validator

from bigdata_risk_analyzer.models import RiskAnalysisResponse


class FrequencyEnum(StrEnum):
    daily = "D"
    weekly = "W"
    monthly = "M"
    quarterly = "3M"
    yearly = "Y"


class WorkflowStatus(StrEnum):
    QUEUED = "queued"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class WatchlistExample(BaseModel):
    id: str = Field(..., description="The unique identifier for the watchlist.")
    name: str = Field(..., description="The name of the watchlist.")


class ExampleWatchlists(Enum):
    MAG_7 = WatchlistExample(
        id="814d0944-a2c1-44f6-8b42-a70c0795428e", name="Magnificent 7"
    )
    MILITARIZATION = WatchlistExample(
        id="beda15f2-b3ba-44dd-80c6-79d8a1bba764", name="Militarization"
    )
    HEALTH_AND_WELLNESS = WatchlistExample(
        id="eea133f7-ddc6-44bd-bd66-72f1e31dd7db", name="Health and Wellness Stocks"
    )
    HIGH_FINANCE = WatchlistExample(
        id="f7801965-ed54-4ff1-b524-b4ecee3bc858", name="High Finance Stocks"
    )
    FIN_INNOV = WatchlistExample(
        id="74cff065-9b00-4f6c-8690-5dff8cbbf3e8", name="FinTech Innovators"
    )
    AI_SZN = WatchlistExample(id="db8478c9-34db-4975-8e44-b1ff764098ac", name="AI Szn")

    def __iter__(self):
        """Allows to create a dict from the enum
        >>> dict(ExampleWatchlists)
        {'POINT_72': {'id': '9ab396cf-a2bb-4c91-b9bf-ed737905803e', 'name': 'Point 72 Holdings'}, ...}
        """
        yield self.name
        yield self.value.model_dump()


class RiskAnalysisRequest(BaseModel):
    main_theme: str = Field(
        ...,
        example="US Import Tariffs against China",
        description="The risk scenario to analyze, e.g. US Import Tariffs against China.",
    )

    focus: str = Field(
        ...,
        example=(
            "Provide a detailed taxonomy of risks describing how new American import tariffs against China will impact US companies, their operations and strategy. Cover trade-relations risks, foreign market access risks, supply chain risks, US market sales and revenue risks (including price impacts), and intellectual property risks, provide at least 4 sub-scenarios for each risk factor."
        ),
        description="The analyst focus that provides an expert perspective on the scenario and helps break it down into risks.",
    )

    companies: list[str] | str = Field(
        ...,
        description="List of RavenPack entity IDs  or a watchlist ID representing the companies to track in the generated brief.",
        example=ExampleWatchlists.MAG_7.value.id,
    )

    control_entities: Optional[dict[str, list[str]]] = Field(
        default=None,
        description="Dictionary specifying the countries, people, or organizations that characterize the risk scenario.",
        example=None,
    )

    start_date: str = Field(
        default="2024-01-01",
        description="Start date of the analysis window (format: YYYY-MM-DD). Defaults to 6 months ago.",
        example=(date.today() - timedelta(days=30)).isoformat(),
    )
    end_date: str = Field(
        default="2024-12-31",
        description="End date of the analysis window (format: YYYY-MM-DD). Defaults to yesterday.",
        example=date.today().isoformat(),
    )

    keywords: List[str] | None = Field(
        default=None,
        description="Key risk-related terms to drive content retrieval (e.g., 'tariffs').",
        example=None,
    )

    llm_model: str = Field(
        default="openai::gpt-4o-mini",
        description="LLM model identifier used for taxonomy creation and semantic analysis.",
        example="openai::gpt-4o-mini",
    )
    document_type: Literal[DocumentType.NEWS] = Field(
        default=DocumentType.NEWS,
        description="Type of documents to analyze (only transcript supported for now).",
        example=DocumentType.NEWS,
    )
    fiscal_year: int | list[int] | None = Field(
        default=None,
        description="Fiscal year to filter documents (format: YYYY).",
        example=None,
    )
    rerank_threshold: Optional[float] = Field(
        default=None,
        description="Optional threshold (0-1) to rerank and filter search results by relevance.",
        example=None,
    )
    frequency: FrequencyEnum = Field(
        default=FrequencyEnum.monthly,
        description="Search frequency interval. Supported values: D (daily), W (weekly), M (monthly), Y (yearly).",
        example=FrequencyEnum.monthly,
    )
    document_limit: int = Field(
        default=100,
        description="Maximum number of documents to retrieve per query to Bigdata API.",
        example=100,
    )
    batch_size: int = Field(
        default=10,
        description="Number of entities to include in each batch for parallel querying.",
        example=10,
    )

    @model_validator(mode="after")
    def fiscal_year_only_when_transcrips_or_filings(self) -> Self:
        if self.fiscal_year is not None and self.document_type not in {
            DocumentType.FILINGS,
            DocumentType.TRANSCRIPTS,
            DocumentType.ALL,
        }:
            raise ValueError(
                "fiscal_year can only be set when document_type is FILINGS or TRANSCRIPTS"
            )
        return self

    @model_validator(mode="before")
    def check_date_range(cls, values):
        try:
            start_date = values["start_date"]
            end_date = values["end_date"]
            if (
                start_date > end_date
            ):  # We can compare directly as they are both ISO format strings
                raise ValueError("start_date must be earlier than end_date")
        except Exception as e:
            raise ValueError(f"Invalid date format or range: {e}")
        return values

    @model_validator(mode="before")
    def check_frequency_vs_date_range(cls, values):
        start_date = values["start_date"]
        end_date = values["end_date"]
        freq = values.get("frequency")
        delta_days = (
            datetime.fromisoformat(end_date) - datetime.fromisoformat(start_date)
        ).days + 1  # Adjust for inclusive range
        freq_min_days = {"D": 1, "W": 7, "M": 30, "3M": 90, "Y": 365}
        if isinstance(freq, str):
            freq = FrequencyEnum(freq)
        if not isinstance(freq, FrequencyEnum):
            raise ValueError(f"Invalid frequency: {freq}")
        if delta_days < freq_min_days[freq.value]:
            raise ValueError(
                f"The number of days in the range between start_date={start_date} and end_date={end_date} ({delta_days} days) should be higher than the minimum required for the selected frequency '{freq.value}' ({freq_min_days[freq.value]} days)."
            )
        return values


class RiskAnalyzerAcceptedResponse(BaseModel):
    request_id: str
    status: WorkflowStatus


class RiskAnalyzerStatusResponse(BaseModel):
    request_id: str
    last_updated: datetime
    status: WorkflowStatus
    logs: list[str] = Field(default_factory=list)
    report: RiskAnalysisResponse | None = None
