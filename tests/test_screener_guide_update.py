#!/usr/bin/env python3
"""
Test to verify the updated Company Screener guide.
"""

import os
import sys

def test_screener_guide_title():
    """Test that the guide title is updated to 'How to Screen'."""
    
    template_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/templates/api/index.html.jinja"
    
    if not os.path.exists(template_path):
        print(f"❌ Template not found: {template_path}")
        return False
    
    with open(template_path, 'r') as f:
        content = f.read()
    
    # Check that title is updated
    if 'How to Screen' not in content:
        print("❌ Updated title 'How to Screen' not found")
        return False
    
    # Check that old title is removed
    if 'How to Use the Company Screener' in content:
        print("❌ Old title 'How to Use the Company Screener' still present")
        return False
    
    print("✅ Guide title updated to 'How to Screen'")
    return True

def test_screener_guide_content():
    """Test that the guide content reflects current functionality."""
    
    template_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/templates/api/index.html.jinja"
    
    with open(template_path, 'r') as f:
        content = f.read()
    
    # Check for updated sections
    required_sections = [
        "Filter System",
        "Table Features", 
        "Score Metrics",
        "Common Screening Workflows"
    ]
    
    for section in required_sections:
        if section not in content:
            print(f"❌ Required section '{section}' not found")
            return False
    
    # Check for current functionality mentions
    current_features = [
        "Search:",
        "Sector & Industry:",
        "Risk Factors:",
        "Show Results:",
        "Active Filters:",
        "Sortable Columns:",
        "Risk Breakdown:",
        "Insights:",
        "Export:",
        "Score Metrics:",
        "Composite Score:",
        "Coverage Score:",
        "Intensity Score:"
    ]
    
    for feature in current_features:
        if feature not in content:
            print(f"❌ Current feature '{feature}' not found in guide")
            return False
    
    print("✅ Guide content updated with current functionality")
    return True

def test_workflow_examples():
    """Test that workflow examples are updated."""
    
    template_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/templates/api/index.html.jinja"
    
    with open(template_path, 'r') as f:
        content = f.read()
    
    # Check for updated workflow examples
    workflows = [
        "Sector Risk Analysis",
        "Portfolio Construction", 
        "Risk Factor Deep Dive"
    ]
    
    for workflow in workflows:
        if workflow not in content:
            print(f"❌ Workflow '{workflow}' not found")
            return False
    
    # Check for specific workflow steps
    workflow_steps = [
        "Select \"Technology\" sector",
        "Filter by \"AI Risk\"",
        "Sort by Coverage Score",
        "Set \"Top 20\" limit",
        "Sort by Composite Score",
        "Sort by Intensity Score"
    ]
    
    for step in workflow_steps:
        if step not in content:
            print(f"❌ Workflow step '{step}' not found")
            return False
    
    print("✅ Workflow examples updated with current functionality")
    return True

def test_score_explanations():
    """Test that score explanations are included."""
    
    template_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/templates/api/index.html.jinja"
    
    with open(template_path, 'r') as f:
        content = f.read()
    
    # Check for score explanations
    score_explanations = [
        "Overall risk exposure based on all risk factors",
        "Percentage of risk types the company is exposed to",
        "Average evidence strength across all risk factors"
    ]
    
    for explanation in score_explanations:
        if explanation not in content:
            print(f"❌ Score explanation '{explanation}' not found")
            return False
    
    print("✅ Score explanations included")
    return True

if __name__ == "__main__":
    print("Testing updated Company Screener guide...")
    print("=" * 50)
    
    success = True
    
    # Test 1: Title update
    print("\n1. Testing title update...")
    if not test_screener_guide_title():
        success = False
    
    # Test 2: Content update
    print("\n2. Testing content update...")
    if not test_screener_guide_content():
        success = False
    
    # Test 3: Workflow examples
    print("\n3. Testing workflow examples...")
    if not test_workflow_examples():
        success = False
    
    # Test 4: Score explanations
    print("\n4. Testing score explanations...")
    if not test_score_explanations():
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("✅ All tests passed! Screener guide updated successfully.")
    else:
        print("❌ Some tests failed. Please check the implementation.")
        sys.exit(1)
