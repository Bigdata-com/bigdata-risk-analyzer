# Risk Analyzer with Bigdata.com
This repository contains a docker image for running a risk analyzing service using Bigdata.com SDK. You can read more on our [docs](https://docs.bigdata.com/use-cases/docker-services/risk-analyzer).

# How to use?
The risk analyzing service will allow you to assess and quantify risks related to a specific theme, such as US-China trade relations or supply chain disruptions. It will screen your trading universe and quantify the potential impact of identified risks for each company in the universe.

## Prerequisites
- A [Bigdata.com](https://bigdata.com) account that supports programmatic access.
- A Bigdata.com API key, which can be obtained from your account settings.
    - For more information on how to get an API key, refer to the [Bigdata.com documentation](https://docs.bigdata.com/api-reference/introduction#api-key-beta).

# Quickstart
To quickly get started, you have two options:

1. **Build and run locally:**
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

2. **Run directly from GitHub Container Registry:**

```bash
docker run -d \
  --name bigdata_risk_analyzer \
  -p 8000:8000 \
  -e BIGDATA_API_KEY=<bigdata-api-key-here> \
  -e OPENAI_API_KEY=<openai-api-key-here> \
  ghcr.io/bigdata-com/bigdata-risk-analyzer:latest
```

This will start the risk analyzer service locally on port 8000. You can then access the service @ `http://localhost:8000/` and the documentation for the API @ `http://localhost:8000/docs`.

For a custom enterprise-ready solution, please contact us at [support@bigdata.com](mailto:support@bigdata.com)


## Security Measures

We perform a pre-release security scan on our container images to detect vulnerabilities in all components.


## How to analyse a set of companies?

A risk analysis report provides an executive summary of financially relevant information about a set of companies that form your watchlist. You can generate a report either using the UI or programmatically, allowing you to build custom workflows on top of this service.

### Using the UI
There is a very simple UI available @ `http://localhost:8000/` where you can set your parameters and receive an easy-to-read summary of the analysis.

### Programmatically
You can generate report for a universe of companies by sending a POST request to the `/risk-analysis` endpoint with the required
parameters. For example, using `curl`:
```bash
curl -X 'POST' \
  'http://localhost:8000/risk-analysis' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "main_theme": "US Import Tariffs against China",
  "focus": "Provide a detailed taxonomy of risks describing how new American import tariffs against China will impact US companies, their operations and strategy. Cover trade-relations risks, foreign market access risks, supply chain risks, US market sales and revenue risks (including price impacts), and intellectual property risks, provide at least 4 sub-scenarios for each risk factor.",
  "companies": "44118802-9104-4265-b97a-2e6d88d74893",
  "control_entities": {
    "place": [
      "China"
    ]
  },
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "keywords": [
    "Tariffs"
  ],
  "document_type": "TRANSCRIPTS",
  "fiscal_year": 2024,
  "frequency": "M"
}'
```

For more details on the parameters, refer to the API documentation @ `http://localhost:8000/docs`.

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
