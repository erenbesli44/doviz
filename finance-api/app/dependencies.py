from functools import lru_cache
from typing import Annotated

import httpx
from fastapi import Depends, Request

from .cache.memory import MemoryCache
from .config import Settings
from .providers.registry import ProviderRegistry
from .services.market_service import MarketService
from .services.quote_service import QuoteService


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


SettingsDep = Annotated[Settings, Depends(get_settings)]


def get_http_client(request: Request) -> httpx.AsyncClient:
    """Retrieve the shared AsyncClient from app state (created in lifespan)."""
    return request.app.state.http_client


HttpClientDep = Annotated[httpx.AsyncClient, Depends(get_http_client)]


def get_cache(request: Request) -> MemoryCache:
    return request.app.state.cache


CacheDep = Annotated[MemoryCache, Depends(get_cache)]


def get_provider_registry(
    client: HttpClientDep,
    settings: SettingsDep,
) -> ProviderRegistry:
    return ProviderRegistry(client, settings)


ProviderRegistryDep = Annotated[ProviderRegistry, Depends(get_provider_registry)]


def get_quote_service(request: Request) -> QuoteService:
    """Return the shared QuoteService singleton (wired with event_bus + app_state)."""
    return request.app.state.quote_service


QuoteServiceDep = Annotated[QuoteService, Depends(get_quote_service)]


def get_market_service(quote_service: QuoteServiceDep) -> MarketService:
    return MarketService(quote_service)


MarketServiceDep = Annotated[MarketService, Depends(get_market_service)]
