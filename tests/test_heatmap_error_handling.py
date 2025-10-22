#!/usr/bin/env python3
"""
Test to verify error handling is added to heatmap functions.
"""

import os
import sys

def test_error_handling_added():
    """Test that try-catch blocks have been added to heatmap functions."""
    
    heatmap_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/static/scripts/heatmap.js"
    
    if not os.path.exists(heatmap_path):
        print(f"❌ Heatmap script not found: {heatmap_path}")
        return False
    
    with open(heatmap_path, 'r') as f:
        content = f.read()
    
    # Check for try-catch in sortHeatmap
    if "try {" not in content:
        print("❌ Try-catch block not found in sortHeatmap")
        return False
    
    if "console.error('Error in sortHeatmap:', error)" not in content:
        print("❌ Error logging not found in sortHeatmap")
        return False
    
    # Check for try-catch in sortCompanies
    if "console.error('Error in sortCompanies:', error)" not in content:
        print("❌ Error logging not found in sortCompanies")
        return False
    
    print("✅ Error handling added to heatmap functions")
    return True

if __name__ == "__main__":
    print("Testing heatmap error handling...")
    print("=" * 50)
    
    success = True
    
    # Test 1: Error handling
    print("\n1. Testing error handling...")
    if not test_error_handling_added():
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("✅ Error handling setup complete. Check browser console for any errors when clicking Raw Score.")
    else:
        print("❌ Some tests failed. Please check the implementation.")
        sys.exit(1)
