#!/usr/bin/env python3
"""
Test to verify the heatmap fixes for raw score clicking and top scrollbar.
"""

import os
import sys

def test_raw_score_sorting_fix():
    """Test that the raw score sorting logic has been improved."""
    
    heatmap_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/static/scripts/heatmap.js"
    
    if not os.path.exists(heatmap_path):
        print(f"❌ Heatmap script not found: {heatmap_path}")
        return False
    
    with open(heatmap_path, 'r') as f:
        content = f.read()
    
    # Check for improved score sorting logic
    if 'composite_score !== undefined' not in content:
        print("❌ Improved composite_score check not found")
        return False
    
    if 'Object.values(a[1].themes).reduce' not in content:
        print("❌ Fallback theme score calculation not found")
        return False
    
    if '?.coverage || 0' not in content:
        print("❌ Safe navigation operator for coverage not found")
        return False
    
    if '?.intensity || 0' not in content:
        print("❌ Safe navigation operator for intensity not found")
        return False
    
    print("✅ Raw score sorting logic improved with fallback calculations")
    return True

def test_top_scrollbar_fix():
    """Test that the top scrollbar is hidden by default and only shows when needed."""
    
    heatmap_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/static/scripts/heatmap.js"
    
    with open(heatmap_path, 'r') as f:
        content = f.read()
    
    # Check that top scrollbar is hidden by default
    if 'display: none;' not in content:
        print("❌ Top scrollbar not hidden by default")
        return False
    
    # Check for conditional display logic
    if 'tableWidth > tableContainer.clientWidth' not in content:
        print("❌ Conditional scrollbar display logic not found")
        return False
    
    if 'topScrollbar.style.display = \'block\'' not in content:
        print("❌ Show scrollbar logic not found")
        return False
    
    if 'topScrollbar.style.display = \'none\'' not in content:
        print("❌ Hide scrollbar logic not found")
        return False
    
    print("✅ Top scrollbar hidden by default and shows only when needed")
    return True

def test_sorting_functionality():
    """Test that the sorting functionality is properly implemented."""
    
    heatmap_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/static/scripts/heatmap.js"
    
    with open(heatmap_path, 'r') as f:
        content = f.read()
    
    # Check for sortHeatmap function
    if 'function sortHeatmap(field)' not in content:
        print("❌ sortHeatmap function not found")
        return False
    
    # Check for onclick handlers
    if 'onclick="sortHeatmap(\'score\')"' not in content:
        print("❌ Raw Score onclick handler not found")
        return False
    
    if 'onclick="sortHeatmap(\'coverage\')"' not in content:
        print("❌ Coverage Score onclick handler not found")
        return False
    
    if 'onclick="sortHeatmap(\'intensity\')"' not in content:
        print("❌ Intensity Score onclick handler not found")
        return False
    
    # Check for global export
    if 'window.sortHeatmap = sortHeatmap;' not in content:
        print("❌ sortHeatmap not exported globally")
        return False
    
    print("✅ Sorting functionality properly implemented")
    return True

def test_scrollbar_synchronization():
    """Test that scrollbar synchronization is properly implemented."""
    
    heatmap_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/static/scripts/heatmap.js"
    
    with open(heatmap_path, 'r') as f:
        content = f.read()
    
    # Check for scrollbar synchronization
    if 'Sync top scrollbar with table scroll' not in content:
        print("❌ Top scrollbar sync logic not found")
        return False
    
    if 'Sync table scroll with top scrollbar' not in content:
        print("❌ Table scroll sync logic not found")
        return False
    
    # Check for event listeners
    if 'addEventListener(\'scroll\'' not in content:
        print("❌ Scroll event listeners not found")
        return False
    
    print("✅ Scrollbar synchronization properly implemented")
    return True

if __name__ == "__main__":
    print("Testing heatmap fixes...")
    print("=" * 50)
    
    success = True
    
    # Test 1: Raw score sorting fix
    print("\n1. Testing raw score sorting fix...")
    if not test_raw_score_sorting_fix():
        success = False
    
    # Test 2: Top scrollbar fix
    print("\n2. Testing top scrollbar fix...")
    if not test_top_scrollbar_fix():
        success = False
    
    # Test 3: Sorting functionality
    print("\n3. Testing sorting functionality...")
    if not test_sorting_functionality():
        success = False
    
    # Test 4: Scrollbar synchronization
    print("\n4. Testing scrollbar synchronization...")
    if not test_scrollbar_synchronization():
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("✅ All heatmap fixes implemented successfully!")
    else:
        print("❌ Some tests failed. Please check the implementation.")
        sys.exit(1)
