from datetime import datetime
from typing import Literal

from pydantic import BaseModel

AssetCategory = Literal["fx", "gold", "index", "commodity", "crypto"]


class QuoteData(BaseModel):
    symbol: str          # internal symbol, e.g. "USD/TRY"
    name: str            # display name, e.g. "Dolar/TL"
    price: float
    change_pct: float    # e.g. 0.12 means +0.12%
    open: float | None = None
    high: float | None = None
    low: float | None = None
    currency: str        # quote currency, e.g. "TRY" or "USD"
    category: AssetCategory
    unit: str | None = None  # "troy oz", "gram", "barrel"; None for fx/index/crypto


class QuoteMeta(BaseModel):
    provider: str                     # "finnhub" | "fmp" | "coingecko" | "yahoo" | "harem_altin"
    is_live: bool                     # False = delayed — always explicit in response
    delay_minutes: int | None = None  # set when is_live=False
    fetched_at: datetime              # when the external call was made (or cache was populated)
    market_status: str | None = None  # "open" | "closed" | "pre-market" | None


class QuoteResponse(BaseModel):
    data: QuoteData
    meta: QuoteMeta


class BatchQuoteResponse(BaseModel):
    quotes: list[QuoteResponse]
    # symbols that could not be resolved are listed here with their error
    errors: dict[str, str] = {}
