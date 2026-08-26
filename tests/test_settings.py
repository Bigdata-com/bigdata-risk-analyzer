from pathlib import Path

import pytest

from bigdata_risk_analyzer.settings import UNSET, Settings


@pytest.fixture
def no_api_keys_in_environ(monkeypatch):
    """Drop the keys conftest exports, so only the .env file can supply them."""
    monkeypatch.delenv("BIGDATA_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)


def _write_env_file(directory: Path, contents: str) -> Path:
    env_file = directory / ".env"
    env_file.write_text(contents)
    return env_file


def test_settings_read_api_keys_from_env_file(tmp_path, no_api_keys_in_environ):
    env_file = _write_env_file(
        tmp_path, "BIGDATA_API_KEY=bigdata-from-file\nOPENAI_API_KEY=openai-from-file\n"
    )

    settings = Settings(_env_file=env_file)

    assert settings.BIGDATA_API_KEY == "bigdata-from-file"
    assert settings.OPENAI_API_KEY == "openai-from-file"


def test_environment_variables_take_precedence_over_env_file(
    tmp_path, monkeypatch, no_api_keys_in_environ
):
    env_file = _write_env_file(
        tmp_path, "BIGDATA_API_KEY=bigdata-from-file\nOPENAI_API_KEY=openai-from-file\n"
    )
    monkeypatch.setenv("BIGDATA_API_KEY", "bigdata-from-environ")

    settings = Settings(_env_file=env_file)

    assert settings.BIGDATA_API_KEY == "bigdata-from-environ"
    assert settings.OPENAI_API_KEY == "openai-from-file"


def test_unrelated_env_file_keys_are_ignored(tmp_path, no_api_keys_in_environ):
    env_file = _write_env_file(
        tmp_path,
        "BIGDATA_API_KEY=bigdata-from-file\n"
        "OPENAI_API_KEY=openai-from-file\n"
        "SOME_UNRELATED_TOOL_TOKEN=whatever\n",
    )

    settings = Settings(_env_file=env_file)

    assert settings.BIGDATA_API_KEY == "bigdata-from-file"


def test_missing_api_keys_are_rejected_when_demo_mode_is_off(
    tmp_path, no_api_keys_in_environ
):
    env_file = _write_env_file(tmp_path, "BIGDATA_API_KEY=bigdata-from-file\n")

    with pytest.raises(ValueError, match="must be set when DEMO_MODE is disabled"):
        Settings(_env_file=env_file)


def test_demo_mode_does_not_require_api_keys(tmp_path, no_api_keys_in_environ):
    env_file = _write_env_file(tmp_path, "DEMO_MODE=true\n")

    settings = Settings(_env_file=env_file)

    assert settings.DEMO_MODE is True
    assert settings.BIGDATA_API_KEY == UNSET
