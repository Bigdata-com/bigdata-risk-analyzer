#!/usr/bin/env python3
"""
Test to verify the tab reordering and icon changes.
"""

import os
import sys

def test_report_generator_icon():
    """Test that the Report Generator has a different icon from Evidence."""
    
    template_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/templates/api/index.html.jinja"
    
    if not os.path.exists(template_path):
        print(f"❌ Template not found: {template_path}")
        return False
    
    with open(template_path, 'r') as f:
        content = f.read()
    
    # Check for Report Generator icon (chart/analytics icon)
    report_generator_icon = 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    
    if report_generator_icon not in content:
        print("❌ Report Generator chart icon not found")
        return False
    
    # Check that Evidence still has document icon
    evidence_icon = 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    
    if evidence_icon not in content:
        print("❌ Evidence document icon not found")
        return False
    
    print("✅ Report Generator has different icon from Evidence")
    return True

def test_tab_order():
    """Test that the tabs are in the correct order."""
    
    template_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/templates/api/index.html.jinja"
    
    with open(template_path, 'r') as f:
        content = f.read()
    
    # Find positions of tab buttons
    overview_pos = content.find('data-tab="overview"')
    summary_pos = content.find('data-tab="summary"')
    screener_pos = content.find('data-tab="screener"')
    mindmap_pos = content.find('data-tab="mindmap"')
    evidence_pos = content.find('data-tab="evidence"')
    report_generator_pos = content.find('data-tab="report-generator"')
    how_it_works_pos = content.find('data-tab="how-it-works"')
    
    positions = [
        ("Overview", overview_pos),
        ("Summary", summary_pos),
        ("Screener", screener_pos),
        ("Mindmap", mindmap_pos),
        ("Evidence", evidence_pos),
        ("Report Generator", report_generator_pos),
        ("How it Works", how_it_works_pos)
    ]
    
    # Check that all tabs are found
    for name, pos in positions:
        if pos == -1:
            print(f"❌ {name} tab not found")
            return False
    
    # Check order: Overview, Summary, Screener, Mindmap, Evidence, Report Generator, How it Works
    expected_order = [
        "Overview", "Summary", "Screener", "Mindmap", "Evidence", 
        "Report Generator", "How it Works"
    ]
    
    for i in range(len(positions) - 1):
        current_name, current_pos = positions[i]
        next_name, next_pos = positions[i + 1]
        
        if current_pos >= next_pos:
            print(f"❌ Tab order incorrect: {current_name} should come before {next_name}")
            return False
    
    print("✅ Tab order is correct: Overview → Summary → Screener → Mindmap → Evidence → Report Generator → How it Works")
    return True

def test_how_it_works_last():
    """Test that How it Works is the last tab."""
    
    template_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/templates/api/index.html.jinja"
    
    with open(template_path, 'r') as f:
        content = f.read()
    
    # Find positions
    report_generator_pos = content.find('data-tab="report-generator"')
    how_it_works_pos = content.find('data-tab="how-it-works"')
    
    if report_generator_pos == -1 or how_it_works_pos == -1:
        print("❌ Tab buttons not found")
        return False
    
    # How it Works should come after Report Generator
    if how_it_works_pos <= report_generator_pos:
        print("❌ How it Works is not the last tab")
        return False
    
    print("✅ How it Works is positioned as the last tab")
    return True

def test_no_duplicate_content():
    """Test that there are no duplicate tab content sections."""
    
    template_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/templates/api/index.html.jinja"
    
    with open(template_path, 'r') as f:
        content = f.read()
    
    # Count occurrences of Report Generator tab content
    report_generator_content_count = content.count('data-tab-content="report-generator"')
    
    if report_generator_content_count != 1:
        print(f"❌ Found {report_generator_content_count} Report Generator content sections, expected 1")
        return False
    
    # Count occurrences of How it Works tab content
    how_it_works_content_count = content.count('data-tab-content="how-it-works"')
    
    if how_it_works_content_count != 1:
        print(f"❌ Found {how_it_works_content_count} How it Works content sections, expected 1")
        return False
    
    print("✅ No duplicate tab content sections found")
    return True

if __name__ == "__main__":
    print("Testing tab reordering and icon changes...")
    print("=" * 50)
    
    success = True
    
    # Test 1: Icon changes
    print("\n1. Testing Report Generator icon change...")
    if not test_report_generator_icon():
        success = False
    
    # Test 2: Tab order
    print("\n2. Testing tab order...")
    if not test_tab_order():
        success = False
    
    # Test 3: How it Works last
    print("\n3. Testing How it Works is last...")
    if not test_how_it_works_last():
        success = False
    
    # Test 4: No duplicates
    print("\n4. Testing no duplicate content...")
    if not test_no_duplicate_content():
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("✅ All tests passed! Tab reordering and icon changes successful.")
    else:
        print("❌ Some tests failed. Please check the implementation.")
        sys.exit(1)
