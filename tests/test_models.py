import pytest
from pydantic import ValidationError

from bigdata_risk_analyzer.api.models import (
    DocumentTypeEnum,
    FrequencyEnum,
    RiskAnalysisRequest,
)


@pytest.mark.parametrize(
    "main_theme,focus,companies,control_entities,start_date,end_date,keywords,llm_model,document_type,rerank_threshold,frequency,document_limit,batch_size,fiscal_year,expected_error",
    [
        # Missing both companies
        (
            "US Import Tariffs against China",
            "Taxonomy of risks for US companies",
            None,
            {"place": ["China"]},
            "2025-06-01",
            "2025-08-01",
            ["Tariffs"],
            "openai::gpt-4o-mini",
            DocumentTypeEnum.TRANSCRIPTS,
            None,
            FrequencyEnum.monthly,
            100,
            10,
            2025,
            "Input should be a valid",
        ),
        # start_date after end_date
        (
            "US Import Tariffs against China",
            "Taxonomy of risks for US companies",
            ["4A6F00"],
            {"place": ["China"]},
            "2025-08-01",
            "2025-06-01",
            ["Tariffs"],
            "openai::gpt-4o-mini",
            DocumentTypeEnum.TRANSCRIPTS,
            None,
            FrequencyEnum.monthly,
            100,
            10,
            2025,
            "The number of days in the range between start_date",
        ),
        # Frequency interval too large for date range
        (
            "US Import Tariffs against China",
            "Taxonomy of risks for US companies",
            ["4A6F00"],
            {"place": ["China"]},
            "2025-08-01",
            "2025-08-10",
            ["Tariffs"],
            "openai::gpt-4o-mini",
            DocumentTypeEnum.TRANSCRIPTS,
            None,
            FrequencyEnum.monthly,
            100,
            10,
            2025,
            "The number of days in the range between start_date",
        ),
        # Invalid frequency value
        (
            "US Import Tariffs against China",
            "Taxonomy of risks for US companies",
            ["4A6F00"],
            {"place": ["China"]},
            "2025-06-01",
            "2025-08-01",
            ["Tariffs"],
            "openai::gpt-4o-mini",
            DocumentTypeEnum.TRANSCRIPTS,
            None,
            "invalid_freq",
            100,
            10,
            2025,
            "invalid_freq",
        ),
    ],
)
def test_risk_analysis_request_model_invalid(
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
    expected_error,
):
    with pytest.raises((ValidationError, ValueError)) as exc_info:
        RiskAnalysisRequest(
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
    assert expected_error in str(exc_info.value)


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
            DocumentTypeEnum.TRANSCRIPTS,
            None,
            FrequencyEnum.monthly,
            100,
            10,
            2025,
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
            DocumentTypeEnum.TRANSCRIPTS,
            0.8,
            FrequencyEnum.weekly,
            50,
            5,
            2025,
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
            DocumentTypeEnum.TRANSCRIPTS,
            None,
            FrequencyEnum.yearly,
            200,
            20,
            2025,
        ),
        (
            "Intellectual property risks",
            "IP risk taxonomy",
            ["B67890"],
            {"place": ["China", "USA"]},
            "2025-07-01",
            "2025-08-01",
            ["IP", "Patent"],
            "openai::gpt-4o-mini",
            DocumentTypeEnum.TRANSCRIPTS,
            None,
            FrequencyEnum.daily,
            10,
            1,
            2025,
        ),
        (
            "Intellectual property risks",
            "IP risk taxonomy",
            ["B67890"],
            {"place": ["China", "USA"]},
            "2025-07-01",
            "2025-08-01",
            ["IP", "Patent"],
            "openai::gpt-5",
            DocumentTypeEnum.TRANSCRIPTS,
            None,
            FrequencyEnum.daily,
            10,
            1,
            2025,
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
    assert req.companies == companies
    if control_entities:
        assert req.control_entities == control_entities
    if keywords:
        assert req.keywords == keywords
    if rerank_threshold is not None:
        assert req.rerank_threshold == rerank_threshold
    if fiscal_year:
        assert req.fiscal_year == fiscal_year
