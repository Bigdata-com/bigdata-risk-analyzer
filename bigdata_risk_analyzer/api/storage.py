import uuid
from datetime import datetime
from threading import Lock

from sqlmodel import Session, select

from bigdata_risk_analyzer.api.models import (
    RiskAnalysisRequest,
    RiskAnalyzerStatusResponse,
    WorkflowStatus,
)
from bigdata_risk_analyzer.api.sql_models import (
    SQLRiskAnalyzerReport,
    SQLWorkflowStatus,
)
from bigdata_risk_analyzer.models import RiskAnalysisResponse


class StorageManager:
    def __init__(self, db_session: Session):
        self.db_session = db_session
        self.lock = Lock()

    def _get_workflow_status(self, request_id: str) -> SQLWorkflowStatus | None:
        return self.db_session.exec(
            select(SQLWorkflowStatus).where(
                SQLWorkflowStatus.id == uuid.UUID(request_id)
            )
        ).first()

    def _get_workflow_report(self, request_id: str) -> SQLRiskAnalyzerReport | None:
        return self.db_session.exec(
            select(SQLRiskAnalyzerReport).where(
                SQLRiskAnalyzerReport.id == uuid.UUID(request_id)
            )
        ).first()

    def _create_workflow_status(
        self, request_id: str, status: WorkflowStatus
    ) -> SQLWorkflowStatus:
        return SQLWorkflowStatus(
            id=uuid.UUID(request_id), status=status, last_updated=datetime.now()
        )

    def update_status(self, request_id: str, status: WorkflowStatus):
        with self.lock:
            workflow_status = self._get_workflow_status(request_id)

            if workflow_status is None:
                workflow_status = self._create_workflow_status(request_id, status)
            else:
                workflow_status.status = status
                workflow_status.last_updated = datetime.now()

            self.db_session.add(workflow_status)
            self.db_session.commit()
            self.db_session.refresh(workflow_status)

    def get_status(self, request_id: str) -> WorkflowStatus | None:
        with self.lock:
            workflow_status = self._get_workflow_status(request_id)
            if workflow_status is None:
                return None
            return workflow_status.status

    def log_message(self, request_id: str, message: str):
        with self.lock:
            workflow_status = self._get_workflow_status(request_id)
            if workflow_status is None:
                raise ValueError(
                    f"Request ID {request_id} not found in status storage."
                )
            workflow_status.logs.append(message)
            workflow_status.last_updated = datetime.now()
            self.db_session.add(workflow_status)
            self.db_session.commit()
            self.db_session.refresh(workflow_status)

    def get_logs(self, request_id: str) -> list[str] | None:
        with self.lock:
            workflow_status = self._get_workflow_status(request_id)
            if workflow_status is None:
                return None
            return workflow_status.logs

    def mark_workflow_as_completed(
        self,
        request_id: str,
        request: RiskAnalysisRequest,
        report: RiskAnalysisResponse,
    ):
        with self.lock:
            workflow_status = self._get_workflow_status(request_id)
            if workflow_status is None:
                raise ValueError(
                    f"Request ID {request_id} not found in status storage."
                )
            workflow_status.status = WorkflowStatus.COMPLETED
            sql_report = SQLRiskAnalyzerReport.from_risk_analyzer_response(
                request_id, request, report
            )

            self.db_session.add(workflow_status)
            self.db_session.add(sql_report)
            self.db_session.commit()
            self.db_session.refresh(workflow_status)
            self.db_session.refresh(sql_report)

    def get_report(self, request_id: str) -> RiskAnalyzerStatusResponse | None:
        with self.lock:
            workflow_status = self._get_workflow_status(request_id)
            if workflow_status is None:
                return None
            sql_report = self._get_workflow_report(request_id)
            if sql_report is None:
                return RiskAnalyzerStatusResponse(
                    request_id=request_id,
                    last_updated=workflow_status.last_updated,
                    status=workflow_status.status,
                    logs=workflow_status.logs,
                    report=None,
                )

            return RiskAnalyzerStatusResponse(
                request_id=request_id,
                last_updated=workflow_status.last_updated,
                status=workflow_status.status,
                logs=workflow_status.logs,
                report=RiskAnalysisResponse(**sql_report.screener_report),  # ty: ignore[missing-argument]
            )
