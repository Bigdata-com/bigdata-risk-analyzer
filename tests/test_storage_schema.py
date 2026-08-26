import pytest
from sqlmodel import Session, SQLModel, create_engine, text

from bigdata_risk_analyzer.api import app as app_module


@pytest.fixture
def sqlite_engine(tmp_path, monkeypatch):
    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}")
    monkeypatch.setattr(app_module, "engine", engine)
    return engine


def test_check_storage_schema_accepts_a_freshly_created_database(sqlite_engine):
    SQLModel.metadata.create_all(sqlite_engine)

    app_module.check_storage_schema()


def test_check_storage_schema_accepts_an_empty_database(sqlite_engine):
    app_module.check_storage_schema()


def test_check_storage_schema_rejects_a_table_from_an_earlier_release(sqlite_engine):
    # A 2.x report table: no chunk_percentage, plus columns that 3.0 dropped.
    with Session(sqlite_engine) as session:
        session.exec(
            text(
                "CREATE TABLE sqlriskanalyzerreport ("
                "id CHAR(32) NOT NULL PRIMARY KEY, "
                "created_at DATETIME NOT NULL, "
                "llm_model VARCHAR NOT NULL, "
                "theme VARCHAR NOT NULL, "
                "document_limit INTEGER NOT NULL)"
            )
        )
        session.commit()

    with pytest.raises(RuntimeError, match="chunk_percentage"):
        app_module.check_storage_schema()
