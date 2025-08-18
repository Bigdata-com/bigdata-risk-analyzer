from unittest.mock import Mock

import pytest

from bigdata_risk_analyzer.traces import TraceEventName, send_trace


def test_send_trace_with_mock_client():
    mock_client = Mock()
    for event_name in TraceEventName.__members__.values():
        trace_data = {"key": "value"}

        # The function should not raise when using a mock client
        try:
            send_trace(mock_client, event_name, trace_data)
        except Exception as e:
            pytest.fail(f"send_trace raised an exception: {e}")
        assert mock_client._api.send_tracking_event.called
