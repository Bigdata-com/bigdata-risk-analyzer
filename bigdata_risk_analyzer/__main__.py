from bigdata_risk_analyzer import LOG_LEVEL
from bigdata_risk_analyzer.api.app import app
from bigdata_risk_analyzer.settings import settings

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app, host=settings.HOST, port=settings.PORT, log_level=LOG_LEVEL.lower()
    )