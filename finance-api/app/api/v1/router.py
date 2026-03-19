from fastapi import APIRouter

from .health import router as health_router
from .market import router as market_router
from .quotes import router as quotes_router
from .stream import router as stream_router

v1_router = APIRouter(prefix="/v1")

v1_router.include_router(quotes_router)
v1_router.include_router(market_router)
v1_router.include_router(health_router)
v1_router.include_router(stream_router)
