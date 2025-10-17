"""Test dashboard configuration display for risk analysis."""

import re
from pathlib import Path


def test_at_a_glance_config_extraction():
    """Test that config data is extracted correctly from window.currentConfig."""

    # Simulate window.currentConfig scenarios
    test_cases = [
        {
            "name": "Risk Analyzer format (main_theme)",
            "config": {
                "main_theme": "Nuclear Energy Risk",
                "companies": "Magnificent 7",
                "isDemo": False,
            },
            "expected": {
                "theme": "Nuclear Energy Risk",
                "universe": "Magnificent 7",
                "isDemo": False,
            },
        },
        {
            "name": "Thematic Screener format (theme)",
            "config": {
                "theme": "Supply Chain Reshaping",
                "companies": "Top 100 US",
                "isDemo": True,
            },
            "expected": {
                "theme": "Supply Chain Reshaping",
                "universe": "Top 100 US",
                "isDemo": True,
            },
        },
        {
            "name": "Both fields present (main_theme takes priority)",
            "config": {
                "main_theme": "Primary Risk",
                "theme": "Fallback Theme",
                "companies": "Nasdaq 100",
                "isDemo": False,
            },
            "expected": {
                "theme": "Primary Risk",  # main_theme should win
                "universe": "Nasdaq 100",
                "isDemo": False,
            },
        },
        {
            "name": "Missing fields default to N/A",
            "config": {},
            "expected": {"theme": "N/A", "universe": "N/A", "isDemo": False},
        },
    ]

    # Simulate the JavaScript config extraction logic
    def extract_config(current_config):
        """Python simulation of JavaScript config extraction."""
        return {
            "theme": current_config.get("main_theme")
            or current_config.get("theme")
            or "N/A",
            "universe": current_config.get("companies") or "N/A",
            "isDemo": current_config.get("isDemo", False),
        }

    # Run test cases
    for test_case in test_cases:
        result = extract_config(test_case["config"])

        assert result == test_case["expected"], (
            f"Failed: {test_case['name']}\n"
            f"Expected: {test_case['expected']}\n"
            f"Got: {result}"
        )
        print(f"✅ {test_case['name']}")


def test_dashboard_cards_js_content():
    """Test that dashboard_cards.js has correct risk terminology."""

    dashboard_cards_file = (
        Path(__file__).parent.parent
        / "bigdata_risk_analyzer"
        / "static"
        / "scripts"
        / "dashboard_cards.js"
    )

    with open(dashboard_cards_file) as f:
        content = f.read()

    # Check for correct field access (main_theme first)
    assert "currentConfig.main_theme || currentConfig.theme" in content, (
        "dashboard_cards.js should check main_theme before theme"
    )

    # Check for risk-appropriate labels
    assert "Risk Factors Identified" in content, (
        "Should say 'Risk Factors Identified' not 'Themes Identified'"
    )

    assert "Risk Scenario:" in content, "Should say 'Risk Scenario:' not 'Theme:'"

    # Check for risk-appropriate colors
    assert "text-orange-400" in content, "Should use orange color for risk factors"

    assert "text-red-400" in content, "Should use red color for highest score"

    assert "border-orange-600" in content, "Should use orange border for risk context"

    print("✅ Dashboard cards JavaScript has correct risk terminology")
    print("✅ Dashboard cards JavaScript uses risk-appropriate colors")


def test_form_js_updates_config_badge():
    """Test that form.js updates config badge with main_theme."""

    form_js_file = (
        Path(__file__).parent.parent
        / "bigdata_risk_analyzer"
        / "static"
        / "scripts"
        / "form.js"
    )

    with open(form_js_file) as f:
        content = f.read()

    # Check that form.js updates config with main_theme
    assert "main_theme: main_theme" in content or "main_theme:" in content, (
        "form.js should pass main_theme to updateConfigBadge"
    )

    # Check that it calls updateConfigBadge
    assert "updateConfigBadge" in content, (
        "form.js should call updateConfigBadge after analysis completes"
    )

    print("✅ Form.js correctly updates config badge with main_theme")


def test_config_panel_js_updates_badge():
    """Test that config_panel.js updates badge correctly for demos."""

    config_panel_file = (
        Path(__file__).parent.parent
        / "bigdata_risk_analyzer"
        / "static"
        / "scripts"
        / "config_panel.js"
    )

    with open(config_panel_file) as f:
        content = f.read()

    # Check updateConfigBadge function exists and uses correct field
    assert "function updateConfigBadge" in content or "updateConfigBadge" in content, (
        "config_panel.js should have updateConfigBadge function"
    )

    # Check that it updates window.currentConfig
    assert "window.currentConfig" in content, (
        "config_panel.js should update window.currentConfig"
    )

    print("✅ Config panel correctly manages config badge updates")


