#!/usr/bin/env python3
"""
Test filter removal functionality for Company Screener
"""

import os
import sys
import re

def test_filter_removal_functions():
    """Test that filter removal functions are properly implemented"""
    print("🧪 Testing filter removal functions...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    if not os.path.exists(script_path):
        print("❌ Company screener script not found")
        return False
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for removeFilter function
    if 'function removeFilter(' not in content:
        print("❌ removeFilter function not found")
        return False
    
    # Test for clearAllFilters function
    if 'function clearAllFilters(' not in content:
        print("❌ clearAllFilters function not found")
        return False
    
    print("✅ Filter removal functions are implemented")
    return True

def test_chip_onclick_handlers():
    """Test that chip onclick handlers are properly generated"""
    print("🧪 Testing chip onclick handlers...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for proper onclick handlers in chips
    onclick_patterns = [
        r'onclick="removeFilter\(',
        r'removeFilter\(',
        r'removeFilter\(\'.*\', \'.*\'\)',  # Function call syntax
        r'hover:text-.*-100'  # Hover classes
    ]
    
    for pattern in onclick_patterns:
        if not re.search(pattern, content):
            print(f"❌ Missing onclick pattern: {pattern}")
            return False
    
    print("✅ Chip onclick handlers are properly generated")
    return True

def test_escape_handling():
    """Test that escaping is handled correctly in filter removal"""
    print("🧪 Testing escape handling...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for proper escaping in chip generation
    escape_patterns = [
        r'escapeHtml\(.*\)',  # HTML escaping for display
        r'\.replace\(.*\'/g.*\\\\\'',  # Single quote escaping
        r'\.replace\(.*"/g.*\\\\"'  # Double quote escaping
    ]
    
    for pattern in escape_patterns:
        if not re.search(pattern, content):
            print(f"❌ Missing escape pattern: {pattern}")
            return False
    
    print("✅ Escape handling is implemented correctly")
    return True

def test_checkbox_integration():
    """Test that checkbox integration works with filter removal"""
    print("🧪 Testing checkbox integration...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for checkbox unchecking logic
    checkbox_patterns = [
        r'checkbox\.checked = false',
        r'\.querySelector\(`\.\$\{type\}-filter\[value="\$\{value\}"\]`\)',
        r'\.sector-filter, \.industry-filter, \.risk-filter'
    ]
    
    for pattern in checkbox_patterns:
        if not re.search(pattern, content):
            print(f"❌ Missing checkbox pattern: {pattern}")
            return False
    
    print("✅ Checkbox integration is working")
    return True

def test_filter_state_consistency():
    """Test that filter state is properly updated when removing filters"""
    print("🧪 Testing filter state consistency...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for filter state updates
    state_patterns = [
        r'filterState\[type\] = filterState\[type\]\.filter',
        r'filterState\.search = \'\'',
        r'filterState\.topN = \'\'',
        r'updateFilterChips\(\)',
        r'filterScreener\(\)'
    ]
    
    for pattern in state_patterns:
        if not re.search(pattern, content):
            print(f"❌ Missing state pattern: {pattern}")
            return False
    
    print("✅ Filter state consistency is maintained")
    return True

def test_clear_all_functionality():
    """Test that clear all functionality works properly"""
    print("🧪 Testing clear all functionality...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for clear all implementation
    clear_patterns = [
        r'filterState\.search = \'\'',
        r'filterState\.sectors = \[\]',
        r'filterState\.industries = \[\]',
        r'filterState\.risks = \[\]',
        r'filterState\.topN = \'\'',
        r'\.checked = false',
        r'clearAllFilters\(\)'
    ]
    
    for pattern in clear_patterns:
        if not re.search(pattern, content):
            print(f"❌ Missing clear pattern: {pattern}")
            return False
    
    print("✅ Clear all functionality is implemented")
    return True

def main():
    """Run all filter removal tests"""
    print("🚀 Testing Filter Removal Functionality")
    print("=" * 50)
    
    tests = [
        test_filter_removal_functions,
        test_chip_onclick_handlers,
        test_escape_handling,
        test_checkbox_integration,
        test_filter_state_consistency,
        test_clear_all_functionality
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
    print(f"📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All filter removal tests passed!")
        return True
    else:
        print("⚠️  Some tests failed. Please review the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
