from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.mutable import MutableList
from sqlmodel import JSON, Column, Field, SQLModel

from bigdata_risk_analyzer.api.models import RiskAnalysisRequest
from bigdata_risk_analyzer.models import RiskAnalysisResponse


class SQLWorkflowStatus(SQLModel, table=True):
    id: UUID = Field(primary_key=True)
    last_updated: datetime
    status: str
    logs: list[str] = Field(
        default_factory=list, sa_column=Column(MutableList.as_mutable(JSON))
    )


class SQLRiskAnalyzerReport(SQLModel, table=True):
    id: UUID = Field(primary_key=True)
    created_at: datetime = Field(default_factory=datetime.now)
    companies: str | list[str] = Field(sa_column=Column(JSON))
    llm_model: str
    theme: str
    focus: str | None = None
    start_date: datetime
    end_date: datetime
    document_type: str
    fiscal_year: int | None = None
    rerank_threshold: float | None = None
    frequency: str
    document_limit: int
    batch_size: int
    screener_report: dict = Field(sa_column=Column(JSON))

    @staticmethod
    def from_risk_analyzer_response(
        request_id: UUID,
        request: RiskAnalysisRequest,
        response: RiskAnalysisResponse,
    ) -> "SQLRiskAnalyzerReport":
        return SQLRiskAnalyzerReport(
            id=request_id,
            companies=request.companies,
            llm_model=request.llm_model,
            theme=request.main_theme,
            focus=request.focus,
            start_date=datetime.fromisoformat(request.start_date),
            end_date=datetime.fromisoformat(request.end_date),
            document_type=request.document_type.value,
            fiscal_year=request.fiscal_year,
            rerank_threshold=request.rerank_threshold,
            frequency=request.frequency.value,
            document_limit=request.document_limit,
            batch_size=request.batch_size,
            screener_report=response.model_dump(),
        )
