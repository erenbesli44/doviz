import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.v1.router import v1_router
from .cache.memory import MemoryCache
from .config import Settings
from .providers.finnhub_ws import FinnhubWSClient
from .providers.registry import ProviderRegistry
from .schemas.errors import ErrorResponse
from .services.event_bus import EventBus
from .services.quote_service import QuoteService
from .services.refresh_service import RefreshService


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create shared services; shutdown: clean up."""
    settings = Settings()
    logging.basicConfig(level=settings.log_level)

    # Core infrastructure
    app.state.http_client = httpx.AsyncClient(timeout=settings.quote_timeout_seconds)
    app.state.cache = MemoryCache()
    app.state.btc_realtime = None  # populated by FinnhubWSClient

    # Service layer
    app.state.event_bus = EventBus()
    providers = ProviderRegistry(app.state.http_client, settings)
    app.state.quote_service = QuoteService(
        providers=providers,
        cache=app.state.cache,
        timeout=settings.quote_timeout_seconds,
        event_bus=app.state.event_bus,
        app_state=app.state,
    )
    app.state.refresh_service = RefreshService(app.state.quote_service, app.state.event_bus)

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

    app = FastAPI(
        title="Finance API",
        description="Live and delayed market data provider for The Liquid Economy app.",
        version="0.1.0",
        debug=settings.debug,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # tighten in production
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

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
