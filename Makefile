.PHONY: tests lint format

tests:
	@uv run -m pytest --cov --cov-config=.coveragerc  --cov-report term --cov-report xml:./coverage-reports/coverage.xml -s tests/*

lint:
	@uvx ruff check --extend-select I --fix bigdata_risk_analyzer/ tests/

lint-check:
	@uvx ruff check --extend-select I bigdata_risk_analyzer/ tests/

format:
	@uvx ruff format bigdata_risk_analyzer/ tests/

type-check:
	@uvx ty check bigdata_risk_analyzer/ tests/