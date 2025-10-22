#!/usr/bin/env python3
"""
Comprehensive test suite for tab functionality to prevent empty tabs.
Tests all tab rendering functions, global exports, and data flow.
"""

import os
import sys
import re
from pathlib import Path

def test_tab_controller_consistency():
    """Test that tab controller has all required tabs."""
    print("🧪 Testing tab controller consistency...")
    
    tab_controller_file = Path("bigdata_risk_analyzer/static/scripts/tab_controller.js")
    
    if not tab_controller_file.exists():
        print("❌ Tab controller file not found")
        return False
    
    with open(tab_controller_file, 'r') as f:
        content = f.read()
    
    # Test 1: Check loading states include all tabs
    required_tabs = ['overview', 'summary', 'screener', 'mindmap', 'evidence']
    for tab in required_tabs:
        if f"{tab}: false" in content:
            print(f"✅ {tab} in loading states: Found")
        else:
            print(f"❌ {tab} in loading states: Missing")
            return False
    
    # Test 2: Check switchTab method exists
    if 'switchTab(tabName)' in content:
        print("✅ switchTab method: Found")
    else:
        print("❌ switchTab method: Missing")
        return False
    
    # Test 3: Check setLoadingState method exists
    if 'setLoadingState(tabName, isLoading)' in content:
        print("✅ setLoadingState method: Found")
    else:
        print("❌ setLoadingState method: Missing")
        return False
    
    print("✅ Tab controller consistency: PASSED")
    return True

def test_global_function_exports():
    """Test that all required functions are exported globally."""
    print("🧪 Testing global function exports...")
    
    # Required functions and their files
    required_functions = {
        'renderDashboardCards': 'dashboard_cards.js',
        'renderHeatmap': 'heatmap.js',
        'renderCompanyScreener': 'company_screener.js',
        'renderMindmap': 'mindmap.js',
        'renderEvidenceTable': 'evidence_table.js'
    }
    
    for func_name, file_name in required_functions.items():
        script_path = Path(f"bigdata_risk_analyzer/static/scripts/{file_name}")
        
        if not script_path.exists():
            print(f"❌ {file_name}: File not found")
            return False
        
        with open(script_path, 'r') as f:
            content = f.read()
        
        # Check if function is exported globally
        if f"window.{func_name}" in content:
            print(f"✅ {func_name}: Exported globally")
        else:
            print(f"❌ {func_name}: Not exported globally")
            return False
    
    print("✅ Global function exports: PASSED")
    return True

def test_report_renderer_calls():
    """Test that report renderer calls all required functions."""
    print("🧪 Testing report renderer function calls...")
    
    report_renderer_file = Path("bigdata_risk_analyzer/static/scripts/report_renderer.js")
    
    if not report_renderer_file.exists():
        print("❌ Report renderer file not found")
        return False
    
    with open(report_renderer_file, 'r') as f:
        content = f.read()
    
    # Test required function calls
    required_calls = [
        'renderDashboardCards',
        'renderHeatmap', 
        'renderCompanyScreener',
        'renderMindmap',
        'renderEvidenceTable'
    ]
    
    for func_call in required_calls:
        if func_call in content:
            print(f"✅ {func_call}: Called in report renderer")
        else:
            print(f"❌ {func_call}: Not called in report renderer")
            return False
    
    # Test tab loading state calls
    required_loading_calls = [
        "setLoadingState('overview'",
        "setLoadingState('summary'",
        "setLoadingState('screener'",
        "setLoadingState('mindmap'",
        "setLoadingState('evidence'"
    ]
    
    for loading_call in required_loading_calls:
        if loading_call in content:
            print(f"✅ {loading_call}: Found")
        else:
            print(f"❌ {loading_call}: Missing")
            return False
    
    print("✅ Report renderer calls: PASSED")
    return True

def test_tab_data_attributes():
    """Test that all tabs have proper data attributes in HTML."""
    print("🧪 Testing tab data attributes...")
    
    index_file = Path("bigdata_risk_analyzer/templates/api/index.html.jinja")
    
    if not index_file.exists():
        print("❌ Index template file not found")
        return False
    
    with open(index_file, 'r') as f:
        content = f.read()
    
    # Test tab buttons have correct data-tab attributes
    required_tab_buttons = ['overview', 'summary', 'screener', 'mindmap', 'evidence']
    for tab in required_tab_buttons:
        if f'data-tab="{tab}"' in content:
            print(f"✅ Tab button {tab}: Found")
        else:
            print(f"❌ Tab button {tab}: Missing")
            return False
    
    # Test tab content areas have correct data-tab-content attributes
    required_tab_contents = ['overview', 'summary', 'screener', 'mindmap', 'evidence']
    for tab in required_tab_contents:
        if f'data-tab-content="{tab}"' in content:
            print(f"✅ Tab content {tab}: Found")
        else:
            print(f"❌ Tab content {tab}: Missing")
            return False
    
    print("✅ Tab data attributes: PASSED")
    return True

