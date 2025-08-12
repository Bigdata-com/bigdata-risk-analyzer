from datetime import date, timedelta, datetime
from enum import Enum
from pydantic import BaseModel, Field, model_validator
from typing import Optional, List


def seven_days_ago() -> date:
    return date.today() - timedelta(days=7)

def yesterday() -> date:
    return date.today() - timedelta(days=1)

def validate_common(values):
    # Validate input companies
    if not values.get("company_universe") and not values.get("watchlist_id"):
        raise ValueError("You must provide either 'company_universe' or 'watchlist_id'")

    # Validate date ranges
    try:
        start_date = values["start_date"]
        end_date = values["end_date"]
        if start_date > end_date:
            raise ValueError("start_date must be earlier than end_date")
    except Exception as e:
        raise ValueError(f"Invalid date format or range: {e}")

    # Validate frequency vs date range
    freq = values.get("frequency")
    delta_days = (datetime.strptime(end_date, "%Y-%m-%d") - datetime.strptime(start_date, "%Y-%m-%d")).days+1
    freq_min_days = {
        "D": 1,
        "W": 7,
        "M": 30,
        "3M": 90,
        "Y": 365
    }
    freq_value = freq.value if hasattr(freq, "value") else freq
    if freq_value not in freq_min_days:
        raise ValueError(f"Invalid frequency: {freq_value}")
    if delta_days < freq_min_days[freq_value]:
        raise ValueError(
            f"The number of days in the range between start_date={start_date} and end_date={end_date} ({delta_days} days) should be higher than the minimum required for the selected frequency '{freq_value}' ({freq_min_days[freq_value]} days)."
        )
    return values


class FrequencyEnum(str, Enum):
    daily = "D"
    weekly = "W"
    monthly = "M"
    quarterly = "3M"
    yearly = "Y"


class RiskAnalysisRequest(BaseModel):

    main_theme: str = Field(
        ...,
        example="US Import Tariffs against China",
        description="The risk scenario to analyze, e.g. US Import Tariffs against China."
    )

    focus: str = Field(
        ...,
        example=("Provide a detailed taxonomy of risks describing how new American import tariffs against China will impact US companies, their operations and strategy. Cover trade-relations risks, foreign market access risks, supply chain risks, US market sales and revenue risks (including price impacts), and intellectual property risks, provide at least 4 sub-scenarios for each risk factor."),
        description="The analyst focus that provides an expert perspective on the scenario and helps break it down into risks."
    )

    company_universe: Optional[List[str]] = Field(
        default=None,
        description="List of RavenPack entity IDs representing the companies to screen. Required if 'watchlist_id' is not provided.",
        example=["4A6F00", "D8442A"]
    )
    watchlist_id: Optional[str] = Field(
        default=None,
        description="ID of a watchlist containing companies to analyze. Required if 'company_universe' is not provided.",
        example="44118802-9104-4265-b97a-2e6d88d74893"
    )

    control_entities: Optional[dict] = Field(
        default={'place': ['China']},
        description="Dictionary specifying the countries, people, or organizations that characterize the risk scenario.",
        example={'place': ['China']}
    )

    start_date: str = Field(
        default="2025-04-01", # seven_days_ago(),
        description="Start date of the analysis window (format: YYYY-MM-DD). Defaults to 7 days ago."
    )
    end_date: str = Field(
        default="2025-04-30",  #  yesterday(),
        description="End date of the analysis window (format: YYYY-MM-DD). Defaults to yesterday."
    )
    
    keywords: List[str] = Field(default=None,
                                description="Key risk-related terms to drive content retrieval (e.g., 'tariffs').",
                                example=["Tariffs"]
    )
    
    llm_model: str = Field(
        default="openai::gpt-4o-mini",
        description="LLM model identifier used for taxonomy creation and semantic analysis."
    )
    document_type: str = Field(
        default="NEWS",
        description="Type of documents to analyze (e.g., NEWS, TRANSCRIPT, FILING)."
    )
    rerank_threshold: Optional[float] = Field(
        default=None,
        description="Optional threshold (0–1) to rerank and filter search results by relevance."
    )
    frequency: FrequencyEnum = Field(
        default=FrequencyEnum.monthly,
        description="Search frequency interval. Supported values: D (daily), W (weekly), M (monthly), Y (yearly)."
    )
    document_limit: int = Field(
        default=100,
        description="Maximum number of documents to retrieve per query to Bigdata API."
    )
    batch_size: int = Field(
        default=10,
        description="Number of entities to include in each batch for parallel querying."
    )

    @model_validator(mode="before")
    def check_entity_source(cls, values):
        return validate_common(values)
    
