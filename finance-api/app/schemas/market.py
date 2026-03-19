from .quote import QuoteResponse
from pydantic import BaseModel


class MarketOverviewResponse(BaseModel):
    """Top-level dashboard: a curated short list of quotes (e.g. USD/TRY, Gram Altın …)."""
    quotes: list[QuoteResponse]


class MarketSummaryResponse(BaseModel):
    """Category-grouped market summary used in the markets list view."""
    fx: list[QuoteResponse]
    gold: list[QuoteResponse]
    indexes: list[QuoteResponse]
    commodities: list[QuoteResponse]
    crypto: list[QuoteResponse]
