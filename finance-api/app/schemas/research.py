"""Research digests proxied from the tracker (OI-041).

Mirrors the tracker's /research/digests contract. A malformed upstream payload fails
validation, which the router maps to 502 instead of passing bad data to the web app.
"""
from datetime import date

from pydantic import BaseModel, Field


class ResearchSource(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9-]{1,40}$")
    name: str = Field(min_length=1)
    disclaimer: str | None = None


class ResearchTerm(BaseModel):
    term: str = Field(min_length=1)
    meaning: str = Field(min_length=1)


class ResearchDigest(BaseModel):
    headline: str = Field(min_length=1)
    why_now: str = Field(min_length=1)
    findings: list[str] = Field(min_length=1, max_length=3)
    so_what: str = Field(min_length=1)
    not_said: str = Field(min_length=1)
    terms: list[ResearchTerm] = Field(default_factory=list, max_length=3)
    quote: str = Field(min_length=1)
    basis: str = Field(min_length=1)
    # Tracker topic slugs upstream; public asset keys (e.g. "faiz", "dolar-tl") when served.
    topics: list[str] = Field(default_factory=list)


class ResearchItem(BaseModel):
    id: int
    source: ResearchSource
    url: str = Field(pattern=r"^https?://")
    title: str = Field(min_length=1)
    authors: list[str] = Field(default_factory=list)
    category: str | None = None
    published_at: date | None = None
    digest: ResearchDigest
    digest_version: str | None = None


class ResearchDigestsResponse(BaseModel):
    count: int = Field(ge=0)
    items: list[ResearchItem]
