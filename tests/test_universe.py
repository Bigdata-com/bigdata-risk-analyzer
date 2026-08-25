import io

import pytest

from bigdata_risk_analyzer import universe


def _csv(text: str) -> io.StringIO:
    return io.StringIO(text)


def test_load_universe_csv_without_api_key_leaves_metadata_blank():
    df = universe.load_universe_csv(_csv("RP_ENTITY_ID,COMPANY_NAME\nD8442A,Apple Inc.\n"))
    assert df.loc[0, "TICKER"] is None
    assert df.loc[0, "SECTOR"] is None
    assert df.loc[0, "INDUSTRY"] is None
    assert df.loc[0, "COUNTRY"] is None


def test_load_universe_csv_enriches_missing_metadata_via_kg(monkeypatch):
    def fake_resolve_companies(ids, api_key, api_base_url=None, timeout=30.0):
        assert api_key == "test-key"
        assert set(ids) == {"D8442A"}
        return {
            "D8442A": {
                "name": "Apple Inc.",
                "ticker": "AAPL",
                "sector": "Technology",
                "industry": "Computer Hardware",
                "country": "US",
            }
        }

    monkeypatch.setattr(universe.bigdata_kg, "resolve_companies", fake_resolve_companies)

    df = universe.load_universe_csv(
        _csv("RP_ENTITY_ID,COMPANY_NAME\nD8442A,Apple Inc.\n"), api_key="test-key"
    )
    row = df.iloc[0]
    assert row["TICKER"] == "AAPL"
    assert row["SECTOR"] == "Technology"
    assert row["INDUSTRY"] == "Computer Hardware"
    assert row["COUNTRY"] == "US"


def test_load_universe_csv_does_not_overwrite_csv_provided_values(monkeypatch):
    def fake_resolve_companies(ids, api_key, api_base_url=None, timeout=30.0):
        # Both rows are missing SECTOR/INDUSTRY/COUNTRY (only TICKER was in the CSV).
        assert set(ids) == {"D8442A", "E09E2B"}
        return {
            "D8442A": {
                "name": "Apple Inc.",
                "ticker": "AAPL-FROM-KG",
                "sector": "Technology",
                "industry": "Computer Hardware",
                "country": "US",
            },
            "E09E2B": {
                "name": "NVIDIA Corp.",
                "ticker": "NVDA-FROM-KG",
                "sector": "Technology",
                "industry": "Semiconductors",
                "country": "US",
            },
        }

    monkeypatch.setattr(universe.bigdata_kg, "resolve_companies", fake_resolve_companies)

    csv_text = (
        "RP_ENTITY_ID,COMPANY_NAME,TICKER\n"
        "D8442A,Apple Inc.,AAPL\n"
        "E09E2B,NVIDIA Corp.,NVDA\n"
    )
    df = universe.load_universe_csv(_csv(csv_text), api_key="test-key")

    apple = df[df["RP_ENTITY_ID"] == "D8442A"].iloc[0]
    nvidia = df[df["RP_ENTITY_ID"] == "E09E2B"].iloc[0]

    # CSV-provided tickers are preserved, not overwritten by the KG lookup...
    assert apple["TICKER"] == "AAPL"
    assert nvidia["TICKER"] == "NVDA"
    # ...but the missing sector/industry/country are backfilled for both rows.
    assert apple["SECTOR"] == "Technology"
    assert apple["INDUSTRY"] == "Computer Hardware"
    assert nvidia["SECTOR"] == "Technology"
    assert nvidia["INDUSTRY"] == "Semiconductors"


def test_load_universe_csv_kg_failure_is_non_fatal(monkeypatch):
    def fake_resolve_companies(ids, api_key, api_base_url=None, timeout=30.0):
        raise ValueError("No entities found")

    monkeypatch.setattr(universe.bigdata_kg, "resolve_companies", fake_resolve_companies)

    df = universe.load_universe_csv(
        _csv("RP_ENTITY_ID,COMPANY_NAME\nD8442A,Apple Inc.\n"), api_key="test-key"
    )
    assert df.loc[0, "SECTOR"] is None


@pytest.mark.parametrize("blank_value", ["", "   ", "nan"])
def test_blank_and_nan_like_cells_are_treated_as_missing(blank_value, monkeypatch):
    calls = {}

    def fake_resolve_companies(ids, api_key, api_base_url=None, timeout=30.0):
        calls["ids"] = set(ids)
        return {"D8442A": {"sector": "Technology"}}

    monkeypatch.setattr(universe.bigdata_kg, "resolve_companies", fake_resolve_companies)

    csv_text = f"RP_ENTITY_ID,COMPANY_NAME,SECTOR\nD8442A,Apple Inc.,{blank_value}\n"
    df = universe.load_universe_csv(_csv(csv_text), api_key="test-key")
    assert calls["ids"] == {"D8442A"}
    assert df.loc[0, "SECTOR"] == "Technology"
