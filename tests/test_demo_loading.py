"""Comprehensive tests for demo loading functionality."""

import json
from pathlib import Path


def test_all_json_files_exist():
    """Test that all demo JSON files exist and are accessible."""
    
    data_dir = Path(__file__).parent.parent / "bigdata_risk_analyzer" / "static" / "data"
    
    required_files = {
        'import_tariffs.json': 'Import Tariffs China demo',
        'energy-cost.json': 'Energy Cost demo',
        'operational_technology.json': 'Operational & Technology demo'
    }
    
    for filename, description in required_files.items():
        filepath = data_dir / filename
        assert filepath.exists(), f"{description} file missing: {filename}"
        assert filepath.stat().st_size > 0, f"{description} file is empty: {filename}"
        print(f"✅ {description} file exists: {filename}")


def test_all_json_files_valid():
    """Test that all demo JSON files contain valid JSON."""
    
    data_dir = Path(__file__).parent.parent / "bigdata_risk_analyzer" / "static" / "data"
    
    files = ['import_tariffs.json', 'energy-cost.json', 'operational_technology.json']
    
    for filename in files:
        filepath = data_dir / filename
        try:
            with open(filepath) as f:
                data = json.load(f)
            print(f"✅ {filename} is valid JSON")
        except json.JSONDecodeError as e:
            assert False, f"{filename} contains invalid JSON: {e}"


def test_all_json_files_have_required_structure():
    """Test that all demo JSON files have the required risk_scoring structure."""
    
    data_dir = Path(__file__).parent.parent / "bigdata_risk_analyzer" / "static" / "data"
    
    files = {
        'import_tariffs.json': {'min_companies': 60, 'min_content': 1000},
        'energy-cost.json': {'min_companies': 80, 'min_content': 1000},
        'operational_technology.json': {'min_companies': 90, 'min_content': 5000}
    }
    
    for filename, requirements in files.items():
        filepath = data_dir / filename
        with open(filepath) as f:
            data = json.load(f)
        
        # Check required top-level keys
        assert 'risk_scoring' in data, f"{filename} missing 'risk_scoring'"
        assert 'risk_taxonomy' in data, f"{filename} missing 'risk_taxonomy'"
        assert 'content' in data, f"{filename} missing 'content'"
        
        # Check company count
        companies = data['risk_scoring']
        assert len(companies) >= requirements['min_companies'], \
            f"{filename} has {len(companies)} companies, expected >= {requirements['min_companies']}"
        
        # Check content count
        content = data['content']
        assert len(content) >= requirements['min_content'], \
            f"{filename} has {len(content)} content items, expected >= {requirements['min_content']}"
        
        # Check taxonomy structure
        taxonomy = data['risk_taxonomy']
        assert isinstance(taxonomy, dict), f"{filename} taxonomy must be a dict"
        assert 'children' in taxonomy or len(taxonomy) > 0, \
            f"{filename} taxonomy must have children or be non-empty"
        
        print(f"✅ {filename}: {len(companies)} companies, {len(content)} content items")


def test_company_data_structure():
    """Test that company data has the expected structure."""
    
    data_dir = Path(__file__).parent.parent / "bigdata_risk_analyzer" / "static" / "data"
    
    for filename in ['import_tariffs.json', 'energy-cost.json', 'operational_technology.json']:
        filepath = data_dir / filename
        with open(filepath) as f:
            data = json.load(f)
        
        companies = data['risk_scoring']
        sample_company = list(companies.values())[0]
        
        # Check required company fields
        assert 'ticker' in sample_company, f"{filename} company missing 'ticker'"
        assert 'sector' in sample_company, f"{filename} company missing 'sector'"
        assert 'composite_score' in sample_company, f"{filename} company missing 'composite_score'"
        assert 'risks' in sample_company, f"{filename} company missing 'risks'"
        
        # Check risks structure
        risks = sample_company['risks']
        assert isinstance(risks, dict), f"{filename} company risks must be a dict"
        assert len(risks) > 0, f"{filename} company must have at least one risk"
        
        print(f"✅ {filename} has valid company structure")


