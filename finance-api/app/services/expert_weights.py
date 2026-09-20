"""
Per-expert (YouTube channel) consensus weights.

Used by the consensus aggregator to weight each opinion. All channels default
to `DEFAULT_WEIGHT`; override per channel slug below. Operators tune these
based on observed quality once the app is live.

Scale (suggested):
    2.0  very important   — strong track record, consistent reasoning
    1.5  important
    1.0  normal           — default
    0.5  noisy / low signal
    0.0  exclude

Channel slugs match the kebab-case `slug` field returned by GET /v1/channels/.
"""

DEFAULT_WEIGHT: float = 1.0

# Operator-curated overrides go here. Empty for MVP — every channel is 1.0.
# Example:
#   "atilla-yesilada": 1.5,
#   "ekonomide-saadet": 0.8,
CHANNEL_WEIGHTS: dict[str, float] = {}

# Channels with weight at or above this threshold are surfaced as
# "high-weight experts" in the consensus output.
HIGH_WEIGHT_THRESHOLD: float = 1.5


def weight_for(channel_slug: str | None) -> float:
    if not channel_slug:
        return DEFAULT_WEIGHT
    return CHANNEL_WEIGHTS.get(channel_slug.strip().lower(), DEFAULT_WEIGHT)


def is_high_weight(channel_slug: str | None) -> bool:
    return weight_for(channel_slug) >= HIGH_WEIGHT_THRESHOLD
