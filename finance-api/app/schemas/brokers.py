"""Broker model-portfolio data proxied from the tracker (OI-027 step 4).

Mirrors the tracker contract. Required fields, enum actions, ISO dates and the
criterion-C quote bound make a malformed upstream payload fail validation, which
the router maps to 502 instead of passing bad data to the web app.
"""
from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

BrokerAction = Literal["added", "removed", "weight_up", "weight_down"]

SLUG_PATTERN = r"^[a-z0-9-]{1,40}$"
TICKER_PATTERN = r"^[A-Z0-9]{2,10}$"


class BrokerRef(BaseModel):
    slug: str = Field(pattern=SLUG_PATTERN)
    name: str = Field(min_length=1)


class BrokerInfo(BrokerRef):
    site_url: str = Field(pattern=r"^https?://")


class BrokerSummary(BrokerInfo):
    enabled: bool
    events_count: int = Field(ge=0)
    last_event_date: date | None = None


class BrokerListResponse(BaseModel):
    brokers: list[BrokerSummary]


class BrokerDocument(BaseModel):
    url: str = Field(pattern=r"^https?://")
    # Kept as a string: the contract allows null but does not pin date vs datetime.
    published_at: str | None = None
    # Broker's human-readable report page (e.g. Yapı Kredi research page), when known.
    page_url: str | None = None


class PreviousAction(BaseModel):
    action: BrokerAction
    event_date: date


class BrokerEvent(BaseModel):
    id: int
    broker: BrokerRef
    ticker: str = Field(pattern=TICKER_PATTERN)
    action: BrokerAction
    event_date: date
    reason_quote: str = Field(min_length=1, max_length=300)
    quote_page: int | None = Field(default=None, ge=1)
    recommendation: str | None = None
    target_price: float | None = None
    document: BrokerDocument
    previous: PreviousAction | None = None


class BrokerEventsResponse(BaseModel):
    count: int = Field(ge=0)
    events: list[BrokerEvent]


class CompositionItem(BaseModel):
    ticker: str = Field(pattern=TICKER_PATTERN)
    entry_date: date | None = None


class BrokerComposition(BaseModel):
    as_of: date
    basis: str
    items: list[CompositionItem]


class BrokerPortfolioResponse(BaseModel):
    broker: BrokerInfo
    composition: BrokerComposition | None = None
    events: list[BrokerEvent]
