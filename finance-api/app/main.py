import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from .api.v1.router import v1_router
from .cache.memory import MemoryCache
from .cache.session_store import SessionCloseStore
from .config import Settings
from .providers.finnhub_ws import FinnhubWSClient
from .providers.registry import ProviderRegistry
from .schemas.errors import ErrorResponse
from .services.eod_fetcher import EODFetcher
from .services.event_bus import EventBus
from .services.fallback_resolver import FallbackPriceResolver
from .services.market_calendar import MarketCalendarService
from .services.quote_service import QuoteService
from .services.refresh_service import RefreshService
from .services.startup_probe import StartupProbe


logger = logging.getLogger(__name__)


def _parse_cors_origins(raw: str) -> list[str]:
    value = (raw or "").strip()
    if not value or value == "*":
        return ["*"]
    return [item.strip() for item in value.split(",") if item.strip()]


class APIKeyMiddleware(BaseHTTPMiddleware):
    """Reject requests without a valid X-API-Key header, except health endpoint."""

    def __init__(self, app, secret_key: str):
        super().__init__(app)
        self.secret_key = secret_key

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip healthcheck and CORS preflight
        if request.url.path in ("/v1/health", "/health") or request.method == "OPTIONS":
            return await call_next(request)

        if not self.secret_key:
            # Key not configured — allow all (dev mode)
            return await call_next(request)

        key = request.headers.get("X-API-Key", "")
        if key != self.secret_key:
            return JSONResponse(status_code=401, content={"error": "unauthorized", "message": "Invalid or missing API key."})

        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create shared services; shutdown: clean up."""
    settings = Settings()
    logging.basicConfig(level=settings.log_level)

    # Core infrastructure
    verify: bool | str = settings.http_verify_tls
    if settings.http_ca_bundle:
        verify = settings.http_ca_bundle
    app.state.http_client = httpx.AsyncClient(
        timeout=settings.quote_timeout_seconds,
        verify=verify,
    )
    app.state.cache = MemoryCache()
    app.state.btc_realtime = None  # populated by FinnhubWSClient

    # Market-closed fallback layer
    app.state.session_store = SessionCloseStore()
    app.state.calendar = MarketCalendarService()

    # Service layer
    app.state.event_bus = EventBus()
    providers = ProviderRegistry(app.state.http_client, settings)

    # Probe FMP symbols to discover plan-limited 402s before serving traffic
    probe = StartupProbe(providers)
    app.state.fmp_blocked = await probe.run()

    app.state.eod_fetcher = EODFetcher(
        providers=providers,
        session_store=app.state.session_store,
        cache=app.state.cache,
    )
    app.state.fallback_resolver = FallbackPriceResolver(
        calendar=app.state.calendar,
        session_store=app.state.session_store,
        eod_fetcher=app.state.eod_fetcher,
    )
    app.state.quote_service = QuoteService(
        providers=providers,
        cache=app.state.cache,
        timeout=settings.quote_timeout_seconds,
        event_bus=app.state.event_bus,
        app_state=app.state,
        calendar=app.state.calendar,
        session_store=app.state.session_store,
        fallback_resolver=app.state.fallback_resolver,
        fmp_blocked=app.state.fmp_blocked,
    )
    app.state.refresh_service = RefreshService(
        quote_service=app.state.quote_service,
        event_bus=app.state.event_bus,
        calendar=app.state.calendar,
        eod_fetcher=app.state.eod_fetcher,
        fmp_blocked=app.state.fmp_blocked,
    )

    # Finnhub real-time WebSocket (no-op if key absent)
    app.state.btc_ws = FinnhubWSClient(settings.finnhub_api_key, app.state)

    logger.info("Starting background services…")
    await app.state.refresh_service.start()
    await app.state.btc_ws.start()
    logger.info("All services ready.")

    yield

    logger.info("Shutting down…")
    await app.state.refresh_service.stop()
    await app.state.btc_ws.stop()
    await app.state.http_client.aclose()
    logger.info("Shutdown complete.")


def create_app() -> FastAPI:
    settings = Settings()
    allow_origins = _parse_cors_origins(settings.cors_allow_origins)

    app = FastAPI(
        title="Finance API",
        description="Live and delayed market data provider for The Liquid Economy app.",
        version="0.1.0",
        debug=settings.debug,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )
    app.add_middleware(APIKeyMiddleware, secret_key=settings.api_secret_key)

    app.include_router(v1_router)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error: %s", exc)
        body = ErrorResponse(
            error="internal_error",
            message="An unexpected error occurred.",
        )
        return JSONResponse(status_code=500, content=body.model_dump())

    return app


app = create_app()
