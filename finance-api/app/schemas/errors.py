from pydantic import BaseModel


class ErrorResponse(BaseModel):
    error: str            # machine-readable code, e.g. "provider_unavailable"
    message: str          # human-readable explanation
    symbol: str | None = None
