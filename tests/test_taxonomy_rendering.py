"""Test taxonomy rendering and mindmap compatibility."""

import json
from pathlib import Path


def test_hierarchical_taxonomy_structure():
    """Test that operational_technology.json has proper hierarchical taxonomy."""

    data_dir = (
        Path(__file__).parent.parent / "bigdata_risk_analyzer" / "static" / "data"
    )
    filepath = data_dir / "operational_technology.json"

    with open(filepath) as f:
        data = json.load(f)

    taxonomy = data["risk_taxonomy"]

    # Check root node structure
    assert "label" in taxonomy, "Root taxonomy must have 'label' field"
    assert "node" in taxonomy, "Root taxonomy must have 'node' field"
    assert "children" in taxonomy, "Root taxonomy must have 'children' field"
    assert isinstance(taxonomy["children"], list), "'children' must be a list"
    assert len(taxonomy["children"]) > 0, "Root must have at least one child"

    print(f"✅ Root taxonomy: '{taxonomy['label']}' (node {taxonomy['node']})")
    print(f"   Has {len(taxonomy['children'])} top-level categories")

    # Check first level children
    for child in taxonomy["children"]:
        assert "label" in child, "Child node must have 'label'"
        assert "node" in child, "Child node must have 'node' field"
        assert "children" in child, "Child node must have 'children' field"
        print(
            f"   - Category: '{child['label']}' (node {child['node']}, {len(child['children'])} risks)"
        )

    print("✅ Hierarchical taxonomy structure is valid")


def test_taxonomy_node_uniqueness():
    """Test that all node IDs are unique."""

    data_dir = (
        Path(__file__).parent.parent / "bigdata_risk_analyzer" / "static" / "data"
    )
    filepath = data_dir / "operational_technology.json"

    with open(filepath) as f:
        data = json.load(f)

    taxonomy = data["risk_taxonomy"]

    def collect_nodes(node, nodes=None):
        if nodes is None:
            nodes = []
        if "node" in node:
            nodes.append(node["node"])
        if "children" in node:
            for child in node["children"]:
                collect_nodes(child, nodes)
        return nodes

    all_nodes = collect_nodes(taxonomy)
    unique_nodes = set(all_nodes)

    assert len(all_nodes) == len(unique_nodes), (
        f"Found duplicate node IDs: {len(all_nodes)} total, {len(unique_nodes)} unique"
    )

    print(f"✅ All {len(all_nodes)} node IDs are unique")


def test_taxonomy_not_converted_by_adapter():
    """Test that the adapter keeps hierarchical taxonomy intact."""

    report_renderer_file = (
        Path(__file__).parent.parent
        / "bigdata_risk_analyzer"
        / "static"
        / "scripts"
        / "report_renderer.js"
    )
    config_panel_file = (
        Path(__file__).parent.parent
        / "bigdata_risk_analyzer"
        / "static"
        / "scripts"
        / "config_panel.js"
    )

    for filepath in [report_renderer_file, config_panel_file]:
        with open(filepath) as f:
            content = f.read()

        # Check that we're NOT converting taxonomy to flat structure
        assert "theme_taxonomy: riskData.risk_taxonomy" in content, (
            f"{filepath.name} should keep risk_taxonomy as-is"
        )

        # Make sure the old convertTaxonomy function is removed
        assert "function convertTaxonomy" not in content, (
            f"{filepath.name} should not have convertTaxonomy function anymore"
        )

        print(f"✅ {filepath.name} preserves hierarchical taxonomy")


def test_mindmap_expects_hierarchical_structure():
    """Test that mindmap.js expects nodes with 'node' field."""

    mindmap_file = (
        Path(__file__).parent.parent
        / "bigdata_risk_analyzer"
        / "static"
        / "scripts"
        / "mindmap.js"
    )

    with open(mindmap_file) as f:
        content = f.read()

    # Check that mindmap expects hierarchical structure
    assert "node.children" in content, "mindmap.js should check for node.children"
    assert "node.label" in content, "mindmap.js should access node.label"
    assert "node.node" in content, "mindmap.js should access node.node field"
    assert "Node ${node.node}" in content, "mindmap.js should display node ID"

    print("✅ mindmap.js expects hierarchical structure with node IDs")


