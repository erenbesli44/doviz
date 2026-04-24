from fastapi import APIRouter, HTTPException, Query

from ...dependencies import HttpClientDep, SettingsDep
from ...schemas.news import LatestNewsResponse, NewsStory
from ...services.tracker_service import TrackerNotFoundError, TrackerService


router = APIRouter(prefix="/news", tags=["news"])


def _service(client: HttpClientDep, settings: SettingsDep) -> TrackerService:
    return TrackerService(client, settings)


@router.get("/latest", response_model=LatestNewsResponse)
async def latest(
    client: HttpClientDep,
    settings: SettingsDep,
    limit: int = Query(default=5, ge=1, le=20),
) -> LatestNewsResponse:
    """Newest YouTube summaries across all channels, ordered by publish time."""
    service = _service(client, settings)
    return await service.latest(limit)


@router.get("/stories/{video_id}", response_model=NewsStory)
async def story(
    video_id: int,
    client: HttpClientDep,
    settings: SettingsDep,
) -> NewsStory:
    """Single story by upstream video id (video + channel + summary)."""
    service = _service(client, settings)
    try:
        return await service.story(video_id)
    except TrackerNotFoundError as exc:
        raise HTTPException(status_code=404, detail="news_story_not_found") from exc
