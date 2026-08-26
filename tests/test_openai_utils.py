from bigdata_risk_analyzer.openai_utils import build_openai_client


def test_build_openai_client_uses_the_configured_key(monkeypatch):
    """The key can arrive via .env, which OpenAI() would not see on its own."""
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    client = build_openai_client(api_key="openai-from-settings")

    assert client.api_key == "openai-from-settings"
