"""
Async in-memory TTL cache.

Simple dict-based cache with per-key TTL, protected by asyncio.Lock to prevent
cache stampedes (multiple concurrent requests for the same cold key).

Design notes:
- No external dependency (no Redis) — suitable for single-process deployments.
- If multi-worker scaling is needed later, swap this for a Redis-backed cache
  behind the same MemoryCache interface.
- Each QuoteService creates one shared cache instance stored on app.state.
"""
import asyncio
import time
from typing import Any


class MemoryCache:
    def __init__(self) -> None:
        self._store: dict[str, tuple[Any, float]] = {}  # key → (value, expires_at)
        self._locks: dict[str, asyncio.Lock] = {}

    def _lock_for(self, key: str) -> asyncio.Lock:
        if key not in self._locks:
            self._locks[key] = asyncio.Lock()
        return self._locks[key]

    async def get(self, key: str) -> Any | None:
        entry = self._store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if time.monotonic() > expires_at:
            self._store.pop(key, None)
            self._locks.pop(key, None)  # prevent unbounded lock growth
            return None
        return value

    async def get_stale(self, key: str) -> Any | None:
        """Return cached value even if expired, or None if never set."""
        entry = self._store.get(key)
        if entry is None:
            return None
        value, _ = entry
        return value

    async def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        expires_at = time.monotonic() + ttl_seconds
        self._store[key] = (value, expires_at)

    async def delete(self, key: str) -> None:
        self._store.pop(key, None)

    def lock(self, key: str) -> asyncio.Lock:
        """Acquire before fetching to avoid cache stampede on a cold key."""
        return self._lock_for(key)

    def size(self) -> int:
        return len(self._store)