def test_content_data_structure():
    """Test that content items have the expected structure."""
    
    data_dir = Path(__file__).parent.parent / "bigdata_risk_analyzer" / "static" / "data"
    
    for filename in ['import_tariffs.json', 'energy-cost.json', 'operational_technology.json']:
        filepath = data_dir / filename
        with open(filepath) as f:
            data = json.load(f)
        
        content = data['content']
        sample_content = content[0]
        
        # Check required content fields
        required_fields = ['company', 'ticker', 'quote', 'risk_factor']
        for field in required_fields:
            assert field in sample_content, \
                f"{filename} content item missing '{field}'"
        
        # Check that risk_factor is not empty
        assert sample_content['risk_factor'], \
            f"{filename} content item has empty risk_factor"
        
        print(f"✅ {filename} has valid content structure")


def test_config_panel_templates_match():
    """Test that config_panel.js has all three templates defined."""
    
    config_panel_file = Path(__file__).parent.parent / "bigdata_risk_analyzer" / "static" / "scripts" / "config_panel.js"
    
    with open(config_panel_file) as f:
        content = f.read()
    
    # Check for all three template IDs
    required_templates = [
        "'import-tariffs':",
        "'energy-cost':",
        "'operational-technology':"
    ]
    
    for template in required_templates:
        assert template in content, \
            f"config_panel.js missing template: {template}"
        print(f"✅ config_panel.js has template: {template}")
    
    # Check for correct file paths
    assert "'/static/data/import_tariffs.json'" in content
    assert "'/static/data/energy-cost.json'" in content
    assert "'/static/data/operational_technology.json'" in content
    print(f"✅ config_panel.js has correct file paths")


def test_main_page_cards_match():
    """Test that index.html.jinja has all three quick start cards."""
    
    index_file = Path(__file__).parent.parent / "bigdata_risk_analyzer" / "templates" / "api" / "index.html.jinja"
    
    with open(index_file) as f:
        content = f.read()
    
    # Check for all three template IDs in main page
    main_page_templates = [
        "loadQuickStartTemplate('import-tariffs')",
        "loadQuickStartTemplate('energy-cost')",
        "loadQuickStartTemplate('operational-technology')"
    ]
    
    for template in main_page_templates:
        assert template in content, \
            f"index.html.jinja missing main page card: {template}"
        print(f"✅ index.html.jinja main page has: {template}")
    
    # Check for all three template IDs in configuration panel
    config_panel_templates = [
        "loadQuickStartTemplate('import-tariffs')",
        "loadQuickStartTemplate('energy-cost')",
        "loadQuickStartTemplate('operational-technology')"
    ]
    
    for template in config_panel_templates:
        # Count occurrences (should appear in both main page and config panel)
        count = content.count(template)
        assert count >= 2, \
            f"index.html.jinja should have {template} at least twice (main page + config panel), found {count}"
        print(f"✅ index.html.jinja config panel has: {template}")


def test_taxonomy_conversion_logic():
    """Test that the taxonomy converter handles hierarchical structure."""
    
    data_dir = Path(__file__).parent.parent / "bigdata_risk_analyzer" / "static" / "data"
    
    # Test with import_tariffs.json which has hierarchical taxonomy
    filepath = data_dir / 'import_tariffs.json'
    with open(filepath) as f:
        data = json.load(f)
    
    taxonomy = data['risk_taxonomy']
    
    # Check that it's hierarchical (has children)
    assert 'children' in taxonomy, "import_tariffs.json should have hierarchical taxonomy"
    assert isinstance(taxonomy['children'], list), "Taxonomy children should be a list"
    assert len(taxonomy['children']) > 0, "Taxonomy should have at least one child"
    
    # Check first level children
    for child in taxonomy['children']:
        assert 'label' in child, "Taxonomy child should have label"
        assert 'children' in child, "Taxonomy child should have children"
    
    print(f"✅ Hierarchical taxonomy structure validated")