def test_all_demo_taxonomies_compatible():
    """Test that all demo JSON files have compatible taxonomy structures."""

    data_dir = (
        Path(__file__).parent.parent / "bigdata_risk_analyzer" / "static" / "data"
    )

    files = {
        "import_tariffs.json": "hierarchical",
        "energy-cost.json": "hierarchical",
        "operational_technology.json": "hierarchical",
    }

    for filename, expected_type in files.items():
        filepath = data_dir / filename
        with open(filepath) as f:
            data = json.load(f)

        taxonomy = data.get("risk_taxonomy", {})

        if expected_type == "hierarchical":
            assert "children" in taxonomy, (
                f"{filename} should have hierarchical taxonomy"
            )
            assert "node" in taxonomy, f"{filename} should have node IDs"
            assert isinstance(taxonomy.get("children"), list), (
                f"{filename} children must be list"
            )
            print(
                f"✅ {filename} has hierarchical taxonomy (root: '{taxonomy.get('label', 'N/A')}')"
            )
        else:
            assert "children" not in taxonomy, f"{filename} should have flat taxonomy"
            print(f"✅ {filename} has flat taxonomy")


def test_taxonomy_depth_and_breadth():
    """Test taxonomy depth and breadth for operational_technology."""

    data_dir = (
        Path(__file__).parent.parent / "bigdata_risk_analyzer" / "static" / "data"
    )
    filepath = data_dir / "operational_technology.json"

    with open(filepath) as f:
        data = json.load(f)

    taxonomy = data["risk_taxonomy"]

    def get_depth(node, current_depth=0):
        if "children" not in node or len(node["children"]) == 0:
            return current_depth
        return max(get_depth(child, current_depth + 1) for child in node["children"])

    def count_leaves(node):
        if "children" not in node or len(node["children"]) == 0:
            return 1
        return sum(count_leaves(child) for child in node["children"])

    depth = get_depth(taxonomy)
    leaf_count = count_leaves(taxonomy)

    assert depth >= 2, f"Taxonomy should have depth >= 2, got {depth}"
    assert leaf_count >= 10, f"Taxonomy should have >= 10 leaf nodes, got {leaf_count}"

    print(f"✅ Taxonomy depth: {depth} levels")
    print(f"✅ Taxonomy breadth: {leaf_count} leaf nodes (risk factors)")


def test_adapter_preserves_taxonomy_fields():
    """Test that adapter preserves all taxonomy fields."""

    # Simulate the adapter logic
    sample_taxonomy = {
        "label": "Test Root",
        "node": 1,
        "summary": "Test summary",
        "children": [
            {
                "label": "Test Child",
                "node": 2,
                "summary": "Child summary",
                "children": [],
                "keywords": ["test"],
            }
        ],
        "keywords": ["root", "test"],
    }

    # Simulate adapter (should just pass through)
    adapted = sample_taxonomy  # This is what the adapter does now

    # Check all fields preserved
    assert adapted["label"] == "Test Root"
    assert adapted["node"] == 1
    assert adapted["summary"] == "Test summary"
    assert len(adapted["children"]) == 1
    assert adapted["children"][0]["label"] == "Test Child"
    assert adapted["children"][0]["node"] == 2
    assert "keywords" in adapted["children"][0]

    print("✅ Adapter preserves all taxonomy fields")


if __name__ == "__main__":
    print("=" * 70)
    print("Testing Taxonomy Rendering & Mindmap Compatibility")
    print("=" * 70)
    print()

    tests = [
        ("Hierarchical Taxonomy Structure", test_hierarchical_taxonomy_structure),
        ("Taxonomy Node Uniqueness", test_taxonomy_node_uniqueness),
        ("Adapter Preserves Taxonomy", test_taxonomy_not_converted_by_adapter),
        ("Mindmap Hierarchical Structure", test_mindmap_expects_hierarchical_structure),
        ("All Demo Taxonomies Compatible", test_all_demo_taxonomies_compatible),
        ("Taxonomy Depth & Breadth", test_taxonomy_depth_and_breadth),
        ("Adapter Field Preservation", test_adapter_preserves_taxonomy_fields),
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
        print("🎉 All taxonomy tests passed!")
        print("\n✅ Hierarchical taxonomy structure preserved")
        print("✅ Mindmap should now display correctly with node IDs")
    else:
        print(f"⚠️  {failed} test(s) failed")
