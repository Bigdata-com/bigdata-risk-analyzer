from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from bigdata_risk_analyzer.settings import settings

loader = Environment(loader=FileSystemLoader(searchpath=Path(settings.TEMPLATES_DIR)))
