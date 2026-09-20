"""
Schemas for the consensus aggregation endpoints (/v1/consensus*).

Mirrors the "asset_consensus_snapshot" contract: one block per asset with
a 5-day main consensus, a 24-hour fresh signal, top reasons, contrarian view,
high-weight expert view, and source stats.
"""

from typing import Literal

from pydantic import BaseModel

# 5-band labels — surfaced to the UI verbatim; the frontend maps to Turkish copy.
ConsensusDirection = Literal[
    "strong_bullish",
    "mild_bullish",
    "neutral",
    "mild_bearish",
    "strong_bearish",
    "uncertain",
]

FreshSignalDirection = Literal[
    "bullish_shift",
    "bearish_shift",
    "stable",
    "mixed",
    "high_volatility",
    "no_fresh_data",
]

Sentiment = Literal["bullish", "bearish", "neutral"]


class ConsensusBlock(BaseModel):
    """The 5-day weighted consensus for one asset."""
    window: str  # e.g. "5d"
    direction: ConsensusDirection
    confidence: float  # 0..1, weighted-average opinion confidence
    bullish_score: float
    bearish_score: float
    neutral_score: float
    summary: str


class FreshSignalBlock(BaseModel):
    """The 24-hour signal — how recent opinions compare to the 5-day baseline."""
    window: str  # e.g. "24h"
    direction: FreshSignalDirection
    confidence: float
    summary: str


class HighWeightExpertView(BaseModel):
    """Aggregate of opinions only from channels with weight >= HIGH_WEIGHT_THRESHOLD."""
    direction: ConsensusDirection
    summary: str
    expert_count: int


class ContrarianView(BaseModel):
    """The strongest minority-sentiment opinion (the loudest dissent)."""
    direction: Sentiment
    summary: str
    expert_name: str | None = None


class ImportantExpert(BaseModel):
    expert_name: str
    channel_slug: str | None = None
    direction: Sentiment
    weight: float
    main_claim: str  # truncated summary
    video_url: str | None = None


class ConsensusStats(BaseModel):
    opinion_count: int
    expert_count: int
    high_weight_expert_count: int


class AssetConsensusResponse(BaseModel):
    """
    Full per-asset consensus block — section 19 of the product spec.
    Returned by GET /v1/consensus/{asset_key}.
    """
    asset: str        # public_key e.g. "bitcoin"
    asset_code: str   # canonical e.g. "BTC"
    display_name: str
    group: str
    generated_at: str

    main_consensus: ConsensusBlock
    fresh_signal: FreshSignalBlock
    high_weight_expert_view: HighWeightExpertView | None = None

    top_reasons: list[str] = []
    contrarian_view: ContrarianView | None = None
    important_experts: list[ImportantExpert] = []

    stats: ConsensusStats


class AssetConsensusSummary(BaseModel):
    """Compact form used by the list endpoint / home page cards."""
    asset: str
    asset_code: str
    display_name: str
    group: str
    consensus_direction: ConsensusDirection
    confidence: float
    fresh_signal: FreshSignalDirection
    short_summary: str
    opinion_count: int
    updated_at: str
