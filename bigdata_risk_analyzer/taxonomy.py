"""Risk taxonomy generation and leaf-node helpers.

Ported from ``Thematic_Screener_CLI/src/screener.py`` (risk-analyzer mode),
``src/prompts.py`` (risk-mode prompts only), ``src/helpers.py``, and
``src/search_query.py``. Replaces
``bigdata_research_tools.mindmap.mindmap.MindMap`` / ``MindMapGenerator``.
"""

from __future__ import annotations

import re

from openai import OpenAI
from pydantic import BaseModel, Field

from bigdata_risk_analyzer.openai_utils import build_openai_client

DEFAULT_MAX_LEAF_LABELS = 15

# ---------------------------------------------------------------------------
# Prompts (risk-analyzer mode), verbatim from Thematic_Screener_CLI/src/prompts.py
# ---------------------------------------------------------------------------

SYSTEM_MESSAGE_RISK = """
Forget all previous prompts.
You are assisting a professional risk analyst tasked with creating a screener to measure the exposure of companies to the risk {main_theme}.
Your objective is to generate a comprehensive tree structure of distinct risk factors and sub-scenarios that will guide the analyst's research process.
Follow these steps strictly:
1. **Understand the Core Risk {main_theme}**:
   - The risk {main_theme} is a central concept. All components are essential for a thorough understanding of how companies are exposed to it.
2. **Create a Taxonomy of Risk Factors for {main_theme}**:
   - Decompose the main risk {main_theme} into concise, focused, and self-contained risk channels, risk factors, and specific sub-scenarios.
   - Organize the tree so that the top-level children represent broad risk channels, their children represent specific risk factors, and the leaf nodes represent concrete, observable sub-scenarios.
   - Each node should represent a singular, concise, informative, and clear aspect of the main risk.
   - Expand each node to be relevant for the {main_theme}: a single word is not informative enough.
   - Prioritize clarity and specificity. Leaf sub-scenarios should be specific enough to be detected in company news, filings, and transcripts.
   - Avoid repetition and strive for diverse, non-overlapping angles of exposure.
3. **Iterate Based on the Analyst's Focus {analyst_focus}**:
   - If no specific {analyst_focus} is provided, transition directly to formatting the JSON response.
3. **Format Your Response as a JSON Object**:
   - Each node in the JSON object must include:
     - `node`: an integer representing the unique identifier for the node.
     - `label`: a string for the name of the risk channel, risk factor, or sub-scenario.
     - `summary`: a string to explain briefly in maximum 15 words why the node is a risk related to {main_theme}.
       - For the node referring to the first node {main_theme}, just define briefly in maximum 15 words the risk {main_theme}.
     - `children`: an array of child nodes.
     - Do not add the starting '''json and the ending '''.

IMPORTANT: Your response MUST be a valid JSON object. Each node in the JSON object must include:
            - `node`: an integer representing the unique identifier for the node.
            - `label`: a string for the name of the risk factor or sub-scenario.
            - `summary`: a string to explain briefly in maximum 15 words why the node is a risk related to the main risk.
            - For the node referring to the main risk, just define briefly in maximum 15 words the risk.
            - `children`: an array of child nodes.
Format the JSON object as a nested dictionary. Be careful when specifying keys and items.
Avoid overlapping labels. Break down joint concepts into unique parents so that each parent represents ONLY ONE concept. AVOID creating branch names such as 'Compliance and Regulatory Risk'. Keep risks separate and create a single branch for each risk, such as 'Compliance Risk' and 'Regulatory Risk', each with their own children.
Return ONLY the JSON object, with no extra text, explanation, or markdown.
You MUST use ONLY these field names: label, node, summary, children. Do NOT use underscores, spaces, or any other characters in field names. If you use any other field names, your answer will be rejected.
## Example Structure:
**Risk: US Government Shutdown**
{{
  "node": 1,
  "label": "US Government Shutdown",
  "summary": "A lapse in federal funding that halts government operations and spending",
  "children": [
    {{"node": 2, "label": "Federal Spending Disruption", "summary": "A shutdown freezes or delays federal contracts and payments to companies", "children": [
      {{"node": 5, "label": "Delayed Government Contract Payments", "summary": "Companies relying on federal contracts face delayed or suspended payments"}},
      {{"node": 6, "label": "Reduced Federal Procurement", "summary": "New federal procurement and awards are paused during a shutdown"}}
    ]}},
    {{"node": 3, "label": "Regulatory Slowdown", "summary": "Regulatory agencies reduce activity, delaying approvals and reviews", "children": [
      {{"node": 7, "label": "Delayed Drug and Product Approvals", "summary": "Agency review backlogs delay product approvals for companies"}},
      {{"node": 8, "label": "Stalled IPO and Filing Reviews", "summary": "Securities filing reviews are delayed, postponing capital raises"}}
    ]}}
  ]
}}"""

