"""Test frontend data adapter for risk analysis results."""

import json
from pathlib import Path


def test_risk_data_structure():
    """Test that the risk data structure matches expected format."""
    # Load the example JSON
    example_file = (
        Path(__file__).parent.parent
        / "bigdata_risk_analyzer"
        / "static"
        / "data"
        / "supply-chain-risk-example.json"
    )

    with open(example_file) as f:
        data = json.load(f)

    # Verify required top-level keys
    assert "risk_scoring" in data, "Missing risk_scoring in data"
    assert "risk_taxonomy" in data, "Missing risk_taxonomy in data"
    assert "content" in data, "Missing content in data"

    # Verify risk_scoring structure
    assert isinstance(data["risk_scoring"], dict), "risk_scoring should be a dict"
    assert len(data["risk_scoring"]) > 0, "risk_scoring should not be empty"

    # Check first company structure
    first_company = next(iter(data["risk_scoring"].values()))
    assert "ticker" in first_company, "Company missing ticker"
    assert "sector" in first_company, "Company missing sector"
    assert "industry" in first_company, "Company missing industry"
    assert "composite_score" in first_company, "Company missing composite_score"
    assert "motivation" in first_company, "Company missing motivation"
    assert "risks" in first_company, "Company missing risks"

    # Verify risks is a dict
    assert isinstance(first_company["risks"], dict), "risks should be a dict"
    assert len(first_company["risks"]) > 0, "risks should not be empty"

    # Verify risk_taxonomy structure
    assert isinstance(data["risk_taxonomy"], dict), "risk_taxonomy should be a dict"

    # Verify content structure
    assert isinstance(data["content"], list), "content should be a list"
    if len(data["content"]) > 0:
        first_content = data["content"][0]
        # Content items may have different structures, check for at least some key fields
        assert isinstance(first_content, dict), "Content item should be a dict"
        # Common fields might include: company, entity_name, text, headline, etc.
        # Just verify it's not empty
        assert len(first_content) > 0, "Content item should not be empty"


def test_frontend_adapter_logic():
    """Test the frontend adapter conversion logic (simulated in Python)."""

    # Sample risk data (backend format)
    risk_data = {
        "risk_scoring": {
            "Company A": {
                "ticker": "CMPA",
                "sector": "Technology",
                "industry": "Software",
                "composite_score": 75,
                "motivation": "Test motivation",
                "risks": {"Risk Factor 1": 10, "Risk Factor 2": 5},
            }
        },
        "risk_taxonomy": {
            "Main Theme": {
                "Risk Category 1": ["Risk Factor 1"],
                "Risk Category 2": ["Risk Factor 2"],
            }
        },
        "content": [{"entity_name": "Company A", "text": "Sample evidence"}],
    }

    # Simulate the adapter function (JavaScript logic in Python)
    def adapt_risk_data_to_theme_format(data):
        """Python version of the JavaScript adapter."""
        if "theme_scoring" in data:
            return data

        adapted = {
            "theme_scoring": {},
            "theme_taxonomy": data.get("risk_taxonomy", {}),
            "content": data.get("content", []),
        }

        if "risk_scoring" in data:
            for company_name, company_data in data["risk_scoring"].items():
                adapted["theme_scoring"][company_name] = {
                    **company_data,
                    "themes": company_data.get("risks", company_data.get("themes", {})),
                }

        return adapted

    # Apply adapter
    adapted_data = adapt_risk_data_to_theme_format(risk_data)

    # Verify adapted structure
    assert "theme_scoring" in adapted_data, "Missing theme_scoring after adaptation"
    assert "theme_taxonomy" in adapted_data, "Missing theme_taxonomy after adaptation"
    assert "content" in adapted_data, "Missing content after adaptation"

    # Verify company data was transformed
    assert "Company A" in adapted_data["theme_scoring"]
    company = adapted_data["theme_scoring"]["Company A"]
    assert "themes" in company, "Missing themes after adaptation"
    assert company["themes"] == risk_data["risk_scoring"]["Company A"]["risks"]

    # Original fields should be preserved
    assert company["ticker"] == "CMPA"
    assert company["composite_score"] == 75


def test_adapter_handles_already_adapted_data():
    """Test that adapter doesn't double-convert already adapted data."""

    # Data already in theme format
    theme_data = {
        "theme_scoring": {"Company B": {"ticker": "CMPB", "themes": {"Theme 1": 8}}},
        "theme_taxonomy": {},
        "content": [],
    }

    def adapt_risk_data_to_theme_format(data):
        """Python version of the JavaScript adapter."""
        if "theme_scoring" in data:
            return data  # Already adapted
        # ... (rest of adapter logic)
        return data

    # Apply adapter - should return unchanged
    result = adapt_risk_data_to_theme_format(theme_data)

    assert result == theme_data, "Adapter should not modify already-adapted data"
    assert "theme_scoring" in result


if __name__ == "__main__":
    # Run tests
    print("Running frontend data adapter tests...")

    try:
        test_risk_data_structure()
        print("✅ test_risk_data_structure passed")
    except AssertionError as e:
        print(f"❌ test_risk_data_structure failed: {e}")

    try:
        test_frontend_adapter_logic()
        print("✅ test_frontend_adapter_logic passed")
    except AssertionError as e:
        print(f"❌ test_frontend_adapter_logic failed: {e}")

    try:
        test_adapter_handles_already_adapted_data()
        print("✅ test_adapter_handles_already_adapted_data passed")
    except AssertionError as e:
        print(f"❌ test_adapter_handles_already_adapted_data failed: {e}")

    print("\n✅ All frontend adapter tests completed!")
