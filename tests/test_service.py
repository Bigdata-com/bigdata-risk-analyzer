import pandas as pd
import pytest

from bigdata_risk_analyzer.models import (
    LabeledContent,
    RiskAnalysisResponse,
    RiskScoring,
    RiskTaxonomy,
)
from bigdata_risk_analyzer.service import ThemeTree, build_response


@pytest.fixture
def df_company():
    return pd.DataFrame(
        [
            {
                "Company": "A",
                "Ticker": "T1",
                "Sector": "S1",
                "Industry": "I1",
                "Composite Score": 55,
                "Risk1": 55,
            },
            {
                "Company": "B",
                "Ticker": "T2",
                "Sector": "S2",
                "Industry": "I2",
                "Composite Score": 50,
                "Risk1": 45,
                "Risk 2 with long name": 5,
            },
        ]
    )


@pytest.fixture
def df_motivation():
    return pd.DataFrame(
        [
            {"Company": "A", "Motivation": "Growth"},
            {"Company": "B", "Motivation": "Decline"},
        ]
    )


@pytest.fixture
def df_labeled():
    return pd.DataFrame(
        [
            {
                "Time Period": "2025Q1",
                "Date": "2025-01-01",
                "Company": "A",
                "Sector": "S1",
                "Industry": "I1",
                "Country": "US",
                "Ticker": "T1",
                "Document ID": "D1",
                "Headline": "Headline1",
                "Quote": "Quote1",
                "Motivation": "Growth",
                "Sub-Scenario": "Sub1",
                "Risk Channel": "Channel1",
                "Risk Factor": "Factor1",
                "Highlights": [],
            },
            {
                "Time Period": "2025Q1",
                "Date": "2025-01-02",
                "Company": "B",
                "Sector": "S2",
                "Industry": "I2",
                "Country": "UK",
                "Ticker": "T2",
                "Document ID": "D2",
                "Headline": "Headline2",
                "Quote": "Quote2",
                "Motivation": "Decline",
                "Sub-Scenario": "Sub2",
                "Risk Channel": "Channel2",
                "Risk Factor": "Factor2",
                "Highlights": [
                    "Highlight2.1",
                    "Highlight2.2",
                ],
            },
        ]
    )


@pytest.fixture
def risk_tree():
    return ThemeTree(
        label="Root",
        node=1,
        summary="Root node",
        children=[
            ThemeTree(label="Risk1", node=2, summary="Risk1 for company"),
            ThemeTree(
                label="Risk 2 with long name", node=3, summary="Risk 2 for company"
            ),
        ],
    )


def test_build_response(df_company, df_motivation, df_labeled, risk_tree):
    response = build_response(df_company, df_motivation, df_labeled, risk_tree)
    assert isinstance(response, RiskAnalysisResponse)
    assert isinstance(response.risk_taxonomy, RiskTaxonomy)
    assert isinstance(response.risk_scoring, RiskScoring)
    assert isinstance(response.content, LabeledContent)
    assert len(response.content.root) == 2
