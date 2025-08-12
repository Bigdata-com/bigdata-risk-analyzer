# 📊 Risk Analyzer API (FastAPI + Docker)

This API exposes the functionality of `RiskAnalyzer` to assess companies’ exposure to US-China trade risks.

## Install
For your project root:
```bash
uv venv .venv_ra
source .venv_ra/bin/activate
uv pip install -r requirements.txt


## 🔧 Setup

### Local (for testing)
```bash
uvicorn app.main:app --reload --port 8010

### 🌐 Once it's running...
You can access your API docs at:

📄 Swagger UI: http://localhost:8010/docs
📜 ReDoc: http://localhost:8010/redoc


### Run the container
docker build -t risk-analyzer-api .
docker run -d --env-file app/.env -p 8000:8000 risk-analyzer-api

## Now access the API at:
http://localhost:8010/docs



## 🧪 Example JSON Requests