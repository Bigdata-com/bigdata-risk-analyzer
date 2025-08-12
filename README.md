# 📊 Risk Analyzer API (FastAPI + Docker)

This API exposes the functionality of `RiskAnalyzer` to assess companies’ exposure to US-China trade risks.

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
