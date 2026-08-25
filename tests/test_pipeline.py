from bigdata_risk_analyzer.pipeline import _risk_factor_channel


def test_risk_factor_channel_four_level_tree():
    # Leaf's ancestry chain: [root, channel, factor]
    ancestry = {"Sub-Scenario": ["Main Risk", "Risk Channel", "Risk Factor"]}
    risk_factor, risk_channel = _risk_factor_channel("Sub-Scenario", ancestry)
    assert risk_factor == "Risk Factor"
    assert risk_channel == "Risk Channel"


def test_risk_factor_channel_three_level_tree_falls_back_to_factor():
    # Leaf's ancestry chain (depth-capped tree): [root, channel] — no separate factor layer
    ancestry = {"Sub-Scenario": ["Main Risk", "Risk Channel"]}
    risk_factor, risk_channel = _risk_factor_channel("Sub-Scenario", ancestry)
    assert risk_factor == "Risk Channel"
    # Without the fallback this would incorrectly be the constant root theme name.
    assert risk_channel == "Risk Channel"
    assert risk_channel != "Main Risk"