USER_MESSAGE_RISK = "Your given Risk is: {main_theme}"

SYSTEM_PROMPT_RISK_LABELING = """Forget all previous prompts.
 You are assisting a professional risk analyst in evaluating the exposure of a company "Target Company" to the risk '{main_theme}'.
 Your primary task is first, to ensure that each sentence is explicitly related to '{main_theme}', and second, to accurately associate each given sentence with
 the relevant risk sub-scenario contained within the list '{labels}'.

 Please adhere strictly to the following guidelines:

 1. **Analyze the Sentence**:
    - Each input consists of a sentence ID, a company name ('Target Company'), and the sentence text.
    - Analyze the sentence to understand if the content clearly establishes that "Target Company" is exposed to '{main_theme}'.
    - Your primary goal is to label as 'unclear' the sentences that don't explicitly relate "Target Company" to '{main_theme}'.
    - The list of labels '{labels}' is a Python list variable containing distinct sub-scenarios and their definition in format 'Label: Summary'. You must pick the label only from the 'Label' part, which means the left side of the colon for each Label:Summary pair.
    - Your secondary goal is to select the most appropriate sub-scenario from '{labels}' that corresponds to the content of the sentence.

 2. **First Label Assignment**:
    - Assign the label 'unclear' to the sentence related to "Target Company" when it does not explicitly relate to '{main_theme}'. Otherwise, don't assign a label.
    - Evaluate each sentence independently, focusing solely on the context provided within that specific sentence.
    - Use only the information contained within the sentence for your label assignment.
    - When evaluating the sentence, "Target Company" must clearly be exposed to or affected by '{main_theme}'.
    - Many sentences are only tangentially connected to the risk '{main_theme}'. These sentences must be assigned the label 'unclear'.

 3. **Second Label Assignment**:
    - For the sentences not labeled as 'unclear' and only for them, assign a unique sub-scenario from the list '{labels}' to the sentence related to "Target Company".
    - Evaluate each sentence independently, focusing solely on the context provided within that specific sentence.
    - Use only the information contained within the sentence for your label assignment.
    - Ensure that the sentence clearly establishes a connection to the sub-scenario you assigned and to the risk '{main_theme}'.
    - You must not create a new label or choose a label that is not present in '{labels}'.
    - If the sentence does not explicitly relate to the sub-scenario, assign the label 'unclear'.
    - When evaluating the sentence, "Target Company" must clearly be exposed to the sub-scenario assigned and '{main_theme}'.

 4. **Response Format**:
    - Your output should be structured as a JSON object that includes:
          1. A brief motivation for your choice.
          2. The assigned label.
    - Each entry must start with the sentence ID and contain a clear motivation that begins with "Target Company".
    - The motivation should explain why the sub-scenario was selected from '{labels}' based on the information in the sentence and in the context of '{main_theme}'.
    - Ensure that the exact context is understood and labels are based only on explicitly mentioned information in the sentence. Otherwise, assign the label 'unclear'.
    - The assigned label should be only the string that precedes the character ':'.
    - Format your JSON as follows: {{"<sentence_id>": {{"motivation": "<motivation>", "label": "<label>"}}, ...}}.
    - Ensure that all strings in the JSON are correctly formatted with proper quotes."""

