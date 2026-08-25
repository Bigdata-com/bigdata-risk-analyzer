"""Sentence labeling, company scoring, and report assembly.

Ported from ``Thematic_Screener_CLI/src/screener.py`` (risk-analyzer mode:
``label_sentences``, ``build_labeled_dataframe``, ``summarize_companies``,
``build_screener_dataframe``, and the ``build_risk_*``/``build_content_chunks``
report builders), plus the top-level orchestrator that used to be
``bigdata_research_tools.workflows.risk_analyzer.RiskAnalyzer.screen_companies``.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, Callable

import pandas as pd
from openai import OpenAI
from pydantic import BaseModel

from bigdata_risk_analyzer import retrieval, taxonomy
from bigdata_risk_analyzer.openai_utils import ChatRequest, run_chat_requests_parallel
from bigdata_risk_analyzer.taxonomy import Node
from bigdata_risk_analyzer.universe import (
    COUNTRY_COLUMN,
    ID_COLUMN,
    INDUSTRY_COLUMN,
    NAME_COLUMN,
    SECTOR_COLUMN,
    TICKER_COLUMN,
    UNKNOWN_VALUE,
)

logger = logging.getLogger(__name__)

UNCLEAR_LABEL = "unclear"
MAX_MOTIVATIONS_CHARS = 120_000


class CompanySummary(BaseModel):
    summary: str


# ---------------------------------------------------------------------------
# Sentence labeling
# ---------------------------------------------------------------------------


def label_sentences(
    sentences: list[dict[str, Any]],
    main_theme: str,
    root: Node,
    model: str,
    client: OpenAI | None = None,
) -> dict[str, dict[str, str]]:
    """Label each sentence with a taxonomy leaf (or ``unclear``) via the LLM."""
    if not sentences:
        return {}

    options = taxonomy.get_leaf_label_summary_options(root)
    system_prompt = taxonomy.SYSTEM_PROMPT_RISK_LABELING.format(
        main_theme=main_theme, labels=str(options)
    )

    requests = [
        ChatRequest(
            request_id=str(sentence["sentence_id"]),
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": str(
                        {
                            "sentence_id": sentence["sentence_id"],
                            "text": sentence["text"],
                            "company_name": sentence["company_name"],
                        }
                    ),
                },
            ],
            model=model,
        )
        for sentence in sentences
    ]

    responses = run_chat_requests_parallel(requests, client=client)

    parsed: dict[str, dict[str, str]] = {}
    for response in responses:
        if not response.succeeded or not response.content:
            logger.warning("Labeling request %s failed: %s", response.request_id, response.error)
            continue
        try:
            payload = json.loads(response.content)
        except json.JSONDecodeError:
            logger.warning("Could not parse labeling response for %s", response.request_id)
            continue

        if {"motivation", "label"}.issubset(payload):
            parsed[response.request_id] = payload
            continue
        # The model sometimes wraps the fields under the sentence_id key.
        for sentence_id, fields in payload.items():
            if isinstance(fields, dict) and {"motivation", "label"}.issubset(fields):
                parsed[str(sentence_id)] = fields

    return parsed


def build_labeled_dataframe(
    sentences: list[dict[str, Any]],
    parsed_responses: dict[str, dict[str, str]],
) -> pd.DataFrame:
    """Merge sentences with their labels and drop unclear/unlabeled rows."""
    if not sentences:
        return pd.DataFrame(
            columns=["sentence_id", "text", "company_name", "motivation", "label"]
        )

    sentences_df = pd.DataFrame(sentences)
    sentences_df["sentence_id"] = sentences_df["sentence_id"].astype(str)

    responses_df = pd.DataFrame.from_dict(parsed_responses, orient="index").reset_index(
        names="sentence_id"
    )

    merged_df = sentences_df.merge(responses_df, on="sentence_id", how="left")
    if "label" not in merged_df.columns:
        merged_df["label"] = pd.NA
    if "motivation" not in merged_df.columns:
        merged_df["motivation"] = pd.NA

    merged_df = merged_df[
        (~merged_df["company_name"].isna()) & (merged_df["label"] != UNCLEAR_LABEL)
    ]
    return merged_df.dropna(subset=["label"]).reset_index(drop=True)


# ---------------------------------------------------------------------------
# Company-level motivation summaries
# ---------------------------------------------------------------------------


def _company_evidence_block(rows: pd.DataFrame) -> str:
    lines = []
    for row in rows.fillna("").itertuples(index=False):
        motivation = getattr(row, "motivation", "")
        label = getattr(row, "label", "")
        if not str(motivation).strip():
            continue
        lines.append(f"- sub_scenario={label}; motivation={motivation}")
    block = "\n".join(lines)
    if len(block) > MAX_MOTIVATIONS_CHARS:
        block = block[:MAX_MOTIVATIONS_CHARS] + "\n\n[Truncated: additional motivations omitted.]"
    return block


def summarize_companies(
    merged_df: pd.DataFrame,
    main_theme: str,
    model: str,
    client: OpenAI | None = None,
) -> pd.DataFrame:
    """Produce one cohesive risk-motivation summary per company."""
    if merged_df.empty or "motivation" not in merged_df.columns:
        return pd.DataFrame(columns=["company_name", "summary"])

    company_rows = [
        {"company_name": company_name, "motivations_text": _company_evidence_block(group)}
        for company_name, group in merged_df.groupby("company_name", sort=True)
    ]
    company_motivations = pd.DataFrame(company_rows)
    company_motivations = company_motivations[company_motivations["motivations_text"].str.len() > 0]
    if company_motivations.empty:
        return pd.DataFrame(columns=["company_name", "summary"])

    system_prompt = taxonomy.RISK_SUMMARY_TEMPLATE.format(main_theme=main_theme)
    requests = [
        ChatRequest(
            request_id=row.company_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": (
                        f"Company: {row.company_name}\n\n"
                        f"Motivations ({main_theme}):\n{row.motivations_text}"
                    ),
                },
            ],
            model=model,
        )
        for row in company_motivations.itertuples(index=False)
    ]

    responses = run_chat_requests_parallel(requests, client=client)

    summaries: list[dict[str, str]] = []
    for response in responses:
        if not response.succeeded or not response.content:
            logger.warning("Summary request %s failed: %s", response.request_id, response.error)
            continue
        try:
            summary = CompanySummary.model_validate(json.loads(response.content)).summary
        except (json.JSONDecodeError, ValueError) as exc:
            logger.warning("Summary parse error for %s: %s", response.request_id, exc)
            continue
        summaries.append({"company_name": response.request_id, "summary": summary})

    if not summaries:
        return pd.DataFrame(columns=["company_name", "summary"])
    return pd.DataFrame(summaries).sort_values("company_name").reset_index(drop=True)


def build_screener_dataframe(
    merged_df: pd.DataFrame, company_summaries_df: pd.DataFrame
) -> pd.DataFrame:
    """Left-join company summaries onto the labeled sentences."""
    if company_summaries_df.empty:
        result = merged_df.copy()
        result["summary"] = pd.NA
        return result
    return merged_df.merge(company_summaries_df, on="company_name", how="left")


# ---------------------------------------------------------------------------
# Report assembly (risk_scoring / risk_taxonomy / content)
# ---------------------------------------------------------------------------


def _clean_scalar(value: Any) -> Any:
    try:
        if value is None or (pd.api.types.is_scalar(value) and pd.isna(value)):
            return None
    except (TypeError, ValueError):
        return value
    return value


def _split_timestamp(timestamp: Any) -> tuple[str, str]:
    """Split an ISO timestamp into ``(date, time_period)`` strings, e.g. ``Jun 2026``."""
    if not isinstance(timestamp, str) or not timestamp:
        return "", ""
    date_part = timestamp[:10]
    try:
        parsed = datetime.fromisoformat(timestamp)
    except ValueError:
        return date_part, ""
    return date_part, parsed.strftime("%b %Y")


def _company_metadata_lookup(universe_df: pd.DataFrame) -> dict[str, dict[str, Any]]:
    columns = set(universe_df.columns)
    lookup: dict[str, dict[str, Any]] = {}
    for _, row in universe_df.iterrows():
        name = row[NAME_COLUMN]
        lookup[name] = {
            "ticker": _clean_scalar(row[TICKER_COLUMN]) if TICKER_COLUMN in columns else None,
            "sector": (_clean_scalar(row[SECTOR_COLUMN]) or UNKNOWN_VALUE)
            if SECTOR_COLUMN in columns
            else UNKNOWN_VALUE,
            "industry": (_clean_scalar(row[INDUSTRY_COLUMN]) or UNKNOWN_VALUE)
            if INDUSTRY_COLUMN in columns
            else UNKNOWN_VALUE,
            "country": _clean_scalar(row[COUNTRY_COLUMN]) if COUNTRY_COLUMN in columns else None,
        }
    return lookup


def build_risk_taxonomy(root: Node) -> dict[str, Any]:
    return root.model_dump()


def _risk_factor_channel(label: str, ancestry: dict[str, list[str]]) -> tuple[str, str]:
    """Derive ``(risk_factor, risk_channel)`` for a leaf sub-scenario.

    ``risk_factor`` is the leaf's immediate parent and ``risk_channel`` its
    grandparent. When the taxonomy has fewer levels (e.g. ``max_taxonomy_depth``
    capped the tree at root + one grouping level + leaf), there is no
    grandparent distinct from the root theme itself — falling back to
    ``chain[-2]`` in that case would make ``risk_channel`` a constant equal to
    the theme name for every row, so instead ``risk_channel`` falls back to
    ``risk_factor``.
    """
    chain = ancestry.get(label, [])
    risk_factor = chain[-1] if chain else label
    risk_channel = chain[-2] if len(chain) >= 3 else risk_factor
    return risk_factor, risk_channel


def build_content_chunks(
    screener_df: pd.DataFrame, root: Node, universe_df: pd.DataFrame
) -> list[dict[str, Any]]:
    ancestry = taxonomy.build_leaf_ancestry(root)
    metadata = _company_metadata_lookup(universe_df)

    chunks: list[dict[str, Any]] = []
    for _, row in screener_df.iterrows():
        label = _clean_scalar(row.get("label")) or ""
        company = _clean_scalar(row.get("company_name")) or ""
        date, time_period = _split_timestamp(row.get("timestamp"))
        risk_factor, risk_channel = _risk_factor_channel(label, ancestry)
        company_meta = metadata.get(company, {})

        chunks.append(
            {
                "time_period": time_period,
                "date": date,
                "company": company,
                "sector": company_meta.get("sector", UNKNOWN_VALUE),
                "industry": company_meta.get("industry", UNKNOWN_VALUE),
                "country": company_meta.get("country"),
                "ticker": company_meta.get("ticker"),
                "document_id": _clean_scalar(row.get("document_id")) or "",
                "headline": _clean_scalar(row.get("headline")) or "",
                "quote": _clean_scalar(row.get("text")) or "",
                "motivation": _clean_scalar(row.get("motivation")) or "",
                "sub_scenario": label,
                "risk_channel": risk_channel,
                "risk_factor": risk_factor,
                "highlights": [],
            }
        )
    return chunks


def build_risk_scoring(screener_df: pd.DataFrame, universe_df: pd.DataFrame) -> dict[str, Any]:
    metadata = _company_metadata_lookup(universe_df)
    scoring: dict[str, Any] = {}

    if screener_df.empty or "label" not in screener_df.columns:
        return scoring

    summaries: dict[str, Any] = {}
    if "summary" in screener_df.columns:
        for company, group in screener_df.groupby("company_name", sort=True):
            summaries[company] = _clean_scalar(group["summary"].iloc[0])

    for company, group in screener_df.groupby("company_name", sort=True):
        counts = group["label"].value_counts()
        risks = {str(label): int(count) for label, count in counts.items()}
        company_meta = metadata.get(company, {})
        scoring[str(company)] = {
            "ticker": company_meta.get("ticker"),
            "sector": company_meta.get("sector", UNKNOWN_VALUE),
            "industry": company_meta.get("industry", UNKNOWN_VALUE),
            "composite_score": int(sum(risks.values())),
            "motivation": summaries.get(company),
            "risks": risks,
        }
    return scoring


def build_risk_analysis_json(
    screener_df: pd.DataFrame, root: Node, universe_df: pd.DataFrame
) -> dict[str, Any]:
    return {
        "risk_scoring": build_risk_scoring(screener_df, universe_df),
        "risk_taxonomy": build_risk_taxonomy(root),
        "content": build_content_chunks(screener_df, root, universe_df),
    }


# ---------------------------------------------------------------------------
# Top-level orchestrator (replaces RiskAnalyzer.screen_companies)
# ---------------------------------------------------------------------------


def run_risk_analysis(
    main_theme: str,
    focus: str,
    keywords: list[str] | None,
    start_date: str,
    end_date: str,
    model: str,
    rerank_threshold: float | None,
    chunk_percentage: float,
    max_leaf_labels: int | None,
    universe_df: pd.DataFrame,
    on_progress: Callable[[str], None],
    max_taxonomy_depth: int | None = None,
) -> dict[str, Any]:
    """Run the full risk-analysis pipeline and return the report dict."""
    on_progress("Generating risk taxonomy")
    focus_for_taxonomy = taxonomy.analyst_focus_with_keywords(focus, keywords)
    root = taxonomy.generate_taxonomy(
        main_theme=main_theme,
        analyst_focus=focus_for_taxonomy,
        model=model,
        max_leaf_labels=max_leaf_labels,
        max_depth=max_taxonomy_depth,
    )
    leaf_search_queries = taxonomy.get_leaf_search_queries(root)
    on_progress(f"Risk taxonomy generated with {len(leaf_search_queries)} leaves")

    company_ids = universe_df[ID_COLUMN].tolist()
    on_progress("Searching companies for risk exposure")
    documents = retrieval.search_universe(
        company_ids=company_ids,
        leaf_search_queries=leaf_search_queries,
        start_date=start_date,
        end_date=end_date,
        chunk_percentage=chunk_percentage,
    )
    sentences = retrieval.extract_sentences(documents, universe_df, rerank_threshold)
    on_progress(
        f"Search completed. {len(sentences)} chunks found for {len(company_ids)} companies."
    )

    on_progress(f"Labelling {len(sentences)} chunks with {len(leaf_search_queries)} risks")
    parsed_responses = label_sentences(sentences, main_theme, root, model=model)
    merged_df = build_labeled_dataframe(sentences, parsed_responses)
    on_progress(f"Labeling completed. {len(merged_df)} chunks labeled with risk factors.")

    on_progress("Post-processing results")
    company_summaries_df = summarize_companies(merged_df, main_theme, model=model)
    screener_df = build_screener_dataframe(merged_df, company_summaries_df)
    report = build_risk_analysis_json(screener_df, root, universe_df)
    on_progress("Results post-processed")

    return report
