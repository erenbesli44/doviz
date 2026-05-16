from fastapi import APIRouter, HTTPException, Query

from ...dependencies import HttpClientDep, SettingsDep
from ...schemas.inference import InferenceLatestResponse, TopicHistoryEntry
from ...services.inference_service import InferenceService


router = APIRouter(prefix="/inference", tags=["inference"])


def _service(client: HttpClientDep, settings: SettingsDep) -> InferenceService:
    return InferenceService(client, settings)


@router.get("/latest", response_model=InferenceLatestResponse)
async def latest(
    client: HttpClientDep,
    settings: SettingsDep,
) -> InferenceLatestResponse:
    """Today's full market inference with all topics and sources."""
    try:
        return await _service(client, settings).latest()
    except Exception as exc:
        raise HTTPException(status_code=502, detail="inference_upstream_error") from exc


@router.get("/topics/{topic_key}/history", response_model=list[TopicHistoryEntry])
async def topic_history(
    topic_key: str,
    client: HttpClientDep,
    settings: SettingsDep,
    days: int = Query(default=30, ge=1, le=90),
) -> list[TopicHistoryEntry]:
    """Direction + confidence history for a single topic."""
    try:
        return await _service(client, settings).topic_history(topic_key, days)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="inference_upstream_error") from exc