RISK_SUMMARY_TEMPLATE = """You are assisting a professional risk analyst evaluating how the risk
"{main_theme}" affects companies.

You will receive a company name and a list of analyst motivations. Each motivation explains why a
specific sentence was labeled as exposing the company to this risk.

Write one cohesive company-level risk summary that:
- Synthesizes the company's main exposures and vulnerabilities implied by the motivations
- Highlights the most material risk factors, affected operations, and financial impacts when mentioned
- Avoids repeating the same point; merge overlapping motivations
- Uses clear, professional prose (1 short paragraph)
- Does not invent facts beyond what the motivations support

Return JSON only: {{"summary": "<your summary>"}}"""


# ---------------------------------------------------------------------------
# Taxonomy tree
# ---------------------------------------------------------------------------


class Node(BaseModel):
    """Recursive node of the risk taxonomy returned by the LLM."""

    node: int
    label: str
    summary: str
    search_query: str = ""
    children: list["Node"] = Field(default_factory=list)


Node.model_rebuild()


def normalize_max_leaf_labels(max_leaf_labels: int | None) -> int | None:
    """Return ``None`` when ``max_leaf_labels`` is unset or ``0`` (no cap)."""
    if max_leaf_labels is None or max_leaf_labels == 0:
        return None
    if max_leaf_labels < 0:
        raise ValueError("max_leaf_labels must be zero or positive")
    return max_leaf_labels


def analyst_focus_with_leaf_cap(analyst_focus: str, max_leaf_labels: int | None) -> str:
    """Append a leaf-count instruction for taxonomy generation when capped."""
    cap = normalize_max_leaf_labels(max_leaf_labels)
    if cap is None:
        return analyst_focus
    return f"{analyst_focus}\nLimit the final tree to at most {cap} leaf nodes."


def analyst_focus_with_keywords(analyst_focus: str, keywords: list[str] | None) -> str:
    """Append optional analyst keywords to the focus text used for taxonomy generation."""
    if not keywords:
        return analyst_focus
    return f"{analyst_focus}\nEmphasize these key terms: {', '.join(keywords)}."


def analyst_focus_with_depth_cap(analyst_focus: str, max_depth: int | None) -> str:
    """Append a tree-depth instruction for taxonomy generation when capped.

    ``max_depth`` counts levels including the root risk node (e.g. 3 = root +
    one grouping level + leaf sub-scenarios, with no separate "risk factor"
    layer between them). This is a soft hint only — :func:`truncate_depth` is
    the hard guarantee applied after generation, since models don't reliably
    follow depth instructions that conflict with the prompt's own "risk
    channel / risk factor / sub-scenario" structure.
    """
    if max_depth is None:
        return analyst_focus
    return (
        f"{analyst_focus}\nIMPORTANT structural override: build the tree with at most "
        f"{max_depth} levels total, counting the root risk node as level 1. Leaf "
        f"sub-scenario nodes must not be deeper than level {max_depth}. If that means "
        "dropping the separate risk-factor layer, make leaf sub-scenarios direct "
        "children of the top-level risk-channel nodes instead."
    )


def truncate_depth(node: Node, max_depth: int | None, _current_depth: int = 1) -> Node:
    """Return a copy of ``node`` with any branch deeper than ``max_depth`` cut off.

    A node at ``_current_depth == max_depth`` is turned into a leaf (its
    children are dropped), regardless of what the LLM actually returned. The
    root node is depth 1. No-op when ``max_depth`` is ``None``.
    """
    if max_depth is None or not node.children:
        return node
    if _current_depth >= max_depth:
        return node.model_copy(update={"children": []})
    return node.model_copy(
        update={
            "children": [
                truncate_depth(child, max_depth, _current_depth + 1)
                for child in node.children
            ]
        }
    )


