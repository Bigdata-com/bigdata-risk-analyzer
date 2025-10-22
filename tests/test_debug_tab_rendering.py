#!/usr/bin/env python3
"""
Debug test to check tab rendering issues.
Tests function calls, data flow, and console logging.
"""

import os
import sys
from pathlib import Path

def test_function_calls_in_report_renderer():
    """Test that all required function calls exist in report renderer."""
    print("🧪 Testing function calls in report renderer...")
    
    report_renderer_file = Path("bigdata_risk_analyzer/static/scripts/report_renderer.js")
    
    if not report_renderer_file.exists():
        print("❌ Report renderer file not found")
        return False
    
    with open(report_renderer_file, 'r') as f:
        content = f.read()
    
    # Test that all render functions are called
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
    
    # Test that setLoadingState is called for all tabs
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
    
    print("✅ Function calls in report renderer: PASSED")
    return True

def test_console_logging():
    """Test that console logging exists for debugging."""
    print("🧪 Testing console logging...")
    
    report_renderer_file = Path("bigdata_risk_analyzer/static/scripts/report_renderer.js")
    
    if not report_renderer_file.exists():
        print("❌ Report renderer file not found")
        return False
    
    with open(report_renderer_file, 'r') as f:
        content = f.read()
    
    # Check for console.log statements
    if 'console.log(' in content:
        print("✅ Console logging: Found")
    else:
        print("❌ Console logging: Missing")
        return False
    
    # Check for specific debug logging
    if 'Rendering report with adapted data:' in content:
        print("✅ Debug logging: Found")
    else:
        print("❌ Debug logging: Missing")
        return False
    
    print("✅ Console logging: PASSED")
    return True

def test_data_adaptation():
    """Test that data adaptation logic exists."""
    print("🧪 Testing data adaptation...")
    
    report_renderer_file = Path("bigdata_risk_analyzer/static/scripts/report_renderer.js")
    
    if not report_renderer_file.exists():
        print("❌ Report renderer file not found")
        return False
    
    with open(report_renderer_file, 'r') as f:
        content = f.read()
    
    # Check for data adaptation function
    if 'adaptRiskDataToThemeFormat' in content:
        print("✅ Data adaptation function: Found")
    else:
        print("❌ Data adaptation function: Missing")
        return False
    
    # Check for data structure checks
    if 'data.theme_scoring' in content:
        print("✅ Theme scoring data check: Found")
    else:
        print("❌ Theme scoring data check: Missing")
        return False
    
    if 'data.theme_taxonomy' in content:
        print("✅ Theme taxonomy data check: Found")
    else:
        print("❌ Theme taxonomy data check: Missing")
        return False
    
    if 'data.content' in content:
        print("✅ Content data check: Found")
    else:
        print("❌ Content data check: Missing")
        return False
    
    print("✅ Data adaptation: PASSED")
    return True

def test_error_handling():
    """Test that error handling exists."""
    print("🧪 Testing error handling...")
    
    report_renderer_file = Path("bigdata_risk_analyzer/static/scripts/report_renderer.js")
    
    if not report_renderer_file.exists():
        print("❌ Report renderer file not found")
        return False
    
    with open(report_renderer_file, 'r') as f:
        content = f.read()
    
    # Check for try-catch blocks
    if 'try {' in content and '} catch' in content:
        print("✅ Try-catch blocks: Found")
    else:
        print("❌ Try-catch blocks: Missing")
        return False
    
    # Check for error logging
    if 'console.error(' in content:
        print("✅ Error logging: Found")
    else:
        print("❌ Error logging: Missing")
        return False
    
    print("✅ Error handling: PASSED")
    return True

def test_tab_switching():
    """Test that tab switching logic exists."""
    print("🧪 Testing tab switching...")
    
    report_renderer_file = Path("bigdata_risk_analyzer/static/scripts/report_renderer.js")
    
    if not report_renderer_file.exists():
        print("❌ Report renderer file not found")
        return False
    
    with open(report_renderer_file, 'r') as f:
        content = f.read()
    
    # Check for tab switching
    if 'switchTab(' in content:
        print("✅ Tab switching: Found")
    else:
        print("❌ Tab switching: Missing")
        return False
    
    # Check for default tab setting
    if "switchTab('overview')" in content:
        print("✅ Default tab setting: Found")
    else:
        print("❌ Default tab setting: Missing")
        return False
    
    print("✅ Tab switching: PASSED")
    return True

def test_function_availability():
    """Test that all required functions are available globally."""
    print("🧪 Testing function availability...")
    
    # Check each script file for global exports
    script_files = {
        'dashboard_cards.js': 'renderDashboardCards',
        'heatmap.js': 'renderHeatmap',
        'company_screener.js': 'renderCompanyScreener',
        'mindmap.js': 'renderMindmap',
        'evidence_table.js': 'renderEvidenceTable'
    }
    
    for file_name, func_name in script_files.items():
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
    
    print("✅ Function availability: PASSED")
    return True

def main():
    """Run all debug tests."""
    print("🚀 Starting Debug Tests for Tab Rendering")
    print("=" * 60)
    
    # Change to the correct directory
    os.chdir('/Users/franciscogomez/git/bigdata/bigdata-risk-analyzer')
    
    tests = [
        test_function_calls_in_report_renderer,
        test_console_logging,
        test_data_adaptation,
        test_error_handling,
        test_tab_switching,
        test_function_availability
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
    print(f"📊 Debug Test Results: {passed} passed, {total - passed} failed")
    
    if passed == total:
        print("🎉 All debug tests passed! Tab rendering should work.")
        return True
    else:
        print("⚠️  Some debug tests failed. Tab rendering issues detected.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
