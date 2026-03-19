from datetime import datetime

from pydantic import BaseModel


class HistoryPoint(BaseModel):
    time: str    # "08:00" (HH:MM) or ISO-8601 timestamp string
    value: float


class HistoryResponse(BaseModel):
    symbol: str
    points: list[HistoryPoint]
    provider: str
    is_live: bool
    fetched_at: datetime
