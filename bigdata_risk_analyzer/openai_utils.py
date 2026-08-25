"""Small rate-limited parallel OpenAI chat helper.

Trimmed port of ``Thematic_Screener_CLI/src/openai_parallel.py`` — drops the
CLI's progress-bar/metrics plumbing since this runs inside a FastAPI
background task rather than an interactive terminal.
"""

from __future__ import annotations

import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from threading import Lock

from openai import OpenAI

DEFAULT_MAX_CONCURRENT_REQUESTS = 20
DEFAULT_MAX_RETRIES = 5
DEFAULT_RETRY_BACKOFF_SECONDS = 1.0


@dataclass(slots=True, frozen=True)
class ChatRequest:
    request_id: str
    messages: list[dict[str, str]]
    model: str
    # Left unset (None) by default: some models (e.g. reasoning-tier models) only
    # support the API default and reject an explicit temperature/seed value.
    temperature: float | None = None
    seed: int | None = None
    response_format: dict[str, str] = field(
        default_factory=lambda: {"type": "json_object"}
    )


@dataclass(slots=True)
class ChatResponse:
    request_id: str
    succeeded: bool
    content: str | None = None
    error: str | None = None


def _call_with_retries(
    client: OpenAI, request: ChatRequest, max_retries: int
) -> ChatResponse:
    last_error: Exception | None = None
    for attempt in range(max_retries):
        try:
            kwargs: dict = {
                "model": request.model,
                "messages": request.messages,
                "response_format": request.response_format,
            }
            if request.temperature is not None:
                kwargs["temperature"] = request.temperature
            if request.seed is not None:
                kwargs["seed"] = request.seed
            completion = client.chat.completions.create(**kwargs)
            content = completion.choices[0].message.content
            return ChatResponse(
                request_id=request.request_id, succeeded=True, content=content
            )
        except Exception as exc:  # noqa: BLE001 - retry any transient API error
            last_error = exc
            if attempt + 1 < max_retries:
                time.sleep(DEFAULT_RETRY_BACKOFF_SECONDS * (2**attempt))
    return ChatResponse(
        request_id=request.request_id, succeeded=False, error=str(last_error)
    )


def run_chat_requests_parallel(
    requests: list[ChatRequest],
    client: OpenAI | None = None,
    max_concurrent_requests: int = DEFAULT_MAX_CONCURRENT_REQUESTS,
    max_retries: int = DEFAULT_MAX_RETRIES,
) -> list[ChatResponse]:
    """Run many chat completion requests concurrently with bounded parallelism."""
    if not requests:
        return []

    openai_client = client if client is not None else OpenAI()
    responses: list[ChatResponse] = []
    responses_lock = Lock()

    with ThreadPoolExecutor(max_workers=max_concurrent_requests) as executor:
        futures = {
            executor.submit(
                _call_with_retries, openai_client, request, max_retries
            ): request
            for request in requests
        }
        for future in as_completed(futures):
            response = future.result()
            with responses_lock:
                responses.append(response)

    return responses
