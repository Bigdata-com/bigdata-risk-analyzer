#!/usr/bin/env python3
"""
Comprehensive test to debug data structure issues.
This test will help identify what data is missing.
"""

import os
import sys
import json
from pathlib import Path

def test_report_renderer_data_checks():
    """Test the data checks in report renderer."""
    print("🧪 Testing report renderer data checks...")
    
    report_renderer_file = Path("bigdata_risk_analyzer/static/scripts/report_renderer.js")
    
    if not report_renderer_file.exists():
        print("❌ Report renderer file not found")
        return False
    
    with open(report_renderer_file, 'r') as f:
        content = f.read()
    
    # Check for data structure validation
    data_checks = [
        "data.theme_scoring",
        "data.theme_taxonomy", 
        "data.content"
    ]
    
    for check in data_checks:
        if check in content:
            print(f"✅ {check}: Found in report renderer")
        else:
            print(f"❌ {check}: Missing from report renderer")
            return False
    
    # Check for console logging
    if "console.log('Rendering report with adapted data:'" in content:
        print("✅ Data logging: Found")
    else:
        print("❌ Data logging: Missing")
        return False
    
    print("✅ Report renderer data checks: PASSED")
    return True

def test_data_adaptation_logic():
    """Test the data adaptation logic."""
    print("🧪 Testing data adaptation logic...")
    
    report_renderer_file = Path("bigdata_risk_analyzer/static/scripts/report_renderer.js")
    
    if not report_renderer_file.exists():
        print("❌ Report renderer file not found")
        return False
    
    with open(report_renderer_file, 'r') as f:
        content = f.read()
    
    # Check for data adaptation function
    if "adaptRiskDataToThemeFormat" in content:
        print("✅ Data adaptation function: Found")
    else:
        print("❌ Data adaptation function: Missing")
        return False
    
    # Check for data transformation logic
    if "risk_scoring" in content and "theme_scoring" in content:
        print("✅ Risk to theme transformation: Found")
    else:
        print("❌ Risk to theme transformation: Missing")
        return False
    
    # Check for data structure validation
    if "if (riskData.theme_scoring)" in content:
        print("✅ Theme scoring check: Found")
    else:
        print("❌ Theme scoring check: Missing")
        return False
    
    print("✅ Data adaptation logic: PASSED")
    return True

def test_function_availability_checks():
    """Test that function availability is checked."""
    print("🧪 Testing function availability checks...")
    
    report_renderer_file = Path("bigdata_risk_analyzer/static/scripts/report_renderer.js")
    
    if not report_renderer_file.exists():
        print("❌ Report renderer file not found")
        return False
    
    with open(report_renderer_file, 'r') as f:
        content = f.read()
    
    # Check for function availability logging
    if "Available functions:" in content:
        print("✅ Function availability logging: Found")
    else:
        print("❌ Function availability logging: Missing")
        return False
    
    # Check for function type checking
    if "typeof window.renderDashboardCards" in content:
        print("✅ Function type checking: Found")
    else:
        print("❌ Function type checking: Missing")
        return False
    
    print("✅ Function availability checks: PASSED")
    return True

def test_error_handling():
    """Test that proper error handling exists."""
    print("🧪 Testing error handling...")
    
    report_renderer_file = Path("bigdata_risk_analyzer/static/scripts/report_renderer.js")
    
    if not report_renderer_file.exists():
        print("❌ Report renderer file not found")
        return False
    
    with open(report_renderer_file, 'r') as f:
        content = f.read()
    
    # Check for try-catch blocks
    if "try {" in content and "} catch" in content:
        print("✅ Try-catch blocks: Found")
    else:
        print("❌ Try-catch blocks: Missing")
        return False
    
    # Check for error logging
    if "console.error('Error rendering report:'" in content:
        print("✅ Error logging: Found")
    else:
        print("❌ Error logging: Missing")
        return False
    
    print("✅ Error handling: PASSED")
    return True

def test_tab_loading_states():
    """Test that tab loading states are properly managed."""
    print("🧪 Testing tab loading states...")
    
    report_renderer_file = Path("bigdata_risk_analyzer/static/scripts/report_renderer.js")
    
    if not report_renderer_file.exists():
        print("❌ Report renderer file not found")
        return False
    
    with open(report_renderer_file, 'r') as f:
        content = f.read()
    
    # Check for loading state management
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
    
    print("✅ Tab loading states: PASSED")
    return True

def test_debugging_output():
    """Test that debugging output is comprehensive."""
    print("🧪 Testing debugging output...")
    
    report_renderer_file = Path("bigdata_risk_analyzer/static/scripts/report_renderer.js")
    
    if not report_renderer_file.exists():
        print("❌ Report renderer file not found")
        return False
    
    with open(report_renderer_file, 'r') as f:
        content = f.read()
    
    # Check for comprehensive debugging
    debug_statements = [
        "console.log('Rendering report with adapted data:'",
        "console.log('Available functions:'",
        "console.log('Rendering heatmap...'",
        "console.log('Rendering company screener...'",
        "console.log('Rendering mindmap...'",
        "console.log('Rendering evidence table...'"
    ]
    
    found_debug = 0
    for debug in debug_statements:
        if debug in content:
            found_debug += 1
            print(f"✅ {debug}: Found")
        else:
            print(f"❌ {debug}: Missing")
    
    if found_debug >= 4:  # At least 4 debug statements should be present
        print("✅ Debugging output: COMPREHENSIVE")
    else:
        print("❌ Debugging output: INCOMPLETE")
        return False
    
    print("✅ Debugging output: PASSED")
    return True

def main():
    """Run all data debugging tests."""
    print("🚀 Starting Data Debugging Tests")
    print("=" * 60)
    
    # Change to the correct directory
    os.chdir('/Users/franciscogomez/git/bigdata/bigdata-risk-analyzer')
    
    tests = [
        test_report_renderer_data_checks,
        test_data_adaptation_logic,
        test_function_availability_checks,
        test_error_handling,
        test_tab_loading_states,
        test_debugging_output
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
    print(f"📊 Data Debugging Test Results: {passed} passed, {total - passed} failed")
    
    if passed == total:
        print("🎉 All data debugging tests passed!")
        print("\n🔍 To debug the actual issue:")
        print("1. Open browser developer tools")
        print("2. Load a case in the risk analyzer")
        print("3. Check the console for the debug messages")
        print("4. Look for messages like:")
        print("   - 'Rendering report with adapted data:'")
        print("   - 'Available functions:'")
        print("   - 'Rendering heatmap...' or 'No theme_scoring data for heatmap'")
        print("   - 'Rendering company screener...' or 'No theme_scoring data for company screener'")
        print("   - 'Rendering mindmap...' or 'No theme_taxonomy data for mindmap'")
        print("   - 'Rendering evidence table...' or 'No content data for evidence table'")
        return True
    else:
        print("⚠️  Some data debugging tests failed.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