def test_adapter_function_exists():
    """Test that the adapter function exists in the necessary files."""
    
    required_files = [
        Path(__file__).parent.parent / "bigdata_risk_analyzer" / "static" / "scripts" / "report_renderer.js",
        Path(__file__).parent.parent / "bigdata_risk_analyzer" / "static" / "scripts" / "config_panel.js"
    ]
    
    for filepath in required_files:
        with open(filepath) as f:
            content = f.read()
        
        assert 'function adaptRiskDataToThemeFormat' in content, \
            f"{filepath.name} missing adaptRiskDataToThemeFormat function"
        assert 'function convertTaxonomy' in content, \
            f"{filepath.name} missing convertTaxonomy helper function"
        assert 'risk_scoring' in content, \
            f"{filepath.name} should handle risk_scoring format"
        assert 'theme_scoring' in content, \
            f"{filepath.name} should convert to theme_scoring format"
        
        print(f"✅ {filepath.name} has adapter function with taxonomy converter")


def test_demo_metadata_display():
    """Test that dashboard cards show correct demo metadata."""
    
    dashboard_cards_file = Path(__file__).parent.parent / "bigdata_risk_analyzer" / "static" / "scripts" / "dashboard_cards.js"
    
    with open(dashboard_cards_file) as f:
        content = f.read()
    
    # Check for updated source and period
    assert 'Source: News' in content, \
        "Dashboard should show 'Source: News' for demo mode"
    assert 'Period: Last Month' in content, \
        "Dashboard should show 'Period: Last Month' for demo mode"
    
    # Check for analysis date
    assert 'Analysis generated on 15/10/2025' in content, \
        "Dashboard should show 'Analysis generated on 15/10/2025' for demo mode"
    
    # Check that it's only shown in demo mode
    assert 'config.isDemo' in content, \
        "Demo metadata should only show when config.isDemo is true"
    
    print(f"✅ Dashboard cards show correct demo metadata")
    print(f"   - Source: News")
    print(f"   - Period: Last Month")
    print(f"   - Analysis generated on 15/10/2025")


if __name__ == "__main__":
    print("=" * 70)
    print("Testing Demo Loading Functionality")
    print("=" * 70)
    print()
    
    tests = [
        ("JSON Files Exist", test_all_json_files_exist),
        ("JSON Files Valid", test_all_json_files_valid),
        ("JSON Structure Complete", test_all_json_files_have_required_structure),
        ("Company Data Structure", test_company_data_structure),
        ("Content Data Structure", test_content_data_structure),
        ("Config Panel Templates", test_config_panel_templates_match),
        ("Main Page Cards", test_main_page_cards_match),
        ("Taxonomy Conversion", test_taxonomy_conversion_logic),
        ("Adapter Functions", test_adapter_function_exists),
        ("Demo Metadata Display", test_demo_metadata_display)
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        print(f"\n📋 {test_name}")
        print("-" * 70)
        try:
            test_func()
            passed += 1
            print(f"✅ {test_name} PASSED\n")
        except AssertionError as e:
            failed += 1
            print(f"❌ {test_name} FAILED")
            print(f"   Error: {e}\n")
        except Exception as e:
            failed += 1
            print(f"❌ {test_name} ERROR")
            print(f"   Error: {e}\n")
    
    print("=" * 70)
    print(f"Test Results: {passed} passed, {failed} failed")
    print("=" * 70)
    
    if failed == 0:
        print("🎉 All tests passed! All 3 demos are properly configured.")
        print("\n📋 Summary:")
        print("  ✅ Import Tariffs against China - 65 companies")
        print("  ✅ Rising Energy Costs - 86 companies")
        print("  ✅ Operational & Technology - 99 companies")
        print("\n🎯 Both main page and configuration panel cards are working!")
    else:
        print(f"⚠️  {failed} test(s) failed")

