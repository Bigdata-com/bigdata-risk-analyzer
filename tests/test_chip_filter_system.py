#!/usr/bin/env python3
"""
Test the chip-based filter system for Company Screener
"""

import os
import sys
import re

def test_chip_filter_html_structure():
    """Test that the chip-based filter HTML structure is correctly implemented"""
    print("🧪 Testing chip-based filter HTML structure...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    if not os.path.exists(script_path):
        print("❌ Company screener script not found")
        return False
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for filter chips display area
    chip_patterns = [
        r'id="filter-chips"',
        r'Active Filters',
        r'Clear All',
        r'No filters applied'
    ]
    
    for pattern in chip_patterns:
        if not re.search(pattern, content):
            print(f"❌ Missing chip pattern: {pattern}")
            return False
    
    # Test for sidebar structure
    sidebar_patterns = [
        r'Filter Companies',
        r'sector-filter',
        r'industry-filter', 
        r'risk-filter',
        r'handleSearchInput',
        r'handleFilterChange'
    ]
    
    for pattern in sidebar_patterns:
        if not re.search(pattern, content):
            print(f"❌ Missing sidebar pattern: {pattern}")
            return False
    
    print("✅ Chip-based filter HTML structure is correct")
    return True

def test_filter_state_management():
    """Test that filter state management functions are implemented"""
    print("🧪 Testing filter state management...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for filter state object
    if 'filterState = {' not in content:
        print("❌ Filter state object not found")
        return False
    
    # Test for filter management functions
    filter_functions = [
        'handleSearchInput',
        'handleFilterChange', 
        'updateFilterChips',
        'removeFilter',
        'clearAllFilters'
    ]
    
    for func in filter_functions:
        if f'function {func}' not in content:
            print(f"❌ Missing function: {func}")
            return False
    
    print("✅ Filter state management functions are implemented")
    return True

def test_chip_color_coding():
    """Test that filter chips have proper color coding"""
    print("🧪 Testing chip color coding...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for color-coded chips
    color_patterns = [
        r'bg-green-500/20.*text-green-300',  # Search chips
        r'bg-blue-500/20.*text-blue-300',    # Sector chips
        r'bg-purple-500/20.*text-purple-300', # Industry chips
        r'bg-red-500/20.*text-red-300',      # Risk chips
        r'bg-orange-500/20.*text-orange-300' # Top N chips
    ]
    
    for pattern in color_patterns:
        if not re.search(pattern, content):
            print(f"❌ Missing color pattern: {pattern}")
            return False
    
    print("✅ Chip color coding is implemented")
    return True

def test_sidebar_layout():
    """Test that the sidebar layout is properly structured"""
    print("🧪 Testing sidebar layout...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for sidebar structure
    sidebar_elements = [
        r'w-80.*bg-zinc-800/50',  # Sidebar width and background
        r'placeholder="Company name or ticker',  # Search input
        r'<label.*>Sector</label>',  # Sector filter
        r'<label.*>Industry</label>',  # Industry filter
        r'<label.*>Risk Factors</label>',  # Risk factors filter
        r'<label.*>Show Top</label>'  # Top N selector
    ]
    
    for element in sidebar_elements:
        if not re.search(element, content):
            print(f"❌ Missing sidebar element: {element}")
            return False
    
    print("✅ Sidebar layout is properly structured")
    return True

def test_responsive_design():
    """Test that the layout is responsive with flexbox"""
    print("🧪 Testing responsive design...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for responsive layout
    responsive_patterns = [
        r'flex gap-6',  # Main layout
        r'flex-1',     # Flexible main content
        r'w-80',       # Fixed sidebar width
        r'overflow-y-auto'  # Scrollable filter sections
    ]
    
    for pattern in responsive_patterns:
        if not re.search(pattern, content):
            print(f"❌ Missing responsive pattern: {pattern}")
            return False
    
    print("✅ Responsive design is implemented")
    return True

def test_filter_integration():
    """Test that the new filter system integrates with existing functionality"""
    print("🧪 Testing filter integration...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for integration points
    integration_checks = [
        r'filterState\.search',  # Uses new filter state
        r'filterState\.sectors',
        r'filterState\.industries', 
        r'filterState\.risks',
        r'filterState\.topN',
        r'updateFilterChips',    # Updates chip display
        r'clearAllFilters'       # New clear function
    ]
    
    for check in integration_checks:
        if not re.search(check, content):
            print(f"❌ Missing integration: {check}")
            return False
    
    print("✅ Filter integration is working")
    return True

def main():
    """Run all chip-based filter system tests"""
    print("🚀 Testing Chip-Based Filter System for Company Screener")
    print("=" * 60)
    
    tests = [
        test_chip_filter_html_structure,
        test_filter_state_management,
        test_chip_color_coding,
        test_sidebar_layout,
        test_responsive_design,
        test_filter_integration
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
    
    print("=" * 60)
    print(f"📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All chip-based filter system tests passed!")
        return True
    else:
        print("⚠️  Some tests failed. Please review the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
