from pydantic import BaseModel


class NewsChannel(BaseModel):
    id: int
    name: str
    slug: str
    platform: str
    channel_handle: str | None = None
    channel_url: str | None = None
    bio: str | None = None


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


class NewsStory(BaseModel):
    video: NewsVideo
    channel: NewsChannel | None = None
    summary: NewsSummary


class LatestNewsResponse(BaseModel):
    stories: list[NewsStory]
