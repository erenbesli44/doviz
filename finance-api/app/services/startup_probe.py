"""
Startup probe — tests every FMP-configured symbol at boot and records which
ones return 402 (plan-limited).  Symbols that fail are added to a blocklist
so RefreshService and QuoteService skip FMP for them entirely, saving API calls.

Usage in lifespan:
    probe = StartupProbe(providers, settings)
    blocked = await probe.run()          # set[str] of internal symbols
    app.state.fmp_blocked = blocked
"""
import logging
from datetime import UTC, datetime

from ..providers.fmp import FMPProvider
from ..providers.registry import ProviderRegistry
from ..symbols.registry import SYMBOL_REGISTRY, SymbolConfig

logger = logging.getLogger(__name__)


class StartupProbe:
    def __init__(self, providers: ProviderRegistry) -> None:
        self._fmp: FMPProvider = providers.get("fmp")

    async def run(self) -> set[str]:
        """Probe every symbol that references FMP as primary or fallback.

        Returns a set of *internal* symbol names where FMP returned 402
        (subscription-limited).
        """
        blocked: set[str] = set()
        targets = _fmp_symbols()

        if not targets:
            logger.info("No FMP symbols to probe.")
            return blocked

        logger.info("Probing %d FMP symbols…", len(targets))

        for internal, ext_symbol, role in targets:
            ok = await self._test(ext_symbol)
            status = "✓" if ok else "✗ 402"
            logger.info("  FMP probe %-10s %-10s  %s", internal, f"({role})", status)
            if not ok:
                blocked.add(internal)

        if blocked:
            logger.warning(
                "FMP blocked symbols (%d): %s — will use fallback providers.",
                len(blocked),
                ", ".join(sorted(blocked)),
            )
        else:
            logger.info("All FMP symbols passed probe.")

        return blocked

    async def _test(self, external_symbol: str) -> bool:
        """Return True if FMP returns a valid quote, False on 402 or error."""
        try:
            quote = await self._fmp.fetch_quote(external_symbol)
            return quote.price is not None
        except Exception as exc:
            if "402" in str(exc):
                return False
            # Other errors (timeout, 5xx) — don't block, assume transient
            logger.debug("FMP probe non-402 error for %s: %s", external_symbol, exc)
            return True


def _fmp_symbols() -> list[tuple[str, str, str]]:
    """Collect (internal_symbol, external_fmp_symbol, role) for all FMP-linked symbols."""
    results: list[tuple[str, str, str]] = []
    seen_external: set[str] = set()

    for internal, cfg in SYMBOL_REGISTRY.items():
        if cfg.primary_provider == "fmp" and cfg.external_primary not in seen_external:
            results.append((internal, cfg.external_primary, "primary"))
            seen_external.add(cfg.external_primary)
        elif cfg.fallback_provider == "fmp" and cfg.external_fallback and cfg.external_fallback not in seen_external:
            results.append((internal, cfg.external_fallback, "fallback"))
            seen_external.add(cfg.external_fallback)

    return results