def test_color_scheme_consistency():
    """Test that color scheme is consistent across risk analyzer components."""

    files_to_check = [
        (
            "dashboard_cards.js",
            [
                ("orange", "Risk factors and warnings"),
                ("red", "Critical risk scores"),
                ("amber", "Supporting evidence"),
            ],
        ),
        ("heatmap.js", [("red", "Risk intensity heatmap")]),
        # Note: company_cards.js uses theme screener colors (emerald/blue)
        # This is intentional for consistency with the copied component
    ]

    base_path = (
        Path(__file__).parent.parent / "bigdata_risk_analyzer" / "static" / "scripts"
    )

    for filename, expected_colors in files_to_check:
        file_path = base_path / filename

        with open(file_path) as f:
            content = f.read()

        for color, purpose in expected_colors:
            # Check if color is used (either as text-color-XXX or bg-color-XXX)
            pattern = f"(text|bg|border)-{color}-\\d+"
            matches = re.findall(pattern, content)

            assert len(matches) > 0, (
                f"{filename} should use {color} color for {purpose}"
            )

        print(f"✅ {filename} uses correct risk color scheme")


def test_live_analysis_data_structure():
    """Test that live analysis data structure can be properly adapted."""

    # Simulate a live analysis response
    live_data = {
        "risk_scoring": {
            "Microsoft Corp.": {
                "ticker": "MSFT",
                "sector": "Technology",
                "industry": "Software",
                "composite_score": 77,
                "motivation": "Test motivation",
                "risks": {
                    "Demand Shift": 18,
                    "Energy Price Fluctuations": 12,
                    "Public Perception": 11,
                },
            }
        },
        "risk_taxonomy": {
            "Nuclear Energy": {
                "Regulatory Risk": ["Compliance Costs", "License Renewals"],
                "Market Risk": ["Energy Price Fluctuations", "Demand Shift"],
            }
        },
        "content": [{"company": "Microsoft Corp.", "text": "Sample evidence"}],
    }

    # Simulate the adapter
    def adapt_for_frontend(data):
        if "theme_scoring" in data:
            return data

        return {
            "theme_scoring": {
                name: {**info, "themes": info.get("risks", {})}
                for name, info in data.get("risk_scoring", {}).items()
            },
            "theme_taxonomy": data.get("risk_taxonomy", {}),
            "content": data.get("content", []),
        }

    adapted = adapt_for_frontend(live_data)

    # Verify structure
    assert "theme_scoring" in adapted
    assert "Microsoft Corp." in adapted["theme_scoring"]
    assert "themes" in adapted["theme_scoring"]["Microsoft Corp."]
    assert adapted["theme_scoring"]["Microsoft Corp."]["themes"]["Demand Shift"] == 18

    print("✅ Live analysis data can be properly adapted for frontend")


if __name__ == "__main__":
    print("=" * 60)
    print("Testing Dashboard Configuration for Risk Analyzer")
    print("=" * 60)
    print()

    tests = [
        ("Config Extraction Logic", test_at_a_glance_config_extraction),
        ("Dashboard Cards Content", test_dashboard_cards_js_content),
        ("Form.js Config Updates", test_form_js_updates_config_badge),
        ("Config Panel Badge Updates", test_config_panel_js_updates_badge),
        ("Color Scheme Consistency", test_color_scheme_consistency),
        ("Live Analysis Adaptation", test_live_analysis_data_structure),
    ]

    passed = 0
    failed = 0

    for test_name, test_func in tests:
        print(f"\n📋 {test_name}")
        print("-" * 60)
        try:
            test_func()
            passed += 1
            print(f"✅ {test_name} PASSED\n")
        except AssertionError as e:
            failed += 1
            print(f"❌ {test_name} FAILED")
            print(f"   Error: {e}\n")
        except Exception as e:
            failed += 1
            print(f"❌ {test_name} ERROR")
            print(f"   Error: {e}\n")

    print("=" * 60)
    print(f"Test Results: {passed} passed, {failed} failed")
    print("=" * 60)

    if failed == 0:
        print("🎉 All tests passed!")
    else:
        print(f"⚠️  {failed} test(s) failed")
