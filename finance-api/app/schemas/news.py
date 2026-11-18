from typing import Any

from pydantic import BaseModel, field_validator, model_validator


class NewsChannel(BaseModel):
    id: int
    name: str
    slug: str
    platform: str
    channel_handle: str | None = None
    channel_url: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    subscriber_count: int | None = None
    channel_metadata: dict[str, Any] | None = None

    @model_validator(mode="before")
    @classmethod
    def _extract_avatar_from_metadata(cls, values: object) -> object:
        if isinstance(values, dict):
            metadata = values.get("channel_metadata") or {}
            if isinstance(metadata, dict):
                values = {
                    **values,
                    "avatar_url": values.get("avatar_url") or metadata.get("avatar_url"),
                    "subscriber_count": (
                        values.get("subscriber_count") or metadata.get("subscriber_count")
                    ),
                }
        return values


class NewsVideo(BaseModel):
    id: int
    channel_id: int | None = None
    person_id: int | None = None
    platform: str
    video_id: str
    video_url: str
    title: str
    published_at: str | None = None
    created_at: str
    duration: int | None = None


class NewsSummary(BaseModel):
    id: int
    video_id: int
    short_summary: str
    long_summary: str
    highlights: list[str] = []
    language: str
    source: str
    created_at: str
    updated_at: str | None = None

    @field_validator("highlights", mode="before")
    @classmethod
    def _null_highlights_to_empty(cls, v: object) -> object:
        # The tracker stores highlights=None when the LLM returns no key points;
        # rejecting that silently dropped the story from every news feed.
        return [] if v is None else v


class NewsStory(BaseModel):
    video: NewsVideo
    channel: NewsChannel | None = None
    summary: NewsSummary


class LatestNewsResponse(BaseModel):
    stories: list[NewsStory]
