#!/usr/bin/env python3
"""
Test the updated demo mode message
"""

import os

def test_demo_message_update():
    """Test the updated demo mode message"""
    
    template_path = "/Users/franciscogomez/git/bigdata/bigdata-risk-analyzer/bigdata_risk_analyzer/templates/api/index.html.jinja"
    
    if not os.path.exists(template_path):
        print("❌ Template file not found")
        return False
    
    with open(template_path, 'r') as f:
        content = f.read()
    
    tests_passed = 0
    total_tests = 4
    
    print("🧪 Testing Demo Mode Message Update")
    print("=" * 50)
    
    # Test 1: Updated GitHub link
    if 'https://github.com/Bigdata-com/bigdata-risk-analyzer' in content:
        print("✅ Correct GitHub repository link found")
        tests_passed += 1
    else:
        print("❌ GitHub repository link not found")
    
    # Test 2: Deployment service link
    if 'https://deploy.labs.bigdata.com' in content:
        print("✅ Deployment service link found")
        tests_passed += 1
    else:
        print("❌ Deployment service link not found")
    
    # Test 3: Demo mode message structure
    if 'Demo mode activated. For access to the full version' in content:
        print("✅ Demo mode message structure preserved")
        tests_passed += 1
    else:
        print("❌ Demo mode message structure not found")
    
    # Test 4: All three options present
    if 'support@bigdata.com' in content and 'GitHub' in content and 'deploy.labs.bigdata.com' in content:
        print("✅ All three access options present")
        tests_passed += 1
    else:
        print("❌ Not all access options present")
    
    print("\n" + "=" * 50)
    print(f"📊 Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 Demo mode message successfully updated!")
        return True
    else:
        print(f"⚠️  {total_tests - tests_passed} issues need attention")
        return False

if __name__ == "__main__":
    test_demo_message_update()
