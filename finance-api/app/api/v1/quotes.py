from typing import Annotated

from fastapi import APIRouter, Body, Path, Query

from ...dependencies import MarketServiceDep, QuoteServiceDep
from ...schemas.history import HistoryResponse
from ...schemas.quote import BatchQuoteResponse, QuoteResponse

router = APIRouter(prefix="/quotes", tags=["quotes"])


@router.get("/{symbol}", response_model=QuoteResponse)
async def get_quote(
    symbol: Annotated[str, Path(description="Symbol in URL-safe form, e.g. 'USD-TRY' or 'BTC-USD'")],
    service: QuoteServiceDep,
) -> QuoteResponse:
    """Fetch a single live (or labeled-delayed) quote for the given symbol."""
    return await service.get_quote(symbol)


@router.post("/batch", response_model=BatchQuoteResponse)
async def get_batch(
    symbols: Annotated[list[str], Body(min_length=1, max_length=20)],
    market_service: MarketServiceDep,
) -> BatchQuoteResponse:
    """
    Fetch multiple symbols in one request. Partial failures are returned in the
    'errors' dict rather than failing the entire response.
    """
    return await market_service.get_batch(symbols)


@router.get("/{symbol}/history", response_model=HistoryResponse)
async def get_history(
    symbol: Annotated[str, Path(description="Symbol in URL-safe form, e.g. 'USD-TRY'")],
    service: QuoteServiceDep,
    hours: Annotated[int, Query(ge=1, le=26280, description="Look-back window in hours (max 3 years)")] = 24,
) -> HistoryResponse:
    """Fetch historical price points for sparkline/chart rendering."""
    return await service.get_history(symbol, hours)
