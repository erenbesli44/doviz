"""
Consensus aggregator — request-time, two-window, weighted, recency-decayed.

Pulls per-mention opinions from tracker `/topics/{slug}/opinions`, applies
channel weight × recency × confidence, and produces the asset-consensus
contract described in section 19 of the product spec.

Math (per opinion):
    direction_score = {bullish: +1, bearish: -1, neutral: 0}
    age_hours       = (now - published_at).total_seconds() / 3600
    recency_weight  = step function (1.00 / 0.85 / 0.70 / 0.55 / 0.40)
    expert_weight   = expert_weights.weight_for(channel_slug)
    mass            = expert_weight * recency_weight * confidence
    signed_mass     = direction_score * mass

Aggregate bands:
    bullish_score = sum_bullish(mass) / sum_all(mass)
    bearish_score = sum_bearish(mass) / sum_all(mass)
    neutral_score = sum_neutral(mass) / sum_all(mass)
    net_score     = bullish_score - bearish_score   (range −1..+1)

5-band consensus label is derived from net_score + bullish/bearish dominance;
fresh signal compares the 24h slice to the 5d baseline.
"""

import asyncio
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from ..config import Settings
from ..schemas.consensus import (
    AssetConsensusResponse,
    AssetConsensusSummary,
    ConsensusBlock,
    ConsensusStats,
    ContrarianView,
    FreshSignalBlock,
    HighWeightExpertView,
    ImportantExpert,
)
from . import expert_weights
from .topic_mapping import Asset, ASSET_BY_PUBLIC_KEY, all_assets, resolve_public_key

logger = logging.getLogger(__name__)

MAIN_WINDOW_DAYS = 5
FRESH_WINDOW_HOURS = 24
TRACKER_OPINIONS_LIMIT = 50

# Step function on age (hours) → recency weight. Anything older than 5d is 0.
_RECENCY_BANDS: tuple[tuple[float, float], ...] = (
    (24,  1.00),
    (48,  0.85),
    (72,  0.70),
    (96,  0.55),
    (120, 0.40),
)


class ConsensusServiceError(Exception):
    pass


class AssetNotFoundError(Exception):
    pass


class ConsensusService:
    def __init__(self, client: httpx.AsyncClient, settings: Settings) -> None:
        self._client = client
        self._base = settings.tracker_api_url.rstrip("/")
        key = settings.inference_api_key or settings.tracker_api_key
        self._headers = {"X-API-Key": key} if key else {}
        self._timeout = settings.tracker_timeout_seconds

    async def _get(self, path: str) -> Any:
        resp = await self._client.get(
            f"{self._base}{path}",
            headers=self._headers,
            timeout=self._timeout,
            follow_redirects=True,
        )
        if not resp.is_success:
            logger.warning("consensus upstream %s → %s", path, resp.status_code)
        resp.raise_for_status()
        return resp.json()

    # ── Public API ──────────────────────────────────────────────────────────
    async def asset_consensus(self, public_key: str) -> AssetConsensusResponse:
        normalized = resolve_public_key(public_key)
        asset = ASSET_BY_PUBLIC_KEY.get(normalized)
        if asset is None:
            raise AssetNotFoundError(public_key)

        opinions = await self._fetch_opinions(asset)
        return _build_asset_consensus(asset, opinions, datetime.now(timezone.utc))

    async def consensus_summary_list(self) -> list[AssetConsensusSummary]:
        assets = all_assets()
        opinions_by_key = await asyncio.gather(
            *(self._fetch_opinions(a) for a in assets),
            return_exceptions=True,
        )
        now = datetime.now(timezone.utc)
        result: list[AssetConsensusSummary] = []
        for asset, payload in zip(assets, opinions_by_key, strict=True):
            if isinstance(payload, BaseException):
                logger.warning("consensus list: skipping %s — %s", asset.public_key, payload)
                continue
            block = _build_asset_consensus(asset, payload, now)
            result.append(
                AssetConsensusSummary(
                    asset=block.asset,
                    asset_code=block.asset_code,
                    display_name=block.display_name,
                    group=block.group,
                    consensus_direction=block.main_consensus.direction,
                    confidence=block.main_consensus.confidence,
                    fresh_signal=block.fresh_signal.direction,
                    short_summary=block.main_consensus.summary,
                    opinion_count=block.stats.opinion_count,
                    updated_at=block.generated_at,
                )
            )
        return result

    # ── Internals ───────────────────────────────────────────────────────────
    async def _fetch_opinions(self, asset: Asset) -> list[dict[str, Any]]:
        """Return a flat list of opinion dicts with channel context attached."""
        path = (
            f"/topics/{asset.tracker_slug}/opinions"
            f"?limit={TRACKER_OPINIONS_LIMIT}&days={MAIN_WINDOW_DAYS}"
        )
        data = await self._get(path)
        groups = data.get("channel_opinions") or []
        flat: list[dict[str, Any]] = []
        for group in groups:
            channel_slug = (group.get("channel_slug") or "").lower() or None
            channel_name = str(group.get("channel_name") or "")
            for entry in group.get("entries") or []:
                flat.append(
                    {
                        "channel_id": group.get("channel_id"),
                        "channel_slug": channel_slug,
                        "channel_name": channel_name,
                        "video_id": entry.get("video_id"),
                        "video_url": entry.get("video_url"),
                        "published_at": entry.get("published_at"),
                        "summary": entry.get("summary") or "",
                        "sentiment": entry.get("sentiment") or "neutral",
                        "confidence": float(entry.get("confidence") or 0.0),
                    }
                )
        return flat


