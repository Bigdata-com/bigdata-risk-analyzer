import pandas as pd
import pytest

from bigdata_risk_analyzer.models import (
    LabeledContent,
    RiskAnalysisResponse,
    RiskScoring,
    RiskTaxonomy,
)
from bigdata_risk_analyzer.service import build_response
from bigdata_risk_analyzer.taxonomy import Node


@pytest.fixture
def root():
    return Node(
        node=1,
        label="Root",
        summary="Root node",
        children=[
            Node(node=2, label="Risk1", summary="Risk1 for company"),
            Node(node=3, label="Risk 2 with long name", summary="Risk 2 for company"),
        ],
    )


@pytest.fixture
def universe_df():
    return pd.DataFrame(
        [
            {
                "RP_ENTITY_ID": "AAAAAA",
                "COMPANY_NAME": "A",
                "TICKER": "T1",
                "SECTOR": "S1",
                "INDUSTRY": "I1",
                "COUNTRY": "US",
            },
            {
                "RP_ENTITY_ID": "BBBBBB",
                "COMPANY_NAME": "B",
                "TICKER": "T2",
                "SECTOR": "S2",
                "INDUSTRY": "I2",
                "COUNTRY": "UK",
            },
        ]
    )


@pytest.fixture
def screener_df():
    return pd.DataFrame(
        [
            {
                "sentence_id": "0",
                "text": "Quote1",
                "document_id": "D1",
                "headline": "Headline1",
                "timestamp": "2025-01-01T00:00:00+00:00",
                "company_name": "A",
                "motivation": "Growth",
                "label": "Risk1",
                "summary": "Summary for A",
            },
            {
                "sentence_id": "1",
                "text": "Quote2",
                "document_id": "D2",
                "headline": "Headline2",
                "timestamp": "2025-01-02T00:00:00+00:00",
                "company_name": "B",
                "motivation": "Decline",
                "label": "Risk 2 with long name",
                "summary": "Summary for B",
            },
        ]
    )


def test_build_response(screener_df, root, universe_df):
    response = build_response(screener_df, root, universe_df)
    assert isinstance(response, RiskAnalysisResponse)
    assert isinstance(response.risk_taxonomy, RiskTaxonomy)
    assert isinstance(response.risk_scoring, RiskScoring)
    assert isinstance(response.content, LabeledContent)
    assert len(response.content.root) == 2
    assert set(response.risk_scoring.root.keys()) == {"A", "B"}
    assert response.risk_scoring.root["A"].composite_score == 1
