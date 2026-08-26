from datetime import datetime
from uuid import UUID

import pandas as pd

from bigdata_risk_analyzer import pipeline
from bigdata_risk_analyzer.api.models import RiskAnalysisRequestBase, WorkflowStatus
from bigdata_risk_analyzer.api.storage import StorageManager
from bigdata_risk_analyzer.models import RiskAnalysisResponse
from bigdata_risk_analyzer.taxonomy import Node
from bigdata_risk_analyzer.universe import ID_COLUMN


def build_response(
    screener_df: pd.DataFrame,
    root: Node,
    universe_df: pd.DataFrame,
) -> RiskAnalysisResponse:
    """Assemble the API response from the labeled sentences, taxonomy, and universe."""
    report = pipeline.build_risk_analysis_json(screener_df, root, universe_df)
    return RiskAnalysisResponse(**report)


def process_request(
    request: RiskAnalysisRequestBase,
    universe_df: pd.DataFrame,
    request_id: UUID,
    storage_manager: StorageManager,
):
    try:
        storage_manager.update_status(request_id, WorkflowStatus.IN_PROGRESS)

        def on_progress(message: str) -> None:
            storage_manager.log_message(request_id=request_id, message=message)

        workflow_execution_start = datetime.now()

        report = pipeline.run_risk_analysis(
            main_theme=request.main_theme,
            focus=request.focus,
            keywords=request.keywords,
            start_date=request.start_date,
            end_date=request.end_date,
            model=request.llm_model,
            rerank_threshold=request.rerank_threshold,
            chunk_percentage=request.chunk_percentage,
            max_leaf_labels=request.max_leaf_labels,
            max_taxonomy_depth=request.max_taxonomy_depth,
            universe_df=universe_df,
            on_progress=on_progress,
        )

        workflow_execution_end = datetime.now()
        on_progress(
            "Workflow completed in "
            f"{(workflow_execution_end - workflow_execution_start).total_seconds():.1f}s"
        )

        response = RiskAnalysisResponse(**report)

        storage_manager.mark_workflow_as_completed(
            request_id, request, universe_df[ID_COLUMN].tolist(), response
        )
        return response

    except Exception as e:
        storage_manager.log_message(
            request_id=request_id,
            message=f"Workflow failed with error: {str(e)}",
        )
        storage_manager.update_status(request_id, WorkflowStatus.FAILED)
        raise e
