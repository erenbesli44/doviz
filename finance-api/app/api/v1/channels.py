from fastapi import APIRouter, HTTPException, Query

from ...dependencies import HttpClientDep, SettingsDep
from ...schemas.channels import ChannelOverview, PersonTimelinePoint, PersonTopicStance
from ...services.tracker_service import TrackerNotFoundError, TrackerService

router = APIRouter(prefix="/channels", tags=["channels"])


def _service(client: HttpClientDep, settings: SettingsDep) -> TrackerService:
    return TrackerService(client, settings)


@router.get("/", response_model=list[ChannelOverview])
async def list_channels(
    client: HttpClientDep,
    settings: SettingsDep,
) -> list[ChannelOverview]:
    """Channel directory for the /uzmanlar page."""
    try:
        return await _service(client, settings).list_channels_overview()
    except Exception as exc:
        raise HTTPException(status_code=502, detail="tracker_upstream_error") from exc


@router.get("/{slug}/overview", response_model=list[PersonTopicStance])
async def channel_overview(
    slug: str,
    client: HttpClientDep,
    settings: SettingsDep,
) -> list[PersonTopicStance]:
    """Current channel stance per topic."""
    try:
        return await _service(client, settings).channel_overview(slug)
    except TrackerNotFoundError as exc:
        raise HTTPException(status_code=404, detail="channel_not_found") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="tracker_upstream_error") from exc


@router.get("/{slug}/timeline", response_model=list[PersonTimelinePoint])
async def channel_timeline(
    slug: str,
    client: HttpClientDep,
    settings: SettingsDep,
    topic_key: str = Query(min_length=1),
) -> list[PersonTimelinePoint]:
    """Oldest-to-newest stance timeline for one channel and topic."""
    try:
        return await _service(client, settings).channel_timeline(slug, topic_key)
    except TrackerNotFoundError as exc:
        raise HTTPException(status_code=404, detail="channel_or_topic_not_found") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="tracker_upstream_error") from exc
