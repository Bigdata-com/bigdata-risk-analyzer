from bigdata_risk_analyzer.taxonomy import Node, get_leaf_labels, truncate_depth


def _four_level_tree() -> Node:
    return Node(
        node=1,
        label="Main Risk",
        summary="Root risk",
        children=[
            Node(
                node=2,
                label="Risk Channel",
                summary="Channel",
                children=[
                    Node(
                        node=3,
                        label="Risk Factor",
                        summary="Factor",
                        children=[
                            Node(node=4, label="Sub-Scenario A", summary="A"),
                            Node(node=5, label="Sub-Scenario B", summary="B"),
                        ],
                    )
                ],
            )
        ],
    )


def test_truncate_depth_none_is_noop():
    root = _four_level_tree()
    assert truncate_depth(root, None) == root


def test_truncate_depth_to_three_drops_sub_scenario_layer():
    root = _four_level_tree()
    truncated = truncate_depth(root, 3)

    # Root -> channel -> factor, with factor now a leaf (sub-scenarios cut off)
    assert truncated.label == "Main Risk"
    channel = truncated.children[0]
    assert channel.label == "Risk Channel"
    factor = channel.children[0]
    assert factor.label == "Risk Factor"
    assert factor.children == []
    assert get_leaf_labels(truncated) == ["Risk Factor"]


def test_truncate_depth_to_two_drops_two_layers():
    root = _four_level_tree()
    truncated = truncate_depth(root, 2)
    assert truncated.children[0].children == []
    assert get_leaf_labels(truncated) == ["Risk Channel"]


def test_truncate_depth_does_not_mutate_original():
    root = _four_level_tree()
    truncate_depth(root, 2)
    assert get_leaf_labels(root) == ["Sub-Scenario A", "Sub-Scenario B"]
