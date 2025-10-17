from pydantic import BaseModel, RootModel


class RiskTaxonomy(BaseModel):
    label: str
    node: int
    summary: str | None
    children: list["RiskTaxonomy"] = []
    keywords: list[str] | None = None


class LabeledChunk(BaseModel):
    time_period: str
    date: str
    company: str
    sector: str
    industry: str
    country: str
    ticker: str
    document_id: str
    headline: str
    quote: str
    motivation: str
    sub_scenario: str
    risk_channel: str
    risk_factor: str
    highlights: list[str]


class LabeledContent(RootModel):
    root: list[LabeledChunk] = []


class RiskScore(RootModel):
    root: dict[str, int]


class CompanyScoring(BaseModel):
    ticker: str
    sector: str
    industry: str
    composite_score: int
    motivation: str | None
    risks: RiskScore


class RiskScoring(RootModel):
    root: dict[str, CompanyScoring]


class RiskAnalysisResponse(BaseModel):
    risk_scoring: RiskScoring
    risk_taxonomy: RiskTaxonomy
    content: LabeledContent | None = None
