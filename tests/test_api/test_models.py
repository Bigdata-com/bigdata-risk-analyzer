import pytest

from bigdata_risk_analyzer.api.models import (
    DocumentType,
    FrequencyEnum,
    RiskAnalysisRequest,
)


@pytest.mark.parametrize(
    "main_theme,focus,companies,control_entities,start_date,end_date,keywords,llm_model,document_type,rerank_threshold,frequency,document_limit,batch_size,fiscal_year",
    [
        # Minimal valid input with companies
        (
            "US Import Tariffs against China",
            "Taxonomy of risks for US companies",
            ["4A6F00", "D8442A"],
            {"place": ["China"]},
            "2025-06-01",
            "2025-08-01",
            ["Tariffs"],
            "openai::gpt-4o-mini",
            DocumentType.NEWS,
            None,
            FrequencyEnum.monthly,
            100,
            10,
            None,
        ),
        # Minimal valid input with watchlist_id
        (
            "US Import Tariffs against China",
            "Taxonomy of risks for US companies",
            "44118802-9104-4265-b97a-2e6d88d74893",
            {"place": ["China"]},
            "2025-06-01",
            "2025-08-01",
            ["Tariffs"],
            "openai::gpt-4o-mini",
            DocumentType.NEWS,
            0.8,
            FrequencyEnum.weekly,
            50,
            5,
            None,
        ),
        # Different frequency and document type
        (
            "Risk of supply chain disruption",
            "Impact on global logistics",
            ["A12345"],
            {"place": ["USA"]},
            "2025-01-01",
            "2025-12-31",
            ["Disruption", "Logistics"],
            "openai::gpt-4o-mini",
            DocumentType.NEWS,
            None,
            FrequencyEnum.yearly,
            200,
            20,
            None,
        ),
        # Control entities with multiple places
        (
            "Intellectual property risks",
            "IP risk taxonomy",
            ["B67890"],
            {"place": ["China", "USA"]},
            "2025-07-01",
            "2025-08-01",
            ["IP", "Patent"],
            "openai::gpt-4o-mini",
            DocumentType.NEWS,
            None,
            FrequencyEnum.daily,
            10,
            1,
            None,
        ),
    ],
)
def test_risk_analysis_request_model(
    main_theme,
    focus,
    companies,
    control_entities,
    start_date,
    end_date,
    keywords,
    llm_model,
    document_type,
    rerank_threshold,
    frequency,
    document_limit,
    batch_size,
    fiscal_year,
):
    req = RiskAnalysisRequest(
        main_theme=main_theme,
        focus=focus,
        companies=companies,
        control_entities=control_entities,
        start_date=start_date,
        end_date=end_date,
        keywords=keywords,
        llm_model=llm_model,
        document_type=document_type,
        rerank_threshold=rerank_threshold,
        frequency=frequency,
        document_limit=document_limit,
        batch_size=batch_size,
        fiscal_year=fiscal_year,
    )
    assert req.main_theme == main_theme
    assert req.focus == focus
    assert req.start_date == start_date
    assert req.end_date == end_date
    assert req.llm_model == llm_model
    assert req.document_type == document_type
    assert req.frequency == frequency
    assert req.document_limit == document_limit
    assert req.batch_size == batch_size
    assert companies == companies
    if control_entities:
        assert req.control_entities == control_entities
    if keywords:
        assert req.keywords == keywords
    if rerank_threshold is not None:
        assert req.rerank_threshold == rerank_threshold
    if fiscal_year:
        assert req.fiscal_year == fiscal_year
