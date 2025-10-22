#!/usr/bin/env python3
"""
Test to verify the heatmap debugging is in place.
"""

import os
import sys

def test_debug_logging_added():
    """Test that debug logging has been added to heatmap functions."""
    
    heatmap_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/static/scripts/heatmap.js"
    
    if not os.path.exists(heatmap_path):
        print(f"❌ Heatmap script not found: {heatmap_path}")
        return False
    
    with open(heatmap_path, 'r') as f:
        content = f.read()
    
    # Check for debug logging in sortHeatmap
    if "console.log('sortHeatmap called with field:', field)" not in content:
        print("❌ Debug logging not found in sortHeatmap")
        return False
    
    if "console.error('No heatmap data available for sorting')" not in content:
        print("❌ Error logging not found in sortHeatmap")
        return False
    
    # Check for debug logging in sortCompanies
    if "console.log('sortCompanies called with field:', field, 'direction:', direction)" not in content:
        print("❌ Debug logging not found in sortCompanies")
        return False
    
    if "console.log('Companies before sort:', companies.length)" not in content:
        print("❌ Companies count logging not found")
        return False
    
    if "console.log('Companies after sort:', companies.length)" not in content:
        print("❌ Companies after sort logging not found")
        return False
    
    print("✅ Debug logging added to heatmap functions")
    return True

def test_function_export():
    """Test that sortHeatmap is properly exported."""
    
    heatmap_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/static/scripts/heatmap.js"
    
    with open(heatmap_path, 'r') as f:
        content = f.read()
    
    # Check for global export
    if 'window.sortHeatmap = sortHeatmap;' not in content:
        print("❌ sortHeatmap not exported globally")
        return False
    
    print("✅ sortHeatmap properly exported globally")
    return True

def test_onclick_handlers():
    """Test that onclick handlers are present."""
    
    heatmap_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/static/scripts/heatmap.js"
    
    with open(heatmap_path, 'r') as f:
        content = f.read()
    
    # Check for onclick handlers
    if "onclick=\"sortHeatmap('score')\"" not in content:
        print("❌ Raw Score onclick handler not found")
        return False
    
    if "onclick=\"sortHeatmap('coverage')\"" not in content:
        print("❌ Coverage onclick handler not found")
        return False
    
    if "onclick=\"sortHeatmap('intensity')\"" not in content:
        print("❌ Intensity onclick handler not found")
        return False
    
    print("✅ All onclick handlers present")
    return True

if __name__ == "__main__":
    print("Testing heatmap debugging setup...")
    print("=" * 50)
    
    success = True
    
    # Test 1: Debug logging
    print("\n1. Testing debug logging...")
    if not test_debug_logging_added():
        success = False
    
    # Test 2: Function export
    print("\n2. Testing function export...")
    if not test_function_export():
        success = False
    
    # Test 3: Onclick handlers
    print("\n3. Testing onclick handlers...")
    if not test_onclick_handlers():
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("✅ Debug setup complete. Check browser console for logs when clicking Raw Score.")
    else:
        print("❌ Some tests failed. Please check the implementation.")
        sys.exit(1)
