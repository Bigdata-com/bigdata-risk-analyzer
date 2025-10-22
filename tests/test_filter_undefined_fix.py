#!/usr/bin/env python3
"""
Test the fix for undefined filter state error
"""

import os
import sys
import re

def test_filter_state_initialization():
    """Test that filter state is properly initialized"""
    print("🧪 Testing filter state initialization...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    if not os.path.exists(script_path):
        print("❌ Company screener script not found")
        return False
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for proper filter state initialization
    init_patterns = [
        r'let filterState = \{',
        r'search: \'\'',
        r'sectors: \[\]',
        r'industries: \[\]',
        r'risks: \[\]',
        r'topN: \'\''
    ]
    
    for pattern in init_patterns:
        if not re.search(pattern, content):
            print(f"❌ Missing initialization pattern: {pattern}")
            return False
    
    print("✅ Filter state is properly initialized")
    return True

def test_undefined_checks():
    """Test that undefined checks are in place"""
    print("🧪 Testing undefined checks...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for undefined checks in removeFilter
    undefined_checks = [
        r'if \(!filterState\[type\]\)',
        r'filterState\[type\] = \[\]',
        r'\(filterState\.sectors \|\| \[\]\)',
        r'\(filterState\.industries \|\| \[\]\)',
        r'\(filterState\.risks \|\| \[\]\)'
    ]
    
    for check in undefined_checks:
        if not re.search(check, content):
            print(f"❌ Missing undefined check: {check}")
            return False
    
    print("✅ Undefined checks are in place")
    return True

def test_safe_array_access():
    """Test that array access is safe"""
    print("🧪 Testing safe array access...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for safe array access patterns
    safe_patterns = [
        r'\(filterState\.sectors \|\| \[\]\)\.forEach',
        r'\(filterState\.industries \|\| \[\]\)\.forEach',
        r'\(filterState\.risks \|\| \[\]\)\.forEach',
        r'filterState\[type\]\.filter'
    ]
    
    for pattern in safe_patterns:
        if not re.search(pattern, content):
            print(f"❌ Missing safe access pattern: {pattern}")
            return False
    
    print("✅ Safe array access is implemented")
    return True

def test_null_checks():
    """Test that null checks are in place for DOM elements"""
    print("🧪 Testing null checks for DOM elements...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for null checks
    null_checks = [
        r'if \(!chipsContainer\) return',
        r'topNSelect \? topNSelect\.value : \'\'',
        r'if \(checkbox\) checkbox\.checked = false'
    ]
    
    for check in null_checks:
        if not re.search(check, content):
            print(f"❌ Missing null check: {check}")
            return False
    
    print("✅ Null checks are in place")
    return True

def test_error_prevention():
    """Test that error prevention measures are comprehensive"""
    print("🧪 Testing error prevention measures...")
    
    script_path = "bigdata_risk_analyzer/static/scripts/company_screener.js"
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Test for comprehensive error prevention
    error_prevention = [
        r'filterState\[type\] = filterState\[type\]\.filter',  # After null check
        r'\(filterState\.\w+ \|\| \[\]\)',  # Safe array access
        r'if \(!filterState\[type\]\)',  # Null check before filter
        r'topNSelect \? topNSelect\.value'  # Safe property access
    ]
    
    for prevention in error_prevention:
        if not re.search(prevention, content):
            print(f"❌ Missing error prevention: {prevention}")
            return False
    
    print("✅ Error prevention measures are comprehensive")
    return True

def main():
    """Run all undefined filter state tests"""
    print("🚀 Testing Undefined Filter State Fix")
    print("=" * 50)
    
    tests = [
        test_filter_state_initialization,
        test_undefined_checks,
        test_safe_array_access,
        test_null_checks,
        test_error_prevention
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
        print("🎉 All undefined filter state tests passed!")
        return True
    else:
        print("⚠️  Some tests failed. Please review the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
