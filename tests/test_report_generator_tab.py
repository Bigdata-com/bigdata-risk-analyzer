#!/usr/bin/env python3
"""
Test to verify the Report Generator tab implementation.
"""

import os
import sys

def test_report_generator_tab_button():
    """Test that the Report Generator tab button is present."""
    
    template_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/templates/api/index.html.jinja"
    
    if not os.path.exists(template_path):
        print(f"❌ Template not found: {template_path}")
        return False
    
    with open(template_path, 'r') as f:
        content = f.read()
    
    # Check for Report Generator tab button
    if 'data-tab="report-generator"' not in content:
        print("❌ Report Generator tab button not found")
        return False
    
    if 'Report Generator' not in content:
        print("❌ Report Generator button text not found")
        return False
    
    # Check for document icon
    if 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' not in content:
        print("❌ Report Generator icon not found")
        return False
    
    print("✅ Report Generator tab button found with correct icon")
    return True

def test_report_generator_tab_content():
    """Test that the Report Generator tab content is present."""
    
    template_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/templates/api/index.html.jinja"
    
    with open(template_path, 'r') as f:
        content = f.read()
    
    # Check for Report Generator tab content
    if 'data-tab-content="report-generator"' not in content:
        print("❌ Report Generator tab content not found")
        return False
    
    # Check for "Coming soon..." content
    if 'Coming soon...' not in content:
        print("❌ 'Coming soon...' text not found")
        return False
    
    # Check for Report Generator title
    if 'Report Generator' not in content:
        print("❌ Report Generator title not found in content")
        return False
    
    # Check for description
    if 'Generate comprehensive risk analysis reports' not in content:
        print("❌ Report Generator description not found")
        return False
    
    print("✅ Report Generator tab content found with placeholder")
    return True

def test_tab_controller_update():
    """Test that the tab controller includes the Report Generator tab."""
    
    controller_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/static/scripts/tab_controller.js"
    
    if not os.path.exists(controller_path):
        print(f"❌ Tab controller not found: {controller_path}")
        return False
    
    with open(controller_path, 'r') as f:
        content = f.read()
    
    # Check for report-generator in loading states
    if "'report-generator': false" not in content:
        print("❌ Report Generator not found in tab controller loading states")
        return False
    
    print("✅ Tab controller updated with Report Generator tab")
    return True

def test_tab_positioning():
    """Test that the Report Generator tab is positioned correctly."""
    
    template_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/templates/api/index.html.jinja"
    
    with open(template_path, 'r') as f:
        content = f.read()
    
    # Find positions of tab buttons
    how_it_works_index = content.find('data-tab="how-it-works"')
    report_generator_index = content.find('data-tab="report-generator"')
    
    if how_it_works_index == -1 or report_generator_index == -1:
        print("❌ Tab buttons not found")
        return False
    
    # Check that Report Generator comes after How it Works
    if report_generator_index <= how_it_works_index:
        print("❌ Report Generator tab is not positioned after How it Works")
        return False
    
    print("✅ Report Generator tab positioned correctly after How it Works")
    return True

def test_placeholder_content():
    """Test that the placeholder content is properly styled."""
    
    template_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/templates/api/index.html.jinja"
    
    with open(template_path, 'r') as f:
        content = f.read()
    
    # Check for proper styling classes
    required_classes = [
        'flex items-center justify-center py-20',
        'text-center',
        'w-16 h-16 bg-zinc-700 rounded-full',
        'text-2xl font-bold text-white',
        'text-zinc-400 text-lg',
        'text-zinc-500 text-sm'
    ]
    
    for class_name in required_classes:
        if class_name not in content:
            print(f"❌ Required styling class '{class_name}' not found")
            return False
    
    print("✅ Placeholder content properly styled")
    return True

if __name__ == "__main__":
    print("Testing Report Generator tab implementation...")
    print("=" * 50)
    
    success = True
    
    # Test 1: Tab button
    print("\n1. Testing Report Generator tab button...")
    if not test_report_generator_tab_button():
        success = False
    
    # Test 2: Tab content
    print("\n2. Testing Report Generator tab content...")
    if not test_report_generator_tab_content():
        success = False
    
    # Test 3: Tab controller
    print("\n3. Testing tab controller update...")
    if not test_tab_controller_update():
        success = False
    
    # Test 4: Tab positioning
    print("\n4. Testing tab positioning...")
    if not test_tab_positioning():
        success = False
    
    # Test 5: Placeholder content
    print("\n5. Testing placeholder content styling...")
    if not test_placeholder_content():
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("✅ All tests passed! Report Generator tab implemented successfully.")
    else:
        print("❌ Some tests failed. Please check the implementation.")
        sys.exit(1)
