#!/usr/bin/env python3
"""
Test to verify enhanced debugging is in place.
"""

import os
import sys

def test_enhanced_debug_added():
    """Test that enhanced debugging has been added."""
    
    heatmap_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/static/scripts/heatmap.js"
    
    if not os.path.exists(heatmap_path):
        print(f"❌ Heatmap script not found: {heatmap_path}")
        return False
    
    with open(heatmap_path, 'r') as f:
        content = f.read()
    
    # Check for enhanced debugging in sortHeatmap
    if "About to call sortCompanies with:" not in content:
        print("❌ Enhanced debugging not found in sortHeatmap")
        return False
    
    if "First company data:" not in content:
        print("❌ Company data logging not found")
        return False
    
    if "About to call renderHeatmapFromData" not in content:
        print("❌ renderHeatmapFromData call logging not found")
        return False
    
    # Check for enhanced debugging in sortCompanies
    if "=== sortCompanies ENTRY ===" not in content:
        print("❌ sortCompanies entry logging not found")
        return False
    
    if "Companies array:" not in content:
        print("❌ Companies array logging not found")
        return False
    
    if "First company:" not in content:
        print("❌ First company logging not found")
        return False
    
    print("✅ Enhanced debugging added to heatmap functions")
    return True

if __name__ == "__main__":
    print("Testing enhanced debugging...")
    print("=" * 50)
    
    success = True
    
    # Test 1: Enhanced debugging
    print("\n1. Testing enhanced debugging...")
    if not test_enhanced_debug_added():
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("✅ Enhanced debugging setup complete. Check browser console for detailed logs when clicking Raw Score.")
    else:
        print("❌ Some tests failed. Please check the implementation.")
        sys.exit(1)
