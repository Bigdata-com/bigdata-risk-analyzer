"""REST client for the Bigdata.com Knowledge Graph, used to resolve a bare
list of RP entity IDs into company metadata (name, sector, industry, country,
ticker) when the caller does not upload a universe CSV.

Replaces ``bigdata_client.Bigdata().knowledge_graph.get_entities(ids)``.
"""

from __future__ import annotations

import os
from typing import Any

import requests

DEFAULT_API_BASE_URL = os.getenv("BIGDATA_API_BASE_URL", "https://api.bigdata.com")
ENTITIES_BY_ID_ENDPOINT = "/v1/knowledge-graph/entities/id"
MAX_IDS_PER_REQUEST = 100
COMPANY_CATEGORY = "companies"

# ``listing_values`` (e.g. "XNAS:AAPL") is not ordered by listing importance — a
# depositary-receipt or secondary listing on another exchange (e.g. "XBKK:AAPL80")
# can sort before the primary listing. Prefer major US exchanges, in order, before
# falling back to whatever is first in the list.
_PREFERRED_LISTING_EXCHANGES: tuple[str, ...] = ("XNAS", "XNYS", "XASE")


def _parse_ticker(entity: dict[str, Any]) -> str | None:
    """Extract a ticker (e.g. ``AAPL``) from ``listing_values`` entries like ``XNAS:AAPL``.

    Prefers a listing on a major US exchange (Nasdaq/NYSE/NYSE American) over
    other exchanges' listings for the same security, since those are usually
    depositary receipts or secondary listings with a different ticker suffix.
    """
    listings = [
        (exchange.strip(), ticker.strip())
        for entry in entity.get("listing_values") or []
        if isinstance(entry, str) and ":" in entry
        for exchange, ticker in [entry.split(":", 1)]
        if ticker.strip()
    ]

    for preferred_exchange in _PREFERRED_LISTING_EXCHANGES:
        for exchange, ticker in listings:
            if exchange == preferred_exchange:
                return ticker

    return listings[0][1] if listings else None


def resolve_companies(
    ids: list[str],
    api_key: str,
    api_base_url: str | None = None,
    timeout: float = 30.0,
) -> dict[str, dict[str, Any]]:
    """Resolve RP entity IDs to company metadata via the knowledge-graph REST API.

    Returns a dict keyed by RP entity ID (only entities whose ``category`` is
    ``"companies"`` are included) with keys: ``name``, ``ticker``, ``sector``,
    ``industry``, ``country``.

    Raises:
        ValueError: if none of the given IDs resolve to a company entity.
    """
    base_url = api_base_url or DEFAULT_API_BASE_URL
    url = f"{base_url}{ENTITIES_BY_ID_ENDPOINT}"
    headers = {"X-API-KEY": api_key, "Content-Type": "application/json"}

    resolved: dict[str, dict[str, Any]] = {}
    unique_ids = list(dict.fromkeys(ids))
    for start in range(0, len(unique_ids), MAX_IDS_PER_REQUEST):
        batch = unique_ids[start : start + MAX_IDS_PER_REQUEST]
        response = requests.post(
            url, json={"values": batch}, headers=headers, timeout=timeout
        )
        response.raise_for_status()
        results = response.json().get("results", {})
        for entity_id, entity in results.items():
            if entity.get("category") != COMPANY_CATEGORY:
                continue
            resolved[entity_id] = {
                "name": entity.get("name"),
                "ticker": _parse_ticker(entity),
                "sector": entity.get("sector"),
                "industry": entity.get("industry"),
                "country": entity.get("country"),
            }

    if not resolved:
        raise ValueError(
            "No entities found in the provided universe. "
            "Check that the RP entity IDs are valid company IDs."
        )

    return resolved
