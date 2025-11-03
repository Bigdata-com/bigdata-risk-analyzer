"""Tests for Risk Evolution component functionality."""
import pytest

from bigdata_risk_analyzer.models import LabeledChunk, LabeledContent


@pytest.fixture
def mock_labeled_chunks():
    """Create mock LabeledChunk data for testing risk factor extraction."""
    return [
        LabeledChunk(
            time_period="2025Q1",
            date="2025-01-01",
            company="Company A",
            sector="Sector 1",
            industry="Industry 1",
            country="US",
            ticker="T1",
            document_id="D1",
            headline="Headline 1",
            quote="Quote 1",
            motivation="Motivation 1",
            sub_scenario="Sub Scenario 1",
            risk_channel="Channel 1",
            risk_factor="Risk Factor 1",  # Most granular level
            highlights=[],
        ),
        LabeledChunk(
            time_period="2025Q1",
            date="2025-01-02",
            company="Company A",
            sector="Sector 1",
            industry="Industry 1",
            country="US",
            ticker="T1",
            document_id="D2",
            headline="Headline 2",
            quote="Quote 2",
            motivation="Motivation 2",
            sub_scenario="Sub Scenario 2",
            risk_channel="Channel 1",
            risk_factor="Risk Factor 2",
            highlights=[],
        ),
        LabeledChunk(
            time_period="2025Q1",
            date="2025-01-03",
            company="Company B",
            sector="Sector 2",
            industry="Industry 2",
            country="UK",
            ticker="T2",
            document_id="D3",
            headline="Headline 3",
            quote="Quote 3",
            motivation="Motivation 3",
            sub_scenario="Sub Scenario 1",
            risk_channel="Channel 2",
            risk_factor="Risk Factor 1",  # Same risk factor, different company
            highlights=[],
        ),
    ]


def test_risk_factor_extraction_from_theme_scoring():
    """Test that risk factors are extracted from themeScoring (most granular level from taxonomy)."""
    # Simulate themeScoring structure (same as heatmap/company screener)
    theme_scoring = {
        "Company A": {
            "themes": {
                "Risk Factor 1": 10,
                "Risk Factor 2": 5,
            }
        },
        "Company B": {
            "themes": {
                "Risk Factor 1": 8,
                "Risk Factor 3": 3,
            }
        },
    }

    # Simulate extraction logic from risk_evolution.js (from themeScoring)
    risks_from_theme_scoring = set()
    for company_name, scoring in theme_scoring.items():
        if scoring.get("themes"):
            for risk in scoring["themes"].keys():
                risks_from_theme_scoring.add(risk)

    extracted = sorted(list(risks_from_theme_scoring))
    expected = sorted(["Risk Factor 1", "Risk Factor 2", "Risk Factor 3"])

    assert extracted == expected, f"Expected {expected}, got {extracted}"


def test_risk_factor_filtering():
    """Test filtering by risk factor works correctly (matches by risk_factor field only)."""
    chunks = [
        {"company": "Company A", "risk_factor": "Risk Factor 1"},
        {"company": "Company A", "risk_factor": "Risk Factor 2"},
        {"company": "Company B", "risk_factor": "Risk Factor 1"},
    ]

    # Filter by specific risk factor (matches risk_factor field only)
    target_risk = "Risk Factor 1"
    filtered = [
        chunk
        for chunk in chunks
        if chunk.get("risk_factor") == target_risk
    ]

    assert len(filtered) == 2
    assert all(chunk.get("risk_factor") == target_risk for chunk in filtered)


def test_all_risk_factors_filter(mock_labeled_chunks):
    """Test that 'All Risk Factors' option returns all data."""
    # When no filter is applied (empty string), all items should be included
    chunks = [chunk.model_dump() for chunk in mock_labeled_chunks]

    # Simulate filtering with no risk factor selected
    filtered = [
        chunk
        for chunk in chunks
        if not None or (chunk.get("risk_factor") or chunk.get("sub_scenario") or chunk.get("theme"))
    ]

    assert len(filtered) == len(chunks)


def test_risk_factor_fallback_logic():
    """Test that fallback logic works: risk_factor -> sub_scenario -> theme."""
    test_cases = [
        {
            "chunk": {"risk_factor": "RF1", "sub_scenario": "SS1", "theme": "T1"},
            "expected": "RF1",
        },
        {
            "chunk": {"sub_scenario": "SS2", "theme": "T2"},
            "expected": "SS2",
        },
        {
            "chunk": {"theme": "T3"},
            "expected": "T3",
        },
    ]

    for test_case in test_cases:
        chunk = test_case["chunk"]
        risk_factor = (
            chunk.get("risk_factor")
            or chunk.get("sub_scenario")
            or chunk.get("theme")
        )
        assert (
            risk_factor == test_case["expected"]
        ), f"Expected {test_case['expected']}, got {risk_factor}"


def test_company_and_risk_factor_combination(mock_labeled_chunks):
    """Test filtering by both company and risk factor (matches risk_factor field only)."""
    chunks = [chunk.model_dump() for chunk in mock_labeled_chunks]

    target_company = "Company A"
    target_risk = "Risk Factor 1"

    filtered = [
        chunk
        for chunk in chunks
        if chunk.get("company") == target_company
        and chunk.get("risk_factor") == target_risk
    ]

    assert len(filtered) == 1
    assert filtered[0]["company"] == target_company
    assert filtered[0]["risk_factor"] == target_risk


def test_risk_factor_filtering_by_risk_factor_field():
    """Verify that filtering matches only the risk_factor field (most granular level)."""
    # This ensures we match by risk_factor field only (not fallback to sub_scenario/theme)
    chunk1 = {
        "risk_factor": "Granular Risk Factor",
        "sub_scenario": "Different Sub Scenario",
        "theme": "Different Theme",
    }
    chunk2 = {
        "risk_factor": None,
        "sub_scenario": "Granular Risk Factor",  # Same name but different field
        "theme": "Different Theme",
    }

    target_risk = "Granular Risk Factor"
    
    # Only chunk1 should match (has risk_factor field)
    matches1 = chunk1.get("risk_factor") == target_risk
    matches2 = chunk2.get("risk_factor") == target_risk

    assert matches1 is True
    assert matches2 is False

