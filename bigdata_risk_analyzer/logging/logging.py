from enum import StrEnum

from bigdata_client.tracking_services import TraceEvent
from bigdata_client.tracking_services import send_trace as bigdata_send_trace


class TraceEventName(StrEnum):
    SERVICE_START = "onPremRiskAnalyzerThematicScreenerServiceStart"
    RISK_ANALYZER_REPORT_GENERATED = "onPremRiskAnalyzerReportGenerated"
    THEMATIC_SCREENING_REPORT_GENERATED = "onPremThematicScreeningReportGenerated"

def send_trace(bigdata_client, event_name: TraceEventName, trace: dict):
        try:
            bigdata_send_trace(
                bigdata_client=bigdata_client,
                trace=TraceEvent(event_name=event_name, properties=trace),
            )
        except Exception:
            pass    