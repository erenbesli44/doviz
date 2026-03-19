"""
Provider registry — assembles all provider instances and makes them available
to services via dependency injection.

A single ProviderRegistry is created once per app using app.state, then
injected into services through FastAPI's dependency system.
"""
import httpx

from ..config import Settings
from ..providers.coingecko import CoinGeckoProvider
from ..providers.finnhub import FinnhubProvider
from ..providers.fmp import FMPProvider
from ..providers.harem_altin import HaremAltinProvider
from ..providers.yahoo_finance import YahooFinanceProvider


class ProviderRegistry:
    """Holds one instance of each provider, keyed by provider_id."""

    def __init__(self, client: httpx.AsyncClient, settings: Settings) -> None:
        self._providers = {
            "finnhub": FinnhubProvider(client, settings.finnhub_api_key),
            "coingecko": CoinGeckoProvider(client, settings.coingecko_api_key),
            "fmp": FMPProvider(client, settings.fmp_api_key),
            "yahoo": YahooFinanceProvider(client),
            "harem_altin": HaremAltinProvider(client),
        }

    def get(self, provider_id: str):
        provider = self._providers.get(provider_id)
        if provider is None:
            raise KeyError(f"Unknown provider: {provider_id!r}")
        return provider

    def all(self) -> dict:
        return dict(self._providers)
