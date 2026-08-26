import pandas as pd

from bigdata_risk_analyzer.retrieval import extract_sentences


def _universe() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {"RP_ENTITY_ID": "D8442A", "COMPANY_NAME": "Apple"},
            {"RP_ENTITY_ID": "228D42", "COMPANY_NAME": "Microsoft"},
        ]
    )


def test_extract_sentences_emits_one_row_per_universe_company_on_chunk():
    documents = [
        {
            "id": "doc-1",
            "headline": "Apple and Microsoft on tariffs",
            "timestamp": "2025-01-01T00:00:00+00:00",
            "chunks": [
                {
                    "text": "Both companies face tariff risk.",
                    "relevance": 0.9,
                    # Unstable set-like order: first id is not in the universe.
                    "entity_ids": ["DEAD00", "228D42", "D8442A"],
                }
            ],
        }
    ]

    sentences = extract_sentences(documents, _universe())

    assert [row["company_name"] for row in sentences] == ["Microsoft", "Apple"]
    assert [row["sentence_id"] for row in sentences] == [0, 1]
    assert all(row["text"] == "Both companies face tariff risk." for row in sentences)


def test_extract_sentences_skips_chunks_with_no_universe_entity():
    documents = [
        {
            "id": "doc-1",
            "headline": "Unrelated",
            "timestamp": "2025-01-01T00:00:00+00:00",
            "chunks": [
                {"text": "Other firm", "relevance": 0.9, "entity_ids": ["ZZZZZZ"]}
            ],
        }
    ]

    assert extract_sentences(documents, _universe()) == []


def test_extract_sentences_drops_chunks_below_rerank_threshold():
    documents = [
        {
            "id": "doc-1",
            "headline": "Apple",
            "timestamp": "2025-01-01T00:00:00+00:00",
            "chunks": [
                {"text": "keep", "relevance": 0.9, "entity_ids": ["D8442A"]},
                {"text": "drop", "relevance": 0.2, "entity_ids": ["D8442A"]},
            ],
        }
    ]

    sentences = extract_sentences(documents, _universe(), rerank_threshold=0.5)
    assert [row["text"] for row in sentences] == ["keep"]
