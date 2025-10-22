#!/usr/bin/env python3
"""
Test the deploy button functionality for demo mode
"""

import re
import os

def test_deploy_button():
    """Test the deploy button implementation"""
    
    template_path = "/Users/franciscogomez/git/bigdata/bigdata-risk-analyzer/bigdata_risk_analyzer/templates/api/index.html.jinja"
    
    if not os.path.exists(template_path):
        print("❌ Template file not found")
        return False
    
    with open(template_path, 'r') as f:
        content = f.read()
    
    tests_passed = 0
    total_tests = 6
    
    print("🧪 Testing Deploy Button Implementation")
    print("=" * 50)
    
    # Test 1: Deploy button exists
    if 'id="deployBtn"' in content:
        print("✅ Deploy button exists with correct ID")
        tests_passed += 1
    else:
        print("❌ Deploy button not found")
    
    # Test 2: Orange styling
    if 'bg-orange-500' in content and 'hover:bg-orange-600' in content:
        print("✅ Deploy button has orange styling")
        tests_passed += 1
    else:
        print("❌ Orange styling not found")
    
    # Test 3: Rocket icon
    if 'M13 10V3L4 14h7v7l9-11h-7z' in content:
        print("✅ Rocket icon (lightning bolt) found")
        tests_passed += 1
    else:
        print("❌ Rocket icon not found")
    
    # Test 4: Demo mode conditional display
    if '{% if demo_mode %}flex{% else %}none{% endif %}' in content:
        print("✅ Demo mode conditional display implemented")
        tests_passed += 1
    else:
        print("❌ Demo mode conditional display not found")
    
    # Test 5: Deploy text
    if 'Deploy' in content:
        print("✅ Deploy button text found")
        tests_passed += 1
    else:
        print("❌ Deploy button text not found")
    
    # Test 6: JavaScript function
    if 'handleDeployClick' in content and 'deploy.labs.bigdata.com' in content:
        print("✅ JavaScript function and redirect URL found")
        tests_passed += 1
    else:
        print("❌ JavaScript function or redirect URL not found")
    
    print("\n" + "=" * 50)
    print(f"📊 Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 Deploy button successfully implemented!")
        return True
    else:
        print(f"⚠️  {total_tests - tests_passed} issues need attention")
        return False

if __name__ == "__main__":
    test_deploy_button()
