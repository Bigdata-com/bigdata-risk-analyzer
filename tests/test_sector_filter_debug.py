#!/usr/bin/env python3
"""
Test sector filter debugging functionality
"""

import os
import sys
import re

def test_debug_logging():
    """Test that debug logging is properly implemented"""
    print("🧪 Testing debug logging...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    if not os.path.exists(script_path):
        print("❌ Company screener script not found")
        return False
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for debug logging in removeFilter
    debug_patterns = [
        r'console\.log\(`Removing filter:',
        r'console\.log\(\'Current filterState before removal:\'',
        r'console\.log\(\`Before filter:',
        r'console\.log\(\`After filter:',
        r'console\.log\(\`Found checkbox for',
        r'console\.log\(\`No checkbox found for'
    ]
    
    for pattern in debug_patterns:
        if not re.search(pattern, content):
            print(f"❌ Missing debug pattern: {pattern}")
            return False
    
    print("✅ Debug logging is implemented")
    return True

def test_escape_handling_in_selector():
    """Test that escape handling is correct in checkbox selector"""
    print("🧪 Testing escape handling in selector...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for proper escaping in checkbox selector
    escape_patterns = [
        r'const escapedValue = escapeHtml\(value\)',
        r'\.querySelector\(`\.\$\{type\}-filter\[value="\$\{escapedValue\}"\]`\)',
        r'Looking for checkbox with value',
        r'All \$\{type\} checkboxes:'
    ]
    
    for pattern in escape_patterns:
        if not re.search(pattern, content):
            print(f"❌ Missing escape pattern: {pattern}")
            return False
    
    print("✅ Escape handling in selector is correct")
    return True

def test_filter_state_debugging():
    """Test that filter state debugging is comprehensive"""
    print("🧪 Testing filter state debugging...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for comprehensive filter state debugging
    state_debug_patterns = [
        r'console\.log\(\'updateFilterChips called with filterState:\'',
        r'console\.log\(\'filterScreener called with filterState:\'',
        r'console\.log\(\'Filtering with:\'',
        r'console\.log\(\`Filtered to.*companies\`\)',
        r'console\.log\(\`Generated.*chips:'
    ]
    
    for pattern in state_debug_patterns:
        if not re.search(pattern, content):
            print(f"❌ Missing state debug pattern: {pattern}")
            return False
    
    print("✅ Filter state debugging is comprehensive")
    return True

def test_checkbox_debugging():
    """Test that checkbox debugging is thorough"""
    print("🧪 Testing checkbox debugging...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for thorough checkbox debugging
    checkbox_debug_patterns = [
        r'console\.log\(\`All.*checkboxes:',
        r'\.forEach\(cb => console\.log',
        r'console\.log\(\`  - Value:',
        r'console\.log\(\`No checkbox found for'
    ]
    
    for pattern in checkbox_debug_patterns:
        if not re.search(pattern, content):
            print(f"❌ Missing checkbox debug pattern: {pattern}")
            return False
    
    print("✅ Checkbox debugging is thorough")
    return True

def main():
    """Run all sector filter debug tests"""
    print("🚀 Testing Sector Filter Debug Functionality")
    print("=" * 50)
    
    tests = [
        test_debug_logging,
        test_escape_handling_in_selector,
        test_filter_state_debugging,
        test_checkbox_debugging
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
        print("🎉 All sector filter debug tests passed!")
        print("🔍 Now you can test the functionality and check the browser console for debug output")
        return True
    else:
        print("⚠️  Some tests failed. Please review the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
