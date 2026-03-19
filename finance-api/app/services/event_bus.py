"""
EventBus — lightweight publish/subscribe for quote updates.

Allows the RefreshService (and Finnhub WebSocket client) to push updated quotes
to any active SSE connections without polling.
"""
import asyncio
import logging
from collections import defaultdict
from typing import Any

logger = logging.getLogger(__name__)


class EventBus:
    def __init__(self) -> None:
        # symbol → set of asyncio.Queue objects (one per active SSE subscriber)
        self._subscribers: dict[str, set[asyncio.Queue[Any]]] = defaultdict(set)

    def subscribe(self, symbol: str) -> asyncio.Queue[Any]:
        """Register a new subscriber for *symbol*. Returns the queue to read from."""
        q: asyncio.Queue[Any] = asyncio.Queue(maxsize=50)
        self._subscribers[symbol].add(q)
        return q

    def unsubscribe(self, symbol: str, queue: asyncio.Queue[Any]) -> None:
        """Deregister a subscriber. Call this when the SSE connection closes."""
        self._subscribers[symbol].discard(queue)
        if not self._subscribers[symbol]:
            del self._subscribers[symbol]

    async def publish(self, symbol: str, quote: Any) -> None:
        """Push *quote* to all active subscribers of *symbol*."""
        dead: list[asyncio.Queue[Any]] = []
        for q in list(self._subscribers.get(symbol, [])):
            try:
                q.put_nowait(quote)
            except asyncio.QueueFull:
                # Slow consumer — drop oldest item and retry once
                try:
                    q.get_nowait()
                    q.put_nowait(quote)
                except asyncio.QueueEmpty:
                    dead.append(q)
        for q in dead:
            self._subscribers[symbol].discard(q)

    def subscriber_count(self) -> int:
        return sum(len(qs) for qs in self._subscribers.values())