# ─── Pure-function aggregation logic (no I/O) ───────────────────────────────


def _recency_weight(age_hours: float) -> float:
    for upper, w in _RECENCY_BANDS:
        if age_hours <= upper:
            return w
    return 0.0


def _direction_score(sentiment: str) -> int:
    return {"bullish": 1, "bearish": -1}.get(sentiment, 0)


def _parse_published_at(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _enrich(opinions: list[dict[str, Any]], now: datetime) -> list[dict[str, Any]]:
    """Attach age_hours, recency_weight, expert_weight, mass to each opinion."""
    enriched: list[dict[str, Any]] = []
    for op in opinions:
        published = _parse_published_at(op.get("published_at"))
        if published is None:
            # No date → assume mid-window so the opinion still carries some signal.
            age_hours = MAIN_WINDOW_DAYS * 24 / 2
        else:
            age_hours = max(0.0, (now - published).total_seconds() / 3600)
        rec = _recency_weight(age_hours)
        weight = expert_weights.weight_for(op.get("channel_slug"))
        if weight <= 0 or rec <= 0:
            continue  # excluded or too old
        confidence = max(0.0, min(1.0, op.get("confidence") or 0.0))
        mass = weight * rec * confidence
        if mass <= 0:
            continue
        enriched.append(
            {
                **op,
                "age_hours": age_hours,
                "recency_weight": rec,
                "expert_weight": weight,
                "mass": mass,
            }
        )
    return enriched


def _aggregate(enriched: list[dict[str, Any]]) -> dict[str, float | int]:
    """Return bullish/bearish/neutral scores, net, weighted-mean confidence."""
    if not enriched:
        return {
            "bullish_score": 0.0,
            "bearish_score": 0.0,
            "neutral_score": 0.0,
            "net_score": 0.0,
            "confidence": 0.0,
            "count": 0,
            "total_weight": 0.0,
        }

    total_mass = sum(op["mass"] for op in enriched)
    by_bucket = {"bullish": 0.0, "bearish": 0.0, "neutral": 0.0}
    total_weight = 0.0
    for op in enriched:
        bucket = op["sentiment"] if op["sentiment"] in by_bucket else "neutral"
        by_bucket[bucket] += op["mass"]
        total_weight += op["expert_weight"] * op["recency_weight"]

    # Weighted-mean confidence — total_mass already includes the confidence
    # term, so dividing by total_weight gives the mean.
    weighted_confidence = total_mass / total_weight if total_weight > 0 else 0.0

    return {
        "bullish_score": by_bucket["bullish"] / total_mass if total_mass else 0.0,
        "bearish_score": by_bucket["bearish"] / total_mass if total_mass else 0.0,
        "neutral_score": by_bucket["neutral"] / total_mass if total_mass else 0.0,
        "net_score": (by_bucket["bullish"] - by_bucket["bearish"]) / total_mass if total_mass else 0.0,
        "confidence": weighted_confidence,
        "count": len(enriched),
        "total_weight": total_weight,
    }


def _label_consensus(agg: dict[str, float | int]) -> str:
    count = int(agg["count"])
    if count < 2:
        return "uncertain"

    net = float(agg["net_score"])
    bull = float(agg["bullish_score"])
    bear = float(agg["bearish_score"])
    neut = float(agg["neutral_score"])

    if net >= 0.5 and bull >= 0.55:
        return "strong_bullish"
    if net <= -0.5 and bear >= 0.55:
        return "strong_bearish"
    if net >= 0.2:
        return "mild_bullish"
    if net <= -0.2:
        return "mild_bearish"
    if neut >= 0.45 or (bull < 0.35 and bear < 0.35):
        return "neutral"
    return "neutral"


def _label_fresh_signal(
    fresh_agg: dict[str, float | int],
    main_label: str,
) -> str:
    if int(fresh_agg["count"]) < 2:
        return "no_fresh_data"

    fresh_label = _label_consensus(fresh_agg)
    bull = float(fresh_agg["bullish_score"])
    bear = float(fresh_agg["bearish_score"])

    # Both bull and bear ≥ 0.35 in a small window → mixed.
    if bull >= 0.35 and bear >= 0.35:
        return "mixed"

    _order = {
        "strong_bearish": 0,
        "mild_bearish": 1,
        "neutral": 2,
        "uncertain": 2,
        "mild_bullish": 3,
        "strong_bullish": 4,
    }
    fresh_idx = _order.get(fresh_label, 2)
    main_idx = _order.get(main_label, 2)
    if fresh_idx > main_idx:
        return "bullish_shift"
    if fresh_idx < main_idx:
        return "bearish_shift"
    return "stable"


# Prefix that tracker prepends to every summary (e.g. "Bitcoin: ", "Altın: ").
_SUMMARY_PREFIX_RE = re.compile(r"^[^:]{1,40}:\s*")


def _strip_summary_prefix(summary: str) -> str:
    return _SUMMARY_PREFIX_RE.sub("", summary or "").strip()


def _shorten(text: str, max_chars: int = 180) -> str:
    cleaned = _strip_summary_prefix(text)
    if len(cleaned) <= max_chars:
        return cleaned
    # Cut at the next sentence boundary if there is one within range.
    cut = cleaned[: max_chars + 40]
    for sep in (". ", "? ", "! "):
        idx = cut.find(sep)
        if 60 < idx <= max_chars:
            return cut[: idx + 1].strip()
    return cleaned[:max_chars].rstrip() + "…"


def _top_reasons(enriched: list[dict[str, Any]], majority: str, n: int = 3) -> list[str]:
    bucket = [op for op in enriched if op["sentiment"] == majority]
    bucket.sort(key=lambda op: op["mass"], reverse=True)
    seen: set[str] = set()
    out: list[str] = []
    for op in bucket:
        s = _shorten(op["summary"])
        if not s or s in seen:
            continue
        seen.add(s)
        out.append(s)
        if len(out) >= n:
            break
    return out


def _contrarian(enriched: list[dict[str, Any]], majority: str) -> ContrarianView | None:
    if majority not in {"bullish", "bearish"}:
        return None
    opposite = "bearish" if majority == "bullish" else "bullish"
    bucket = [op for op in enriched if op["sentiment"] == opposite]
    if len(bucket) < 1:
        return None
    bucket.sort(key=lambda op: op["mass"], reverse=True)
    top = bucket[0]
    return ContrarianView(
        direction=opposite,
        summary=_shorten(top["summary"]),
        expert_name=top["channel_name"] or None,
    )


def _high_weight_view(
    enriched: list[dict[str, Any]],
) -> HighWeightExpertView | None:
    hw = [op for op in enriched if expert_weights.is_high_weight(op["channel_slug"])]
    if not hw:
        return None
    agg = _aggregate(hw)
    label = _label_consensus(agg)
    # Use the highest-mass opinion's summary as the representative quote.
    top = max(hw, key=lambda op: op["mass"])
    distinct_channels = {op["channel_id"] for op in hw}
    return HighWeightExpertView(
        direction=label,
        summary=_shorten(top["summary"]),
        expert_count=len(distinct_channels),
    )


def _important_experts(enriched: list[dict[str, Any]], limit: int = 5) -> list[ImportantExpert]:
    # Group by channel, pick the most recent strong opinion per channel,
    # then rank channels by expert_weight × max mass.
    by_channel: dict[Any, dict[str, Any]] = {}
    for op in enriched:
        cid = op["channel_id"]
        existing = by_channel.get(cid)
        if existing is None or op["mass"] > existing["mass"]:
            by_channel[cid] = op
    ordered = sorted(
        by_channel.values(),
        key=lambda op: (op["expert_weight"], op["mass"]),
        reverse=True,
    )[:limit]
    return [
        ImportantExpert(
            expert_name=op["channel_name"] or "Bilinmiyor",
            channel_slug=op["channel_slug"],
            direction=(
                op["sentiment"] if op["sentiment"] in {"bullish", "bearish"} else "neutral"
            ),
            weight=op["expert_weight"],
            main_claim=_shorten(op["summary"]),
            video_url=op["video_url"],
        )
        for op in ordered
    ]


def _consensus_summary_text(
    asset: Asset,
    main_label: str,
    main_count: int,
) -> str:
    label_to_phrase = {
        "strong_bullish": f"{asset.display_name} için güçlü pozitif konsensüs",
        "mild_bullish": f"{asset.display_name} için hafif pozitif konsensüs",
        "neutral": f"{asset.display_name} için belirgin yön yok",
        "mild_bearish": f"{asset.display_name} için hafif negatif konsensüs",
        "strong_bearish": f"{asset.display_name} için güçlü negatif konsensüs",
        "uncertain": f"{asset.display_name} için yeterli görüş yok",
    }
    base = label_to_phrase.get(main_label, asset.display_name)
    return f"{base} — son 5 günde {main_count} uzman görüşü."


def _fresh_summary_text(label: str, count: int) -> str:
    bases = {
        "bullish_shift": "Son 24 saatte görüşler pozitife dönüyor.",
        "bearish_shift": "Son 24 saatte görüşler negatife dönüyor.",
        "stable": "Son 24 saatte belirgin yön değişimi yok.",
        "mixed": "Son 24 saatte karışık görüşler hâkim.",
        "high_volatility": "Son 24 saatte oynaklık yüksek.",
        "no_fresh_data": "Son 24 saatte yeterli yeni görüş yok.",
    }
    base = bases.get(label, "—")
    # Suppress the count suffix when we treat the window as "no fresh data" —
    # otherwise it reads as a contradiction (e.g. "no new opinions (1 new)").
    if label == "no_fresh_data" or count == 0:
        return base
    return f"{base} ({count} yeni görüş)"


def _majority_from_label(label: str) -> str:
    if label in {"strong_bullish", "mild_bullish"}:
        return "bullish"
    if label in {"strong_bearish", "mild_bearish"}:
        return "bearish"
    return "neutral"


def _build_asset_consensus(
    asset: Asset,
    opinions: list[dict[str, Any]],
    now: datetime,
) -> AssetConsensusResponse:
    enriched = _enrich(opinions, now)
    main_agg = _aggregate(enriched)
    main_label = _label_consensus(main_agg)

    fresh_cutoff = now - timedelta(hours=FRESH_WINDOW_HOURS)
    fresh_enriched = [
        op for op in enriched
        if (parsed := _parse_published_at(op.get("published_at"))) and parsed >= fresh_cutoff
    ]
    fresh_agg = _aggregate(fresh_enriched)
    fresh_label = _label_fresh_signal(fresh_agg, main_label)

    majority = _majority_from_label(main_label)

    distinct_channels = {op["channel_id"] for op in enriched}
    high_weight_channels = {
        op["channel_id"] for op in enriched
        if expert_weights.is_high_weight(op["channel_slug"])
    }

    return AssetConsensusResponse(
        asset=asset.public_key,
        asset_code=asset.asset_code,
        display_name=asset.display_name,
        group=asset.group,
        generated_at=now.isoformat(),
        main_consensus=ConsensusBlock(
            window=f"{MAIN_WINDOW_DAYS}d",
            direction=main_label,
            confidence=round(float(main_agg["confidence"]), 3),
            bullish_score=round(float(main_agg["bullish_score"]), 3),
            bearish_score=round(float(main_agg["bearish_score"]), 3),
            neutral_score=round(float(main_agg["neutral_score"]), 3),
            summary=_consensus_summary_text(asset, main_label, int(main_agg["count"])),
        ),
        fresh_signal=FreshSignalBlock(
            window=f"{FRESH_WINDOW_HOURS}h",
            direction=fresh_label,
            confidence=round(float(fresh_agg["confidence"]), 3),
            summary=_fresh_summary_text(fresh_label, int(fresh_agg["count"])),
        ),
        high_weight_expert_view=_high_weight_view(enriched),
        top_reasons=_top_reasons(enriched, majority) if majority in {"bullish", "bearish"} else [],
        contrarian_view=_contrarian(enriched, majority),
        important_experts=_important_experts(enriched),
        stats=ConsensusStats(
            opinion_count=int(main_agg["count"]),
            expert_count=len(distinct_channels),
            high_weight_expert_count=len(high_weight_channels),
        ),
    )
