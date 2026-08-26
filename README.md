# Risk Analyzer with Bigdata.com
This repository contains a docker image for running a risk analyzing service using the Bigdata.com REST API (`https://api.bigdata.com`, `X-API-KEY` auth) and OpenAI. You can read more on our [docs](https://docs.bigdata.com/use-cases/docker-services/risk-analyzer).

# How to use?
The risk analyzing service will allow you to assess and quantify risks related to a specific theme, such as US-China trade relations or supply chain disruptions. It will screen your trading universe and quantify the potential impact of identified risks for each company in the universe.

## Prerequisites
- A [Bigdata.com](https://bigdata.com) account that supports programmatic access.
- A Bigdata.com API key, which can be obtained from your account settings.
    - For more information on how to get an API key, refer to the [Bigdata.com documentation](https://docs.bigdata.com/api-reference/introduction#api-key-beta).

# Quickstart

**Build and run locally:**
You need to build the docker image first and then run it:

```bash
# Clone the repository and navigate to the folder
git clone git@github.com:Bigdata-com/bigdata-risk-analyzer.git
cd "bigdata-risk-analyzer"

# Build the docker image
docker build -t bigdata_risk_analyzer .

# Run the docker image
docker run -d \
  --name bigdata_risk_analyzer \
  -p 8000:8000 \
  -e BIGDATA_API_KEY=<bigdata-api-key-here> \
  -e OPENAI_API_KEY=<openai-api-key-here> \
  bigdata_risk_analyzer
```


This will start the risk analyzer service locally on port 8000. You can then access the service @ `http://localhost:8000/` and the documentation for the API @ `http://localhost:8000/docs`.

For a custom enterprise-ready solution, please contact us at [support@bigdata.com](mailto:support@bigdata.com)


## Security Measures

We perform a pre-release security scan on our container images to detect vulnerabilities in all components.


## How to analyse a set of companies?

A risk analysis report provides an executive summary of financially relevant information about a set of companies in your universe. You can generate a report either using the UI or programmatically, allowing you to build custom workflows on top of this service.

The company universe is provided either as a list of RavenPack (RP) entity IDs, or as an uploaded CSV. **Watchlists (watchlist IDs) are not supported.**

### Using the UI
There is a very simple UI available @ `http://localhost:8000/` where you can set your parameters and receive an easy-to-read summary of the analysis.

### Programmatically
The risk analysis API works asynchronously. You first submit a request to start the analysis, then check the status periodically until completion.

#### Step 1: Submit Risk Analysis Request

**Option A — a list of RP entity IDs**, via `POST /risk-analysis`:

```bash
curl -X 'POST' \
  'http://localhost:8000/risk-analysis' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "main_theme": "US Import Tariffs against China",
  "focus": "Provide a detailed taxonomy of risks describing how new American import tariffs against China will impact US companies, their operations and strategy. Cover trade-relations risks, foreign market access risks, supply chain risks, US market sales and revenue risks (including price impacts), and intellectual property risks, provide at least 4 sub-scenarios for each risk factor.",
  "companies": ["D8442A", "228D42", "4A6F00"],
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "keywords": ["Tariffs"],
  "chunk_percentage": 0.05,
  "max_leaf_labels": 15
}'
```

**Option B — a universe CSV**, via `POST /risk-analysis/upload` (multipart, same fields minus `companies`, sent as a JSON string in the `request` form field). The CSV needs `RP_ENTITY_ID` (alias `RP_COMPANY_ID`) and `COMPANY_NAME` columns; `TICKER`/`SECTOR`/`INDUSTRY`/`COUNTRY` are optional enrichment columns:

```bash
curl -X 'POST' \
  'http://localhost:8000/risk-analysis/upload' \
  -H 'accept: application/json' \
  -F 'file=@Internal/mag7.csv;type=text/csv' \
  -F 'request={"main_theme": "US Import Tariffs against China", "focus": "Provide a detailed taxonomy of risks describing how new American import tariffs against China will impact US companies.", "start_date": "2024-01-01", "end_date": "2024-12-31"};type=application/json'
```

Both endpoints return a response like:
```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued"
}
```

#### Step 2: Check Analysis Status
Use the `request_id` to periodically check the status of your analysis:

```bash
curl -X 'GET' \
  'http://localhost:8000/status/550e8400-e29b-41d4-a716-446655440000' \
  -H 'accept: application/json'
```

The status response includes:
- `status`: Current state (`queued`, `in_progress`, `completed`, or `failed`)
- `logs`: Processing logs and progress updates
- `report`: Complete analysis results (only available when `status` is `completed`)

For more details on the parameters, refer to the API documentation @ `http://localhost:8000/docs`.

## Enable access token protection
You can optionally protect the API endpoints using an access token. To enable this feature, set the `ACCESS_TOKEN` environment variable when running the Docker container. For example:

```bash
docker run -d \
  --name bigdata_risk_analyzer \
  -p 8000:8000 \
  -e BIGDATA_API_KEY=<bigdata-api-key-here> \
  -e OPENAI_API_KEY=<openai-apikey-here> \
  -e ACCESS_TOKEN=<access-token-here> \
  ghcr.io/bigdata-com/bigdata_risk_analyzer:latest
```

Then all API requests must include a `token` query parameter with the correct value to be authorized. For example:

```bash
# Submit analysis request
curl -X 'POST' \
  'http://localhost:8000/risk-analysis?token=<access-token-here>' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "main_theme": "US Import Tariffs against China",
  "focus": "Provide a detailed taxonomy of risks describing how new American import tariffs against China will impact US companies, their operations and strategy. Cover trade-relations risks, foreign market access risks, supply chain risks, US market sales and revenue risks (including price impacts), and intellectual property risks, provide at least 4 sub-scenarios for each risk factor.",
  "companies": ["D8442A", "228D42", "4A6F00"],
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "keywords": ["Tariffs"]
}'

# Check status using the returned request_id
curl -X 'GET' \
  'http://localhost:8000/status/<request-id>?token=<access-token-here>' \
  -H 'accept: application/json'
```

# Install and for development locally
```bash
uv sync --dev
```

To run the service, you need an API key from Bigdata.com set on the environment variable `BIGDATA_API_KEY` and additionally provide an API key from a supported LLM provider, for now OpenAI.
```bash
# Set environment variables
export BIGDATA_API_KEY=<bigdata-api-key-here>
export OPENAI_API_KEY=<openai-api-key-here>
```

Then, the following command will start the risk analyzer service locally on port 8000.
```bash
uv run -m bigdata_risk_analyzer
```

## Tooling
This project uses [ruff](https://docs.astral.sh/ruff/) for linting and formatting and [ty](https://docs.astral.sh/ty/) for a type checker. To ensure your code adheres to the project's style guidelines, run the following commands before committing your changes:
```bash
make type-check
make lint
make format
```