def test_script_inclusions():
    """Test that all required scripts are included in the template."""
    print("🧪 Testing script inclusions...")
    
    index_file = Path("bigdata_risk_analyzer/templates/api/index.html.jinja")
    
    if not index_file.exists():
        print("❌ Index template file not found")
        return False
    
    with open(index_file, 'r') as f:
        content = f.read()
    
    # Test required script inclusions
    required_scripts = [
        'dashboard_cards.js',
        'heatmap.js', 
        'company_screener.js',
        'mindmap.js',
        'evidence_table.js',
        'tab_controller.js',
        'report_renderer.js'
    ]
    
    for script in required_scripts:
        if script in content:
            print(f"✅ {script}: Included")
        else:
            print(f"❌ {script}: Missing")
            return False
    
    print("✅ Script inclusions: PASSED")
    return True

def test_function_definitions():
    """Test that all required functions are properly defined."""
    print("🧪 Testing function definitions...")
    
    required_functions = {
        'renderDashboardCards': 'dashboard_cards.js',
        'renderHeatmap': 'heatmap.js',
        'renderCompanyScreener': 'company_screener.js',
        'renderMindmap': 'mindmap.js',
        'renderEvidenceTable': 'evidence_table.js'
    }
    
    for func_name, file_name in required_functions.items():
        script_path = Path(f"bigdata_risk_analyzer/static/scripts/{file_name}")
        
        if not script_path.exists():
            print(f"❌ {file_name}: File not found")
            return False
        
        with open(script_path, 'r') as f:
            content = f.read()
        
        # Check if function is defined
        if f"function {func_name}(" in content:
            print(f"✅ {func_name}: Defined")
        else:
            print(f"❌ {func_name}: Not defined")
            return False
    
    print("✅ Function definitions: PASSED")
    return True

def test_tab_content_containers():
    """Test that all tab content containers have proper structure."""
    print("🧪 Testing tab content containers...")
    
    index_file = Path("bigdata_risk_analyzer/templates/api/index.html.jinja")
    
    if not index_file.exists():
        print("❌ Index template file not found")
        return False
    
    with open(index_file, 'r') as f:
        content = f.read()
    
    # Test that each tab has proper container structure
    required_containers = ['overview', 'summary', 'screener', 'mindmap', 'evidence']
    for tab in required_containers:
        # Check for tab content div
        if f'data-tab-content="{tab}"' in content:
            print(f"✅ Tab content container {tab}: Found")
        else:
            print(f"❌ Tab content container {tab}: Missing")
            return False
        
        # Check for loading indicator and tab content in the same section
        if f'data-tab-content="{tab}"' in content and 'loading-indicator' in content and 'tab-actual-content' in content:
            print(f"✅ Tab {tab} structure: Complete")
        else:
            print(f"❌ Tab {tab} structure: Incomplete")
            return False
    
    print("✅ Tab content containers: PASSED")
    return True

def test_data_flow_consistency():
    """Test that data flows correctly from report renderer to tab functions."""
    print("🧪 Testing data flow consistency...")
    
    report_renderer_file = Path("bigdata_risk_analyzer/static/scripts/report_renderer.js")
    
    if not report_renderer_file.exists():
        print("❌ Report renderer file not found")
        return False
    
    with open(report_renderer_file, 'r') as f:
        content = f.read()
    
    # Test that data is passed to correct functions
    data_flow_tests = [
        ('data.theme_scoring', 'renderDashboardCards'),
        ('data.theme_scoring', 'renderHeatmap'),
        ('data.theme_scoring', 'renderCompanyScreener'),
        ('data.theme_taxonomy', 'renderMindmap'),
        ('data.content', 'renderEvidenceTable')
    ]
    
    for data_key, func_name in data_flow_tests:
        if data_key in content and func_name in content:
            print(f"✅ Data flow {data_key} -> {func_name}: Found")
        else:
            print(f"❌ Data flow {data_key} -> {func_name}: Missing")
            return False
    
    print("✅ Data flow consistency: PASSED")
    return True

def main():
    """Run all tab functionality tests."""
    print("🚀 Starting Tab Functionality Tests")
    print("=" * 50)
    
    # Change to the correct directory
    os.chdir('/Users/franciscogomez/git/bigdata/bigdata-risk-analyzer')
    
    tests = [
        test_tab_controller_consistency,
        test_global_function_exports,
        test_report_renderer_calls,
        test_tab_data_attributes,
        test_script_inclusions,
        test_function_definitions,
        test_tab_content_containers,
        test_data_flow_consistency
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
            print()
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            print()
    
    print("=" * 50)
    print(f"📊 Test Results: {passed} passed, {total - passed} failed")
    
    if passed == total:
        print("🎉 All tab functionality tests passed!")
        return True
    else:
        print("⚠️  Some tests failed. Tab functionality issues detected.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
