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


def extract_sentences(
    documents: list[dict[str, Any]],
    universe_df: pd.DataFrame,
    rerank_threshold: float | None = None,
) -> list[dict[str, Any]]:
    """Flatten retrieved documents into per-chunk sentence records.

    Each chunk becomes a sentence with a resolved ``company_name`` (looked up
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
                rerank_threshold
                and relevance is not None
                and relevance < rerank_threshold
            ):
                continue

            entity_ids = chunk.get("entity_ids") or []
            if not entity_ids:
                continue
            first_entity = entity_ids[0]
            company_name = id_to_name.get(first_entity)
            if not company_name:
                continue

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