def generate_taxonomy(
    main_theme: str,
    analyst_focus: str,
    model: str,
    client: OpenAI | None = None,
    max_leaf_labels: int | None = DEFAULT_MAX_LEAF_LABELS,
    max_depth: int | None = None,
) -> Node:
    """Generate the risk taxonomy tree for ``main_theme`` via the LLM.

    ``max_depth`` (when set) is enforced deterministically via
    :func:`truncate_depth` after generation, on top of a soft prompt hint —
    see :func:`analyst_focus_with_depth_cap`.
    """
    openai_client = client if client is not None else build_openai_client()
    focus_for_prompt = analyst_focus_with_leaf_cap(analyst_focus, max_leaf_labels)
    focus_for_prompt = analyst_focus_with_depth_cap(focus_for_prompt, max_depth)
    completion = openai_client.chat.completions.create(
        model=model,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": SYSTEM_MESSAGE_RISK.format(
                    main_theme=main_theme, analyst_focus=focus_for_prompt
                ),
            },
            {
                "role": "user",
                "content": USER_MESSAGE_RISK.format(main_theme=main_theme),
            },
        ],
    )

    content = completion.choices[0].message.content
    root = Node.model_validate_json(content)
    return truncate_depth(root, max_depth)


# ---------------------------------------------------------------------------
# Leaf-node helpers (ported from src/helpers.py)
# ---------------------------------------------------------------------------

_EXPOSURE_META_PATTERN = re.compile(
    r"\b(exposed to|exposure|ipo-?driven|capex scaling|beneficiar(?:y|ies)|spillover|"
    r"earning returns|profiting from|gain from|benefiting from)\b",
    re.IGNORECASE,
)
_NOMINAL_PREFIX_PATTERN = re.compile(
    r"^(companies|suppliers|vendors|operators|contractors|lenders|prime contractors)\b",
    re.IGNORECASE,
)


def normalize_summary_to_search_query(text: str) -> str:
    """Best-effort rewrite of taxonomy phrasing into document-voice retrieval text."""
    cleaned = text.strip()
    if not cleaned:
        return cleaned

    rewritten = _NOMINAL_PREFIX_PATTERN.sub("The company", cleaned)
    rewritten = _EXPOSURE_META_PATTERN.sub("", rewritten)
    rewritten = re.sub(r"\s{2,}", " ", rewritten).strip(" ,.;")
    if rewritten and not rewritten.endswith("."):
        rewritten = f"{rewritten}."
    return rewritten


def get_leaf_labels(node: Node) -> list[str]:
    """Return leaf ``label`` values in tree order."""
    if not node.children:
        return [node.label]
    labels: list[str] = []
    for child in node.children:
        labels.extend(get_leaf_labels(child))
    return labels


def get_leaf_search_queries(node: Node) -> list[str]:
    """Return leaf search-query text, deriving it from ``summary`` when absent."""
    if not node.children:
        query = (node.search_query or "").strip()
        if query:
            return [query]
        summary = (node.summary or "").strip()
        if summary:
            return [normalize_summary_to_search_query(summary)]
        return [node.label.strip()]

    queries: list[str] = []
    for child in node.children:
        queries.extend(get_leaf_search_queries(child))
    return queries


def get_leaf_label_summary_options(node: Node) -> list[str]:
    """Return ``Label: Summary`` strings for the risk-labeling prompt."""
    if not node.children:
        label = node.label.strip()
        summary = (node.summary or "").strip()
        return [f"{label}: {summary}"] if summary else [label]
    options: list[str] = []
    for child in node.children:
        options.extend(get_leaf_label_summary_options(child))
    return options


def build_leaf_ancestry(
    node: Node, ancestors: list[str] | None = None
) -> dict[str, list[str]]:
    """Map each leaf ``label`` to its ancestor labels (root first)."""
    chain = ancestors or []
    if not node.children:
        return {node.label: list(chain)}

    mapping: dict[str, list[str]] = {}
    child_ancestors = [*chain, node.label]
    for child in node.children:
        mapping.update(build_leaf_ancestry(child, child_ancestors))
    return mapping
