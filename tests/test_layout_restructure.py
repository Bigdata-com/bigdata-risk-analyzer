"""
Test suite for Risk Analyzer layout restructure.

Tests the restructuring of the Risk Analyzer app to move dashboard cards
into an Overview tab and promote tabs to the top level.
"""

import os
from pathlib import Path


class TestLayoutRestructure:
    """Test cases for layout restructure implementation."""

    def test_template_structure_changes(self):
        """Test that template structure has been properly updated."""
        template_path = Path(__file__).parent.parent / "bigdata_risk_analyzer" / "templates" / "api" / "index.html.jinja"
        
        with open(template_path, 'r') as f:
            content = f.read()
        
        # Verify collapsible "Explore Detailed Results" section is removed
        assert 'Explore Detailed Results' not in content, "Collapsible section should be removed"
        assert 'toggleExploreSection' not in content, "toggleExploreSection function should be removed"
        assert 'exploreContent' not in content, "exploreContent div should be removed"
        
        # Verify Overview tab exists as first tab
        assert 'data-tab="overview"' in content, "Overview tab should exist"
        assert 'Overview' in content, "Overview tab label should exist"
        
        # Verify tabs are at top level (not nested in collapsible)
        assert 'resultsContainer' in content, "resultsContainer should exist"
        assert 'Tab Navigation' in content, "Tab navigation should be at top level"
        
        # Verify tab order: Overview, Risk Heatmap, Companies, Taxonomy, Evidence
        tab_buttons = content.split('data-tab="overview"')[1].split('</div>')[0]
        assert 'data-tab="summary"' in tab_buttons, "Summary tab should come after Overview"
        assert 'data-tab="screener"' in tab_buttons, "Company Screener tab should exist"
        assert 'data-tab="mindmap"' in tab_buttons, "Mindmap tab should exist"
        assert 'data-tab="evidence"' in tab_buttons, "Evidence tab should exist"
        
        # Verify Overview tab content area exists
        assert 'data-tab-content="overview"' in content, "Overview tab content area should exist"

    def test_dashboard_cards_script_changes(self):
        """Test that dashboard_cards.js has been updated to return HTML."""
        script_path = Path(__file__).parent.parent / "bigdata_risk_analyzer" / "static" / "scripts" / "dashboard_cards.js"
        
        with open(script_path, 'r') as f:
            content = f.read()
        
        # Verify function returns HTML instead of injecting into container
        assert 'return `' in content, "renderDashboardCards should return HTML string"
        assert 'container.innerHTML' not in content, "Should not inject into container directly"
        assert 'document.getElementById(\'dashboardCards\')' not in content, "Should not reference dashboardCards container"

    def test_tab_controller_changes(self):
        """Test that tab_controller.js includes Overview tab support."""
        script_path = Path(__file__).parent.parent / "bigdata_risk_analyzer" / "static" / "scripts" / "tab_controller.js"
        
        with open(script_path, 'r') as f:
            content = f.read()
        
        # Verify Overview tab is in loadingStates
        assert 'overview: false' in content, "Overview should be in loadingStates"
        
        # Verify Overview is default active tab
        assert 'this.activeTab = \'overview\'' in content, "Overview should be default active tab"

    def test_report_renderer_changes(self):
        """Test that report_renderer.js renders Overview tab with dashboard cards."""
        script_path = Path(__file__).parent.parent / "bigdata_risk_analyzer" / "static" / "scripts" / "report_renderer.js"
        
        with open(script_path, 'r') as f:
            content = f.read()
        
        # Verify Overview tab is set as active by default
        assert 'switchTab(\'overview\')' in content, "Should switch to Overview tab by default"
        
        # Verify dashboard cards are rendered into Overview tab
        assert '[data-tab-content="overview"]' in content, "Should target Overview tab content"
        assert 'renderDashboardCards(data)' in content, "Should call renderDashboardCards"
        
        # Verify Overview tab loading state is managed
        assert 'setLoadingState(\'overview\'' in content, "Should manage Overview tab loading state"

    def test_html_output_structure(self):
        """Test that HTML output has correct structure."""
        template_path = Path(__file__).parent.parent / "bigdata_risk_analyzer" / "templates" / "api" / "index.html.jinja"
        
        with open(template_path, 'r') as f:
            content = f.read()
        
        # Verify tab navigation is always visible (no hidden state)
        assert 'sticky top-0' in content, "Tab navigation should be sticky"
        
        # Verify proper CSS classes and structure
        assert 'bg-zinc-800/50' in content, "Should have proper background styling"
        assert 'border-b border-zinc-700' in content, "Should have proper border styling"
        
        # Verify Overview tab has proper structure
        assert 'data-tab-content="overview"' in content, "Overview tab content area should exist"
        assert 'tab-actual-content' in content, "Overview tab should have content area"
        assert 'loading-indicator' in content, "Overview tab should have loading indicator"

    def test_no_collapsible_sections(self):
        """Test that no collapsible sections remain in the template."""
        template_path = Path(__file__).parent.parent / "bigdata_risk_analyzer" / "templates" / "api" / "index.html.jinja"
        
        with open(template_path, 'r') as f:
            content = f.read()
        
        # Verify no collapsible functionality remains
        assert 'onclick="toggleExploreSection()"' not in content, "No toggle functions should remain"
        assert 'class="hidden mt-4"' not in content, "No hidden collapsible content should remain"
        assert 'exploreIcon' not in content, "No explore icon should remain"


def run_tests():
    """Run all tests and report results."""
    test_instance = TestLayoutRestructure()
    tests = [
        test_instance.test_template_structure_changes,
        test_instance.test_dashboard_cards_script_changes,
        test_instance.test_tab_controller_changes,
        test_instance.test_report_renderer_changes,
        test_instance.test_html_output_structure,
        test_instance.test_no_collapsible_sections
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            print(f"✅ {test.__name__}: PASSED")
            passed += 1
        except Exception as e:
            print(f"❌ {test.__name__}: FAILED - {str(e)}")
            failed += 1
    
    print(f"\n📊 Test Results: {passed} passed, {failed} failed")
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
