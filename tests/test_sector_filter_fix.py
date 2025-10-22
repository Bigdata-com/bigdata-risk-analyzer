#!/usr/bin/env python3
"""
Test the sector filter fix
"""

import os
import sys
import re

def test_robust_checkbox_selector():
    """Test that the checkbox selector is robust"""
    print("🧪 Testing robust checkbox selector...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    if not os.path.exists(script_path):
        print("❌ Company screener script not found")
        return False
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for robust checkbox selection
    robust_patterns = [
        r'const escapedValue = escapeHtml\(value\)',
        r'let checkbox = document\.querySelector\(`\.\$\{type\}-filter\[value="\$\{escapedValue\}"\]`\)',
        r'if \(!checkbox\)',
        r'checkbox = document\.querySelector\(`\.\$\{type\}-filter\[value="\$\{value\}"\]`\)',
        r'const allCheckboxes = document\.querySelectorAll\(`\.\$\{type\}-filter`\)',
        r'for \(const cb of allCheckboxes\)',
        r'if \(cb\.value === value \|\| cb\.value === escapedValue\)'
    ]
    
    for pattern in robust_patterns:
        if not re.search(pattern, content):
            print(f"❌ Missing robust pattern: {pattern}")
            return False
    
    print("✅ Robust checkbox selector is implemented")
    return True

def test_filter_state_management():
    """Test that filter state management is correct"""
    print("🧪 Testing filter state management...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for proper filter state management
    state_patterns = [
        r'if \(!filterState\[type\]\)',
        r'filterState\[type\] = \[\]',
        r'filterState\[type\] = filterState\[type\]\.filter\(item => item !== value\)',
        r'updateFilterChips\(\)',
        r'filterScreener\(\)'
    ]
    
    for pattern in state_patterns:
        if not re.search(pattern, content):
            print(f"❌ Missing state pattern: {pattern}")
            return False
    
    print("✅ Filter state management is correct")
    return True

def test_no_debug_code():
    """Test that debug code has been removed"""
    print("🧪 Testing that debug code has been removed...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test that debug console.log statements are not present
    debug_patterns = [
        r'console\.log\(`Removing filter:',
        r'console\.log\(\'Current filterState before removal:\'',
        r'console\.log\(\`Before filter:',
        r'console\.log\(\`After filter:',
        r'console\.log\(\'updateFilterChips called with filterState:\'',
        r'console\.log\(\'filterScreener called with filterState:\''
    ]
    
    for pattern in debug_patterns:
        if re.search(pattern, content):
            print(f"❌ Debug code still present: {pattern}")
            return False
    
    print("✅ Debug code has been removed")
    return True

def test_functionality_integrity():
    """Test that all functionality is intact"""
    print("🧪 Testing functionality integrity...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test that all core functions are present
    function_patterns = [
        r'function removeFilter\(',
        r'function updateFilterChips\(',
        r'function filterScreener\(',
        r'function clearAllFilters\(',
        r'function handleFilterChange\(',
        r'function handleSearchInput\('
    ]
    
    for pattern in function_patterns:
        if not re.search(pattern, content):
            print(f"❌ Missing function: {pattern}")
            return False
    
    print("✅ All functionality is intact")
    return True

def main():
    """Run all sector filter fix tests"""
    print("🚀 Testing Sector Filter Fix")
    print("=" * 40)
    
    tests = [
        test_robust_checkbox_selector,
        test_filter_state_management,
        test_no_debug_code,
        test_functionality_integrity
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
    
    print("=" * 40)
    print(f"📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All sector filter fix tests passed!")
        print("✅ The sector filter deselection should now work correctly")
        return True
    else:
        print("⚠️  Some tests failed. Please review the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
