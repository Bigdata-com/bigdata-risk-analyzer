#!/usr/bin/env python3
"""
Test to verify the deploy button is positioned correctly in the header navigation.
"""

import os
import sys

def test_deploy_button_position():
    """Test that the deploy button is positioned correctly in the header."""
    
    # Read the base template
    base_template_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/templates/api/base.html.jinja"
    
    if not os.path.exists(base_template_path):
        print(f"❌ Base template not found: {base_template_path}")
        return False
    
    with open(base_template_path, 'r') as f:
        content = f.read()
    
    # Check that deploy button is in the navigation
    if 'id="deployBtn"' not in content:
        print("❌ Deploy button not found in base template")
        return False
    
    # Check that deploy button is positioned before API Docs
    deploy_btn_index = content.find('id="deployBtn"')
    api_docs_index = content.find('href="/docs"')
    
    if deploy_btn_index == -1 or api_docs_index == -1:
        print("❌ Deploy button or API Docs link not found")
        return False
    
    if deploy_btn_index >= api_docs_index:
        print("❌ Deploy button is not positioned before API Docs")
        return False
    
    # Check that deploy button has correct styling
    if 'bg-orange-500' not in content:
        print("❌ Deploy button missing orange styling")
        return False
    
    if 'handleDeployClick' not in content:
        print("❌ Deploy button click handler not found")
        return False
    
    # Check that deploy button is hidden by default
    if 'style="display:none;"' not in content:
        print("❌ Deploy button not hidden by default")
        return False
    
    print("✅ Deploy button is correctly positioned before API Docs")
    print("✅ Deploy button has correct styling and functionality")
    print("✅ Deploy button is hidden by default")
    
    return True

def test_deploy_button_removed_from_index():
    """Test that deploy button is removed from index template."""
    
    index_template_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/templates/api/index.html.jinja"
    
    if not os.path.exists(index_template_path):
        print(f"❌ Index template not found: {index_template_path}")
        return False
    
    with open(index_template_path, 'r') as f:
        content = f.read()
    
    # Check that deploy button is not in index template
    if 'id="deployBtn"' in content:
        print("❌ Deploy button still found in index template")
        return False
    
    if 'handleDeployClick' in content:
        print("❌ Deploy button click handler still found in index template")
        return False
    
    print("✅ Deploy button successfully removed from index template")
    return True

def test_navigation_order():
    """Test that the navigation order is correct: Logo, Deploy, API Docs, GitHub."""
    
    base_template_path = "bigdata-risk-analyzer/bigdata_risk_analyzer/templates/api/base.html.jinja"
    
    with open(base_template_path, 'r') as f:
        content = f.read()
    
    # Find positions of navigation elements
    logo_index = content.find('id="logo-link"')
    deploy_index = content.find('id="deployBtn"')
    api_docs_index = content.find('href="/docs"')
    github_index = content.find('href="https://github.com/Bigdata-com/bigdata-risk-analyzer"')
    
    positions = [
        ("Logo", logo_index),
        ("Deploy", deploy_index),
        ("API Docs", api_docs_index),
        ("GitHub", github_index)
    ]
    
    # Check that all elements are found
    for name, index in positions:
        if index == -1:
            print(f"❌ {name} not found in navigation")
            return False
    
    # Check order
    for i in range(len(positions) - 1):
        current_name, current_index = positions[i]
        next_name, next_index = positions[i + 1]
        
        if current_index >= next_index:
            print(f"❌ Navigation order incorrect: {current_name} should come before {next_name}")
            return False
    
    print("✅ Navigation order is correct: Logo → Deploy → API Docs → GitHub")
    return True

if __name__ == "__main__":
    print("Testing deploy button positioning...")
    print("=" * 50)
    
    success = True
    
    # Test 1: Deploy button position
    print("\n1. Testing deploy button position...")
    if not test_deploy_button_position():
        success = False
    
    # Test 2: Deploy button removed from index
    print("\n2. Testing deploy button removal from index...")
    if not test_deploy_button_removed_from_index():
        success = False
    
    # Test 3: Navigation order
    print("\n3. Testing navigation order...")
    if not test_navigation_order():
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("✅ All tests passed! Deploy button is correctly positioned.")
    else:
        print("❌ Some tests failed. Please check the implementation.")
        sys.exit(1)
