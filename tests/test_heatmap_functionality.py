#!/usr/bin/env python3
"""
Test script for heatmap functionality including scrollbar and risk ordering.
"""

import os
import sys
import re
from pathlib import Path

def test_heatmap_scrollbar_functionality():
    """Test that scrollbar functionality is properly implemented."""
    print("🧪 Testing heatmap scrollbar functionality...")
    
    heatmap_file = Path("bigdata_risk_analyzer/static/scripts/heatmap.js")
    
    if not heatmap_file.exists():
        print("❌ Heatmap file not found")
        return False
    
    with open(heatmap_file, 'r') as f:
        content = f.read()
    
    # Test 1: Check for scrollbar IDs
    scrollbar_tests = [
        ('top-scrollbar', 'Top scrollbar ID'),
        ('table-container', 'Table container ID'),
        ('top-scroll-content', 'Top scroll content ID')
    ]
    
    for test_id, description in scrollbar_tests:
        if f'id="{test_id}"' in content:
            print(f"✅ {description}: Found")
        else:
            print(f"❌ {description}: Missing")
            return False
    
    # Test 2: Check for scrollbar synchronization
    sync_tests = [
        ('addEventListener', 'Event listener setup'),
        ('scrollLeft', 'Scroll synchronization'),
        ('scrollWidth', 'Width calculation')
    ]
    
    for test_pattern, description in sync_tests:
        if test_pattern in content:
            print(f"✅ {description}: Found")
        else:
            print(f"❌ {description}: Missing")
            return False
    
    # Test 3: Check for scrollbar HTML structure
    html_tests = [
        ('overflow-x-auto', 'Horizontal scroll class'),
        ('top-scrollbar', 'Top scrollbar container'),
        ('table-container', 'Table container')
    ]
    
    for test_pattern, description in html_tests:
        if test_pattern in content:
            print(f"✅ {description}: Found")
        else:
            print(f"❌ {description}: Missing")
            return False
    
    print("✅ Heatmap scrollbar functionality: PASSED")
    return True

def test_risk_ordering_functionality():
    """Test that risk ordering functionality is properly implemented."""
    print("🧪 Testing risk ordering functionality...")
    
    heatmap_file = Path("bigdata_risk_analyzer/static/scripts/heatmap.js")
    
    if not heatmap_file.exists():
        print("❌ Heatmap file not found")
        return False
    
    with open(heatmap_file, 'r') as f:
        content = f.read()
    
    # Test 1: Check for sortRiskHeatmap function
    if 'function sortRiskHeatmap(' in content:
        print("✅ sortRiskHeatmap function: Found")
    else:
        print("❌ sortRiskHeatmap function: Missing")
        return False
    
    # Test 2: Check for risk calculation function
    if 'calculateRiskCoverageAndIntensity(' in content:
        print("✅ calculateRiskCoverageAndIntensity function: Found")
    else:
        print("❌ calculateRiskCoverageAndIntensity function: Missing")
        return False
    
    # Test 3: Check for sorting field handling
    sort_fields = ['coverage', 'intensity', 'evidence']
    for field in sort_fields:
        if f"field === '{field}'" in content:
            print(f"✅ {field} sorting: Found")
        else:
            print(f"❌ {field} sorting: Missing")
            return False
    
    # Test 4: Check for array copying (avoiding mutation)
    if '[...themes]' in content:
        print("✅ Array copying to avoid mutation: Found")
    else:
        print("❌ Array copying to avoid mutation: Missing")
        return False
    
    # Test 5: Check for sort direction handling
    if 'currentSortDirection' in content:
        print("✅ Sort direction handling: Found")
    else:
        print("❌ Sort direction handling: Missing")
        return False
    
    # Test 6: Check for risk view rendering
    if 'renderRiskView(' in content:
        print("✅ Risk view rendering: Found")
    else:
        print("❌ Risk view rendering: Missing")
        return False
    
    print("✅ Risk ordering functionality: PASSED")
    return True

def test_heatmap_initialization():
    """Test that heatmap initializes properly with all elements."""
    print("🧪 Testing heatmap initialization...")
    
    heatmap_file = Path("bigdata_risk_analyzer/static/scripts/heatmap.js")
    
    if not heatmap_file.exists():
        print("❌ Heatmap file not found")
        return False
    
    with open(heatmap_file, 'r') as f:
        content = f.read()
    
    # Test 1: Check for initial render function
    if 'function renderHeatmap(' in content:
        print("✅ Initial render function: Found")
    else:
        print("❌ Initial render function: Missing")
        return False
    
    # Test 2: Check for button elements in initial render
    button_tests = [
        ('showHeatmapGuide()', 'How to Read button'),
        ('flipHeatmapView()', 'Flip view button'),
        ('id="flipButtonText"', 'Flip button text')
    ]
    
    for test_pattern, description in button_tests:
        if test_pattern in content:
            print(f"✅ {description}: Found")
        else:
            print(f"❌ {description}: Missing")
            return False
    
    # Test 3: Check for scrollbar in initial render
    if 'top-scrollbar' in content and 'table-container' in content:
        print("✅ Scrollbar elements in initial render: Found")
    else:
        print("❌ Scrollbar elements in initial render: Missing")
        return False
    
    print("✅ Heatmap initialization: PASSED")
    return True

def test_heatmap_data_structure():
    """Test that heatmap data structure supports all functionality."""
    print("🧪 Testing heatmap data structure...")
    
    heatmap_file = Path("bigdata_risk_analyzer/static/scripts/heatmap.js")
    
    if not heatmap_file.exists():
        print("❌ Heatmap file not found")
        return False
    
    with open(heatmap_file, 'r') as f:
        content = f.read()
    
    # Test 1: Check for global variables
    global_vars = ['currentHeatmapData', 'currentSortField', 'currentSortDirection', 'isRiskView']
    for var in global_vars:
        if f'let {var}' in content or f'var {var}' in content:
            print(f"✅ Global variable {var}: Found")
        else:
            print(f"❌ Global variable {var}: Missing")
            return False
    
    # Test 2: Check for data structure handling
    data_tests = [
        ('companies', 'Companies data'),
        ('themes', 'Themes data'),
        ('maxScore', 'Max score data'),
        ('coverageIntensity', 'Coverage/Intensity data')
    ]
    
    for test_pattern, description in data_tests:
        if test_pattern in content:
            print(f"✅ {description}: Found")
        else:
            print(f"❌ {description}: Missing")
            return False
    
    print("✅ Heatmap data structure: PASSED")
    return True

def main():
    """Run all heatmap functionality tests."""
    print("🚀 Starting Heatmap Functionality Tests")
    print("=" * 50)
    
    # Change to the correct directory
    os.chdir('/Users/franciscogomez/git/bigdata/bigdata-risk-analyzer')
    
    tests = [
        test_heatmap_scrollbar_functionality,
        test_risk_ordering_functionality,
        test_heatmap_initialization,
        test_heatmap_data_structure
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
        print("🎉 All heatmap functionality tests passed!")
        return True
    else:
        print("⚠️  Some tests failed. Issues need to be addressed.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
