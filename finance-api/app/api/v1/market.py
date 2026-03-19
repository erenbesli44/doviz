from fastapi import APIRouter

from ...dependencies import MarketServiceDep
from ...schemas.market import MarketOverviewResponse, MarketSummaryResponse

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/overview", response_model=MarketOverviewResponse)
async def get_overview(service: MarketServiceDep) -> MarketOverviewResponse:
    """
    Returns a curated short list of top instruments for the dashboard overview widget.
    (USD/TRY, Gram Altın, EUR/TRY, Nasdaq 100, S&P 500)
    """
    return await service.get_overview()


@router.get("/summary", response_model=MarketSummaryResponse)
async def get_summary(service: MarketServiceDep) -> MarketSummaryResponse:
    """
    Returns all known instruments grouped by category (fx, gold, indexes, commodities, crypto).
    Used by the Markets page category views.
    """
    return await service.get_summary()
