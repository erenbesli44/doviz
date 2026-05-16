from typing import Literal

from pydantic import BaseModel


Direction = Literal["up", "down", "sideways", "mixed"]
TopicStatus = Literal["new", "updated", "carried_over", "error"]


class InferenceSource(BaseModel):
    video_id: int
    title: str
    channel_name: str
    person_name: str
    weight_used: float
    contribution_note: str


class InferenceTopic(BaseModel):
    topic_key: str
    topic_label: str
    direction: Direction
    confidence: float
    summary: str
    tags: list[str] = []
    status: TopicStatus
    changed_from_prev: bool
    change_reason: str | None = None
    sources: list[InferenceSource] = []


class InferenceLatestResponse(BaseModel):
    run_id: int
    run_date: str
    status: str
    generated_at: str
    window_start: str | None = None
    window_end: str | None = None
    topics: list[InferenceTopic] = []


class TopicHistoryEntry(BaseModel):
    run_date: str
    direction: Direction
    confidence: float
    changed_from_prev: bool
