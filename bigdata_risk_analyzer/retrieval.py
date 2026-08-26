"""Document/chunk retrieval via bigdata-smart-batching.

Ported from ``Thematic_Screener_CLI/src/screener.py`` (``build_plans`` +
``run_search`` collapsed into in-memory calls, plus ``extract_sentences``).
Replaces ``bigdata_client``-based ``search.new()``/``run_search()``.
"""

from __future__ import annotations

import logging
from typing import Any

import pandas as pd
from bigdata_smart_batching import deduplicate_documents, execute_search, plan_search

from bigdata_risk_analyzer.universe import ID_COLUMN, NAME_COLUMN

logger = logging.getLogger(__name__)

DEFAULT_SEARCH_CATEGORY: dict[str, Any] = {
    "mode": "INCLUDE",
    "values": ["news_premium", "transcripts", "filings"],
}
DEFAULT_REQUESTS_PER_MINUTE = 350


def search_universe(
    company_ids: list[str],
    leaf_search_queries: list[str],
    start_date: str,
    end_date: str,
    chunk_percentage: float,
    category: dict[str, Any] | None = None,
    requests_per_minute: int = DEFAULT_REQUESTS_PER_MINUTE,
) -> list[dict[str, Any]]:
    """Plan and execute one smart-batching search per taxonomy leaf, deduplicated."""
    search_category = category if category is not None else DEFAULT_SEARCH_CATEGORY

    all_documents: list[dict[str, Any]] = []
    for search_query in leaf_search_queries:
        plan = plan_search(
            universe=company_ids,
            start_date=start_date,
            end_date=end_date,
            volume_query_mode="iterative",
            text=search_query,
            category=search_category,
        )
        documents = execute_search(
            search_plan=plan,
            chunk_percentage=chunk_percentage,
            requests_per_minute=requests_per_minute,
            basket_filtered_entities=True,
        )
        all_documents.extend(documents)

    return deduplicate_documents(all_documents)


def _company_names_in_universe(
    entity_ids: list[Any], id_to_name: dict[str, str]
) -> list[str]:
    """Return universe company names for ``entity_ids``, preserving first-seen order.

    Smart-batching stores ``entity_ids`` as ``list(set(...))``, so the first
    element is not a stable primary company. Attribute the chunk to every
    universe company mentioned, not only ``entity_ids[0]``.
    """
    names: list[str] = []
    seen: set[str] = set()
    for entity_id in entity_ids:
        company_name = id_to_name.get(entity_id)
        if company_name is None or company_name in seen:
            continue
        seen.add(company_name)
        names.append(company_name)
    return names


def extract_sentences(
    documents: list[dict[str, Any]],
    universe_df: pd.DataFrame,
    rerank_threshold: float | None = None,
) -> list[dict[str, Any]]:
    """Flatten retrieved documents into per-chunk sentence records.

    Each matching universe company on a chunk gets its own sentence (looked up
    from the universe DataFrame). Chunks whose ``relevance`` is below
    ``rerank_threshold`` are dropped.
    """
    id_to_name = dict(zip(universe_df[ID_COLUMN], universe_df[NAME_COLUMN]))

    sentences: list[dict[str, Any]] = []
    idx = 0
    for document in documents:
        document_id = document.get("id")
        headline = document.get("headline")
        timestamp = document.get("timestamp")
        for chunk in document.get("chunks", []):
            relevance = chunk.get("relevance")
            if (
                rerank_threshold is not None
                and relevance is not None
                and relevance < rerank_threshold
            ):
                continue

            company_names = _company_names_in_universe(
                chunk.get("entity_ids") or [], id_to_name
            )
            if not company_names:
                continue

            for company_name in company_names:
                sentences.append(
                    {
                        "sentence_id": idx,
                        "text": chunk.get("text"),
                        "document_id": document_id,
                        "headline": headline,
                        "timestamp": timestamp,
                        "relevance": relevance,
                        "company_name": company_name,
                    }
                )
                idx += 1

    logger.info(
        "Extracted %d sentences from %d documents", len(sentences), len(documents)
    )
    return sentences
