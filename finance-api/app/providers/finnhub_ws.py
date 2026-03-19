"""
FinnhubWSClient — real-time BTC/USD price via Finnhub's WebSocket feed.

Connects to wss://ws.finnhub.io and subscribes to BINANCE:BTCUSDT.
On every trade message, updates `app.state.btc_realtime` with:
  {"price": float, "ts": float}   (ts = UNIX timestamp of the trade)

Auto-reconnects with exponential back-off (cap 60 s) on any error.
If Finnhub API key is absent the client does nothing (graceful no-op).
"""
import asyncio
import json
import logging
import time

logger = logging.getLogger(__name__)

_FINNHUB_WS_URL = "wss://ws.finnhub.io"
_SYMBOL = "BINANCE:BTCUSDT"
_RECONNECT_BASE = 2.0
_RECONNECT_CAP = 60.0


class FinnhubWSClient:
    def __init__(self, api_key: str, state: object) -> None:
        """
        Args:
            api_key: Finnhub API key (empty string = disabled).
            state:   FastAPI app.state — will write `btc_realtime` dict on each trade.
        """
        self._key = api_key
        self._state = state
        self._task: asyncio.Task | None = None

    async def start(self) -> None:
        if not self._key:
            logger.info("FinnhubWSClient: no API key, real-time BTC feed disabled.")
            return
        self._task = asyncio.create_task(self._run(), name="finnhub_ws")

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def _run(self) -> None:
        delay = _RECONNECT_BASE
        while True:
            try:
                await self._connect()
                delay = _RECONNECT_BASE  # reset on clean disconnect
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                logger.warning("Finnhub WS error (%s), reconnecting in %.0fs", exc, delay)
                await asyncio.sleep(delay)
                delay = min(delay * 2, _RECONNECT_CAP)

    async def _connect(self) -> None:
        try:
            import websockets  # type: ignore[import-untyped]
        except ImportError:
            logger.error("websockets package not installed — real-time BTC feed disabled.")
            return

        url = f"{_FINNHUB_WS_URL}?token={self._key}"
        async with websockets.connect(url, ping_interval=20, ping_timeout=10) as ws:
            logger.info("Finnhub WS connected, subscribing to %s", _SYMBOL)
            await ws.send(json.dumps({"type": "subscribe", "symbol": _SYMBOL}))
            async for raw in ws:
                msg = json.loads(raw)
                if msg.get("type") == "trade":
                    for trade in msg.get("data", []):
                        price = trade.get("p")
                        ts = trade.get("t", time.time() * 1000) / 1000  # ms → s
                        if price:
                            self._state.btc_realtime = {"price": float(price), "ts": ts}
