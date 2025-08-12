import logging
import os
from importlib.metadata import version

import structlog

LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

structlog.configure(
    wrapper_class=structlog.make_filtering_bound_logger(
        logging._nameToLevel.get(LOG_LEVEL, logging.INFO)
    ),
)

__version__ = "0.1"
logger = structlog.get_logger().bind(logger="risk-analyzer-api")