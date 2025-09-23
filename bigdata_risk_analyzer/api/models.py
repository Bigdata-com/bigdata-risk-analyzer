from datetime import datetime
from enum import StrEnum
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
        description="List of RavenPack entity IDs  or a watchlist ID representing the companies to screen.",
        example="44118802-9104-4265-b97a-2e6d88d74893",
    )

    control_entities: Optional[dict[str, list[str]]] = Field(
        default={"place": ["China"]},
        description="Dictionary specifying the countries, people, or organizations that characterize the risk scenario.",
        example={"place": ["China"]},
    )

    start_date: str = Field(
        default="2024-01-01",
        description="Start date of the analysis window (format: YYYY-MM-DD). Defaults to 60 days ago.",
    )
    end_date: str = Field(
        default="2024-12-31",
        description="End date of the analysis window (format: YYYY-MM-DD). Defaults to yesterday.",
    )

    keywords: List[str] = Field(
        default=None,
        description="Key risk-related terms to drive content retrieval (e.g., 'tariffs').",
        example=["Tariffs"],
    )

    llm_model: str = Field(
        default="openai::gpt-4o-mini",
        description="LLM model identifier used for taxonomy creation and semantic analysis.",
    )
    document_type: Literal[DocumentType.TRANSCRIPTS] = Field(
        default=DocumentType.TRANSCRIPTS,
        description="Type of documents to analyze (only transcript supported for now).",
    )
    fiscal_year: Optional[int] = Field(
        description="Fiscal year to filter documents (format: YYYY).",
        example=2024,
    )
    rerank_threshold: Optional[float] = Field(
        default=None,
        description="Optional threshold (0-1) to rerank and filter search results by relevance.",
    )
    frequency: FrequencyEnum = Field(
        default=FrequencyEnum.monthly,
        description="Search frequency interval. Supported values: D (daily), W (weekly), M (monthly), Y (yearly).",
    )
    document_limit: int = Field(
        default=100,
        description="Maximum number of documents to retrieve per query to Bigdata API.",
    )
    batch_size: int = Field(
        default=10,
        description="Number of entities to include in each batch for parallel querying.",
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
