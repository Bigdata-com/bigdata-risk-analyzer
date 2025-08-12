from typing import Any, Dict, List

from pydantic import BaseModel


class TaxonomyOutput(BaseModel):
    risk_tree: Dict[str, Any]
    risk_summaries: Any
    terminal_labels: Any


class ContentOutput(BaseModel):
    df_sentences: List[Dict[str, Any]]
    df: List[Dict[str, Any]]
    df_labeled: List[Dict[str, Any]]


class RiskScoringOutput(BaseModel):
    df_company: List[Dict[str, Any]]
    df_industry: List[Dict[str, Any]]
    df_motivation: List[Dict[str, Any]]


class RiskAnalysisResponse(BaseModel):
    taxonomy: TaxonomyOutput
    content: ContentOutput
    risk_scoring: RiskScoringOutput


class ThematicScreeningResponse(BaseModel):
    theme_tree: Dict[str, Any]
    node_summaries: Any
    df_sentences: List[Dict[str, Any]]
    df_company: List[Dict[str, Any]]
    df_industry: List[Dict[str, Any]]
