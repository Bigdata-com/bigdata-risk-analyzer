import pytest
from pydantic import ValidationError

from bigdata_risk_analyzer.api.models import (
    EXAMPLE_COMPANY_LISTS,
    RiskAnalysisRequestBase,
)


def test_example_company_lists_are_rp_entity_ids():
    assert "MAG_7" in EXAMPLE_COMPANY_LISTS
    assert len(EXAMPLE_COMPANY_LISTS["MAG_7"]) == 7
    for entity_id in EXAMPLE_COMPANY_LISTS["MAG_7"]:
        assert isinstance(entity_id, str) and entity_id


def test_risk_analysis_request_base_valid():
    req = RiskAnalysisRequestBase(
        main_theme="US Import Tariffs against China",
        focus="Taxonomy of risks for US companies",
        start_date="2025-06-01",
        end_date="2025-08-01",
        chunk_percentage=0.05,
    )
    assert req.main_theme == "US Import Tariffs against China"
    assert req.chunk_percentage == 0.05
    assert req.llm_model == "gpt-5.6-luna"


@pytest.mark.parametrize("chunk_percentage", [-0.1, 1.5])
def test_risk_analysis_request_base_chunk_percentage_out_of_range(chunk_percentage):
    with pytest.raises(ValidationError):
        RiskAnalysisRequestBase(
            main_theme="Theme",
            focus="Focus",
            start_date="2025-06-01",
            end_date="2025-08-01",
            chunk_percentage=chunk_percentage,
        )


def test_risk_analysis_request_base_max_taxonomy_depth_defaults_to_none():
    req = RiskAnalysisRequestBase(
        main_theme="Theme",
        focus="Focus",
        start_date="2025-06-01",
        end_date="2025-08-01",
    )
    assert req.max_taxonomy_depth is None


def test_risk_analysis_request_base_max_taxonomy_depth_accepts_three():
    req = RiskAnalysisRequestBase(
        main_theme="Theme",
        focus="Focus",
        start_date="2025-06-01",
        end_date="2025-08-01",
        max_taxonomy_depth=3,
    )
    assert req.max_taxonomy_depth == 3


def test_risk_analysis_request_base_max_taxonomy_depth_rejects_below_two():
    with pytest.raises(ValidationError):
        RiskAnalysisRequestBase(
            main_theme="Theme",
            focus="Focus",
            start_date="2025-06-01",
            end_date="2025-08-01",
            max_taxonomy_depth=1,
        )
