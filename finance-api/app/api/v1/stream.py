"""
SSE streaming endpoint — GET /v1/stream/quotes?symbols=USD/TRY,BTC/USD,...

Protocol:
  - Immediately sends an `init` event with current cached snapshots for all requested symbols.
  - Subscribes to the EventBus and streams `quote` events as data refreshes.
  - Sends a `ping` keep-alive comment every 30 s.
  - On disconnect, unsubscribes all queues automatically.

Client should handle:
  event: init  — JSON array of QuoteResponse objects (initial state)
  event: quote — single JSON QuoteResponse (incremental update)
  : ping       — SSE comment (keep-alive, ignored by EventSource)
"""
import asyncio
import json
import logging
from typing import AsyncGenerator

from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse

from ...services.event_bus import EventBus
from ...services.quote_service import QuoteService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stream", tags=["stream"])

_PING_INTERVAL = 30  # seconds between keep-alive pings
_MAX_SYMBOLS = 20


@router.get("/quotes", summary="Real-time quote stream (SSE)")
async def stream_quotes(
    request: Request,
    symbols: str = Query(..., description="Comma-separated list of internal symbols"),
) -> StreamingResponse:
    requested = [s.strip() for s in symbols.split(",") if s.strip()][:_MAX_SYMBOLS]

    quote_service: QuoteService = request.app.state.quote_service
    event_bus: EventBus = request.app.state.event_bus

    return StreamingResponse(
        _sse_generator(request, quote_service, event_bus, requested),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable nginx buffering
        },
    )


async def _sse_generator(
    request: Request,
    quote_service: QuoteService,
    event_bus: EventBus,
    symbols: list[str],
) -> AsyncGenerator[str, None]:
    # Subscribe queues before fetching snapshots to avoid missing updates
    queues: dict[str, asyncio.Queue] = {sym: event_bus.subscribe(sym) for sym in symbols}

    # Merged queue: all symbol updates funnel here
    merged: asyncio.Queue = asyncio.Queue(maxsize=200)

    async def _fan_in(sym: str, src: asyncio.Queue) -> None:
        while True:
            quote = await src.get()
            await merged.put((sym, quote))

    fan_tasks = [asyncio.create_task(_fan_in(sym, q)) for sym, q in queues.items()]

    try:
        # --- Send initial snapshot ---
        snapshots = []
        for sym in symbols:
            try:
                q = await quote_service.get_quote(sym)
                snapshots.append(q.model_dump(mode="json"))
            except Exception as e:
                logger.debug("SSE snapshot failed for %s: %s", sym, e)

        yield f"event: init\ndata: {json.dumps(snapshots)}\n\n"

        # --- Stream updates ---
        while not await request.is_disconnected():
            try:
                _sym, quote = await asyncio.wait_for(merged.get(), timeout=_PING_INTERVAL)
                payload = json.dumps(quote.model_dump(mode="json"))
                yield f"event: quote\ndata: {payload}\n\n"
            except asyncio.TimeoutError:
                yield ": ping\n\n"

    finally:
        for t in fan_tasks:
            t.cancel()
        for sym, q in queues.items():
            event_bus.unsubscribe(sym, q)
