from typing import Literal

from pydantic import BaseModel

Sentiment = Literal["bullish", "bearish", "neutral"]


class ChannelOverview(BaseModel):
    id: int
    name: str
    slug: str
    avatar_url: str | None = None
    bio: str | None = None
    channel_url: str | None = None
    subscriber_count: int | None = None
    top_topic_key: str | None = None
    top_topic_label: str | None = None
    recent_sentiment: Sentiment | None = None
    video_count: int = 0


class PersonTopicStance(BaseModel):
    topic_key: str
    topic_label: str
    sentiment: Sentiment
    confidence: float
    last_updated: str
    video_count: int


class PersonTimelinePoint(BaseModel):
    date: str
    sentiment: Sentiment
    confidence: float
    video_id: int
    summary: str
