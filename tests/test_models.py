import pytest
from pydantic import ValidationError

from bigdata_risk_analyzer.api.models import RiskAnalysisRequest


@pytest.mark.parametrize(
    "main_theme,focus,companies,start_date,end_date,expected_error",
    [
        # Missing companies
        (
            "US Import Tariffs against China",
            "Taxonomy of risks for US companies",
            None,
            "2025-06-01",
            "2025-08-01",
            "Input should be a valid",
        ),
        # start_date after end_date
        (
            "US Import Tariffs against China",
            "Taxonomy of risks for US companies",
            ["4A6F00"],
            "2025-08-01",
            "2025-06-01",
            "start_date must be earlier than end_date",
        ),
        # Bare-string companies (legacy watchlist ID) is rejected
        (
            "US Import Tariffs against China",
            "Taxonomy of risks for US companies",
            "44118802-9104-4265-b97a-2e6d88d74893",
            "2025-06-01",
            "2025-08-01",
            "Watchlist is not supported",
        ),
    ],
)
def test_risk_analysis_request_model_invalid(
    main_theme, focus, companies, start_date, end_date, expected_error
):
    with pytest.raises((ValidationError, ValueError)) as exc_info:
        RiskAnalysisRequest(
            main_theme=main_theme,
            focus=focus,
            companies=companies,
            start_date=start_date,
            end_date=end_date,
        )
    assert expected_error in str(exc_info.value)


@pytest.mark.parametrize(
    "main_theme,focus,companies,start_date,end_date,keywords,llm_model,rerank_threshold,chunk_percentage,max_leaf_labels",
    [
        (
            "US Import Tariffs against China",
            "Taxonomy of risks for US companies",
            ["4A6F00", "D8442A"],
            "2025-06-01",
            "2025-08-01",
            ["Tariffs"],
            "gpt-5.6-luna",
            None,
            0.02,
            15,
        ),
        (
            "Risk of supply chain disruption",
            "Impact on global logistics",
            ["A12345"],
            "2025-01-01",
            "2025-12-31",
            ["Disruption", "Logistics"],
            "gpt-5.6-luna",
            0.8,
            0.5,
            None,
        ),
        (
            "Intellectual property risks",
            "IP risk taxonomy",
            ["B67890"],
            "2025-07-01",
            "2025-08-01",
            None,
            "gpt-5",
            None,
            1.0,
            0,
        ),
    ],
)
def test_risk_analysis_request_model(
    main_theme,
    focus,
    companies,
    start_date,
    end_date,
    keywords,
    llm_model,
    rerank_threshold,
    chunk_percentage,
    max_leaf_labels,
):
    req = RiskAnalysisRequest(
        main_theme=main_theme,
        focus=focus,
        companies=companies,
        start_date=start_date,
        end_date=end_date,
        keywords=keywords,
        llm_model=llm_model,
        rerank_threshold=rerank_threshold,
        chunk_percentage=chunk_percentage,
        max_leaf_labels=max_leaf_labels,
    )
    assert req.main_theme == main_theme
    assert req.focus == focus
    assert req.start_date == start_date
    assert req.end_date == end_date
    assert req.llm_model == llm_model
    assert req.chunk_percentage == chunk_percentage
    assert req.max_leaf_labels == max_leaf_labels
    assert req.companies == companies
    if keywords:
        assert req.keywords == keywords
    if rerank_threshold is not None:
        assert req.rerank_threshold == rerank_threshold
