"""Company-universe loading: CSV upload or a bare list of RP entity IDs.

Ported from ``Thematic_Screener_CLI/src/screener.py::load_universe`` and
``_company_metadata_lookup``. Watchlists are intentionally unsupported — see
:func:`reject_if_watchlist`.
"""

from __future__ import annotations

from pathlib import Path
from typing import IO, Iterable

import pandas as pd

from bigdata_risk_analyzer import bigdata_kg

ID_COLUMN = "RP_ENTITY_ID"
ID_ALIASES: tuple[str, ...] = ("RP_ENTITY_ID", "RP_COMPANY_ID")
NAME_COLUMN = "COMPANY_NAME"
NAME_ALIASES: tuple[str, ...] = ("COMPANY_NAME", "NAME", "COMPANY")
TICKER_COLUMN = "TICKER"
SECTOR_COLUMN = "SECTOR"
INDUSTRY_COLUMN = "INDUSTRY"
COUNTRY_COLUMN = "COUNTRY"

UNKNOWN_VALUE = "Unknown"

WATCHLIST_REJECTED_MESSAGE = (
    "Watchlist is not supported at this time. Provide a list of RP entity IDs "
    '(`companies: ["D8442A", ...]`) or upload a CSV via /risk-analysis/upload.'
)


def reject_if_watchlist(companies: object) -> None:
    """Raise a clear error if ``companies`` looks like a legacy watchlist ID."""
    if isinstance(companies, str):
        raise ValueError(WATCHLIST_REJECTED_MESSAGE)


def _find_column(columns: Iterable[str], candidates: tuple[str, ...]) -> str | None:
    normalized = {str(column).upper(): str(column) for column in columns}
    for candidate in candidates:
        if candidate.upper() in normalized:
            return normalized[candidate.upper()]
    return None


def _clean_optional_cell(value: object) -> str | None:
    """Return a stripped string, or ``None`` for missing/blank cells (incl. NaN)."""
    if pd.isna(value):
        return None
    text = str(value).strip()
    return text or None


_METADATA_COLUMNS: tuple[str, ...] = (
    TICKER_COLUMN,
    SECTOR_COLUMN,
    INDUSTRY_COLUMN,
    COUNTRY_COLUMN,
)
_METADATA_KG_KEYS: dict[str, str] = {
    TICKER_COLUMN: "ticker",
    SECTOR_COLUMN: "sector",
    INDUSTRY_COLUMN: "industry",
    COUNTRY_COLUMN: "country",
}


def _enrich_missing_metadata(
    universe_df: pd.DataFrame,
    api_key: str | None,
    api_base_url: str | None,
) -> pd.DataFrame:
    """Fill in missing ticker/sector/industry/country via the knowledge-graph API.

    Only cells that are missing (column absent, or blank/NaN for that row) are
    filled in — values already present in the CSV are left untouched. No-op
    when ``api_key`` is ``None`` or nothing is missing.
    """
    for column in _METADATA_COLUMNS:
        if column not in universe_df.columns:
            universe_df[column] = None

    missing_mask = pd.Series(False, index=universe_df.index)
    for column in _METADATA_COLUMNS:
        missing_mask = missing_mask | universe_df[column].isna()

    if not missing_mask.any() or not api_key:
        return universe_df

    ids = universe_df.loc[missing_mask, ID_COLUMN].tolist()
    try:
        resolved = bigdata_kg.resolve_companies(
            ids, api_key=api_key, api_base_url=api_base_url
        )
    except ValueError:
        # None of the missing IDs resolved via the knowledge graph — keep the CSV as-is.
        return universe_df

    for column, kg_key in _METADATA_KG_KEYS.items():
        cell_missing = universe_df[column].isna()
        looked_up = universe_df.loc[cell_missing, ID_COLUMN].map(
            lambda entity_id: (resolved.get(entity_id) or {}).get(kg_key)
        )
        universe_df.loc[cell_missing, column] = looked_up

    return universe_df


def load_universe_csv(
    file: str | Path | IO[str] | IO[bytes],
    api_key: str | None = None,
    api_base_url: str | None = None,
) -> pd.DataFrame:
    """Load a company universe CSV.

    Requires ``RP_ENTITY_ID`` (alias ``RP_COMPANY_ID``) and ``COMPANY_NAME``
    (alias ``NAME``/``COMPANY``) columns. Optional ``TICKER``/``SECTOR``/
    ``INDUSTRY``/``COUNTRY`` columns enrich the response. Any of those that
    are missing entirely, or blank for a given row, are backfilled via the
    Bigdata.com knowledge-graph API (by RP entity ID) when ``api_key`` is
    provided; anything still missing after that defaults to ``"Unknown"``
    (sector/industry) or ``None`` (ticker/country).
    """
    raw_df = pd.read_csv(file)

    id_column = _find_column(raw_df.columns, ID_ALIASES)
    if id_column is None:
        raise ValueError(
            f"universe CSV is missing a required ID column "
            f"(expected one of: {', '.join(ID_ALIASES)})"
        )
    name_column = _find_column(raw_df.columns, NAME_ALIASES)
    if name_column is None:
        raise ValueError(
            f"universe CSV is missing a required name column "
            f"(expected one of: {', '.join(NAME_ALIASES)})"
        )

    universe_df = pd.DataFrame(
        {
            ID_COLUMN: raw_df[id_column].astype(str).str.strip(),
            NAME_COLUMN: raw_df[name_column].astype(str).str.strip(),
        }
    )

    for column in _METADATA_COLUMNS:
        found = _find_column(raw_df.columns, (column,))
        if found is not None:
            universe_df[column] = raw_df[found].apply(_clean_optional_cell)

    if universe_df.empty:
        raise ValueError("universe CSV contains no rows")

    universe_df = universe_df.drop_duplicates(subset=[ID_COLUMN]).reset_index(drop=True)
    return _enrich_missing_metadata(universe_df, api_key, api_base_url)


def build_universe_from_ids(
    ids: list[str],
    api_key: str,
    api_base_url: str | None = None,
) -> pd.DataFrame:
    """Build a universe DataFrame from a plain list of RP entity IDs.

    Metadata (name, sector, industry, country, ticker) is filled in via the
    Bigdata.com knowledge-graph REST API. IDs that don't resolve to a company
    entity are dropped.
    """
    if not ids:
        raise ValueError("companies list must not be empty")

    resolved = bigdata_kg.resolve_companies(
        ids, api_key=api_key, api_base_url=api_base_url
    )

    rows = []
    for entity_id, meta in resolved.items():
        rows.append(
            {
                ID_COLUMN: entity_id,
                NAME_COLUMN: meta.get("name") or entity_id,
                TICKER_COLUMN: meta.get("ticker"),
                SECTOR_COLUMN: meta.get("sector") or UNKNOWN_VALUE,
                INDUSTRY_COLUMN: meta.get("industry") or UNKNOWN_VALUE,
                COUNTRY_COLUMN: meta.get("country"),
            }
        )

    return pd.DataFrame(rows).reset_index(drop=True)
