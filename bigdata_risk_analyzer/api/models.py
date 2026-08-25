from datetime import date, datetime, timedelta
from enum import StrEnum
from typing import List, Optional, Self

from pydantic import BaseModel, Field, model_validator
from pydantic_core import ValidationError

from bigdata_risk_analyzer.models import RiskAnalysisResponse
from bigdata_risk_analyzer.taxonomy import DEFAULT_MAX_LEAF_LABELS
from bigdata_risk_analyzer.universe import WATCHLIST_REJECTED_MESSAGE


class WorkflowStatus(StrEnum):
    QUEUED = "queued"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


# Example RP entity IDs for the demo UI's "quick fill" dropdown, sourced from
# Internal/mag7.csv. Watchlists are not supported (see WATCHLIST_REJECTED_MESSAGE).
EXAMPLE_COMPANY_LISTS: dict[str, list[str]] = {
    "MAG_7": ["E09E2B", "D8442A", "228D42", "0157B1", "4A6F00", "12E454", "DD3BB1"],
}

DEFAULT_LLM_MODEL = "gpt-5.6-luna"
DEFAULT_CHUNK_PERCENTAGE = 0.05


class RiskAnalysisRequestBase(BaseModel):
    """Shared risk-analysis request fields.

    Used directly by the CSV-upload endpoint (whose company universe comes
    from the uploaded file, not this model) and extended by
    :class:`RiskAnalysisRequest` for the JSON endpoint (which additionally
    takes a `companies` list of RP entity IDs).
    """

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
        description="Key risk-related terms to emphasize when generating the risk taxonomy (e.g. 'tariffs').",
        example=None,
    )

    llm_model: str = Field(
        default=DEFAULT_LLM_MODEL,
        description="OpenAI model used for taxonomy generation, chunk labeling, and company summaries.",
        example=DEFAULT_LLM_MODEL,
    )
    rerank_threshold: Optional[float] = Field(
        default=None,
        description="Optional relevance threshold (0-1); chunks scoring below it are discarded.",
        example=None,
    )
    chunk_percentage: float = Field(
        default=DEFAULT_CHUNK_PERCENTAGE,
        ge=0.0,
        le=1.0,
        description="Fraction (0-1, not a percentage — e.g. 0.05 = 5%) of the estimated available chunks to retrieve per taxonomy leaf. Higher values cost more and take longer.",
        example=DEFAULT_CHUNK_PERCENTAGE,
    )
    max_leaf_labels: Optional[int] = Field(
        default=DEFAULT_MAX_LEAF_LABELS,
        description="Maximum number of leaf sub-scenarios in the generated risk taxonomy. Use 0 or null for no cap.",
        example=DEFAULT_MAX_LEAF_LABELS,
    )
    max_taxonomy_depth: Optional[int] = Field(
        default=None,
        ge=2,
        description=(
            "Maximum number of levels in the generated risk taxonomy, counting the root "
            "risk node as level 1 (e.g. 3 = root + risk channel + sub-scenario, dropping "
            "the separate risk-factor layer). Defaults to the model's natural structure "
            "(root + risk channel + risk factor + sub-scenario, 4 levels)."
        ),
        example=None,
    )

    @model_validator(mode="before")
    @classmethod
    def check_date_range(cls, values):
        try:
            start_date = values["start_date"]
            end_date = values["end_date"]
            if (
                start_date > end_date
            ):  # We can compare directly as they are both ISO format strings
                raise ValueError("start_date must be earlier than end_date")
        except Exception as e:
            raise ValidationError.from_exception_data(
                title=cls.__name__,
                line_errors=[
                    {
                        "type": "value_error",
                        "loc": ("start_date", "end_date"),
                        "ctx": {"error": f"Invalid date format or range: {e}"},
                        "input": {
                            "start_date": values["start_date"],
                            "end_date": values["end_date"],
                        },
                    }
                ],
            )
        return values


class RiskAnalysisRequest(RiskAnalysisRequestBase):
    companies: list[str] | str = Field(
        ...,
        description="List of RavenPack entity IDs representing the companies to track in the generated report. Watchlists are not supported.",
        example=EXAMPLE_COMPANY_LISTS["MAG_7"],
    )

    @model_validator(mode="after")
    def reject_watchlist(self) -> Self:
        if isinstance(self.companies, str):
            raise ValueError(WATCHLIST_REJECTED_MESSAGE)
        return self


class RiskAnalyzerAcceptedResponse(BaseModel):
    request_id: str
    status: WorkflowStatus


class RiskAnalyzerStatusResponse(BaseModel):
    request_id: str
    last_updated: datetime
    status: WorkflowStatus
    logs: list[str] = Field(default_factory=list)
    report: RiskAnalysisResponse | None = None
