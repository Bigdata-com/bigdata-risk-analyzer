import io

import pytest
from fastapi.testclient import TestClient

from bigdata_risk_analyzer.api.app import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "ok"
    assert "version" in data
    assert isinstance(data["version"], str)


def test_analyze_risk_rejects_watchlist_string(client):
    response = client.post(
        "/risk-analysis",
        json={
            "main_theme": "US Import Tariffs against China",
            "focus": "Taxonomy of risks for US companies",
            "companies": "44118802-9104-4265-b97a-2e6d88d74893",
            "start_date": "2025-06-01",
            "end_date": "2025-08-01",
        },
    )
    assert response.status_code == 422
    assert "Watchlist is not supported" in response.text


def test_analyze_risk_upload_rejects_bad_csv(client):
    bad_csv = io.BytesIO(b"NOT_AN_ID,NOT_A_NAME\nfoo,bar\n")
    response = client.post(
        "/risk-analysis/upload",
        files={"file": ("universe.csv", bad_csv, "text/csv")},
        data={
            "request": (
                '{"main_theme": "Theme", "focus": "Focus", '
                '"start_date": "2025-06-01", "end_date": "2025-08-01"}'
            )
        },
    )
    assert response.status_code == 400
