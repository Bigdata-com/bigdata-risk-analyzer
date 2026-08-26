from bigdata_risk_analyzer.bigdata_kg import _parse_ticker


def test_parse_ticker_prefers_nasdaq_over_earlier_secondary_listing():
    # Apple: the Bangkok depositary-receipt listing sorts before the Nasdaq one.
    entity = {"listing_values": ["XBKK:AAPL80", "XNAS:AAPL"]}
    assert _parse_ticker(entity) == "AAPL"


def test_parse_ticker_prefers_nasdaq_among_many_secondary_listings():
    # NVIDIA: several European/Asian listings appear before the Nasdaq one.
    entity = {
        "listing_values": [
            "XBKK:NVDA80",
            "XETR:NVD",
            "XFRA:NVD",
            "XFRA:NVDG",
            "XLOM:0R1I",
            "XNAS:NVDA",
        ]
    }
    assert _parse_ticker(entity) == "NVDA"


def test_parse_ticker_falls_back_to_first_listing_when_no_preferred_exchange():
    entity = {"listing_values": ["NEOE:MSFT"]}
    assert _parse_ticker(entity) == "MSFT"


def test_parse_ticker_returns_none_when_no_listings():
    assert _parse_ticker({"listing_values": []}) is None
    assert _parse_ticker({}) is None
