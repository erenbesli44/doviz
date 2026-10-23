# /// script
# requires-python = ">=3.11"
# dependencies = ["google-analytics-data>=0.18"]
# ///
"""GA4 summary for dovizveri.com, printed as markdown for the product routine.

Read-only: uses the GA4 Data API with a service account that has Viewer
access on the property. Credentials come from the environment and are never
printed:
  GA_SERVICE_ACCOUNT_JSON         the key file's JSON content (cloud routine secret), or
  GOOGLE_APPLICATION_CREDENTIALS  a path to the key file (local runs)
  GA_PROPERTY_ID                  optional, defaults to dovizveri.com's property

Usage: uv run --script scripts/ga_report.py [--days 7]
Exit code 2 and a "MISSING DATA" line when credentials are absent.
"""

import argparse
import json
import os
import sys

DEFAULT_PROPERTY_ID = "531225194"


def _client():
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.oauth2 import service_account

    scopes = ["https://www.googleapis.com/auth/analytics.readonly"]
    raw = os.environ.get("GA_SERVICE_ACCOUNT_JSON")
    if raw:
        info = json.loads(raw)
        creds = service_account.Credentials.from_service_account_info(info, scopes=scopes)
        return BetaAnalyticsDataClient(credentials=creds)
    return BetaAnalyticsDataClient()  # GOOGLE_APPLICATION_CREDENTIALS


def _run(client, prop, days, dimensions, metrics, limit=None, compare=True, order_metric=None):
    from google.analytics.data_v1beta.types import (
        DateRange,
        Dimension,
        Metric,
        OrderBy,
        RunReportRequest,
    )

    ranges = [DateRange(start_date=f"{days}daysAgo", end_date="yesterday", name="current")]
    if compare:
        ranges.append(
            DateRange(start_date=f"{2 * days}daysAgo", end_date=f"{days + 1}daysAgo", name="previous")
        )
    req = RunReportRequest(
        property=f"properties/{prop}",
        date_ranges=ranges,
        dimensions=[Dimension(name=d) for d in dimensions],
        metrics=[Metric(name=m) for m in metrics],
        limit=limit or 0,
    )
    if order_metric:
        req.order_bys = [OrderBy(metric=OrderBy.MetricOrderBy(metric_name=order_metric), desc=True)]
    return client.run_report(req)


def _rows(resp, n_dims):
    """{dims tuple: {range_name: [metric values]}} — GA adds a dateRange dimension when comparing."""
    out: dict[tuple, dict[str, list[str]]] = {}
    for row in resp.rows:
        dims = [d.value for d in row.dimension_values]
        rng = dims[n_dims] if len(dims) > n_dims else "current"
        out.setdefault(tuple(dims[:n_dims]), {})[rng] = [m.value for m in row.metric_values]
    return out


def _num(v: str) -> float:
    try:
        return float(v)
    except ValueError:
        return 0.0


def _fmt(v: float) -> str:
    return f"{v:.0f}" if v == int(v) else f"{v:.2f}"


def _delta(cur: float, prev: float) -> str:
    if prev == 0:
        return "new" if cur else "—"
    return f"{(cur - prev) / prev * 100:+.0f}%"


def _table(title, resp, dims, metrics, labels, top):
    rows = _rows(resp, len(dims))
    print(f"\n### {title}\n")
    head = " | ".join(labels)
    print(f"| {' | '.join(dims)} | {head} | Δ {labels[0]} vs previous |")
    print("|" + "---|" * (len(dims) + len(metrics) + 1))
    ranked = sorted(rows.items(), key=lambda kv: -_num((kv[1].get("current") or ["0"])[0]))
    for key, by_range in ranked[:top]:
        cur = [_num(v) for v in by_range.get("current", ["0"] * len(metrics))]
        prev = [_num(v) for v in by_range.get("previous", ["0"] * len(metrics))]
        print(f"| {' | '.join(key)} | {' | '.join(_fmt(v) for v in cur)} | {_delta(cur[0], prev[0])} |")
    if not rows:
        print("| (no data) |")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=7)
    args = parser.parse_args()
    prop = os.environ.get("GA_PROPERTY_ID", DEFAULT_PROPERTY_ID)

    if not (os.environ.get("GA_SERVICE_ACCOUNT_JSON") or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")):
        print(
            "MISSING DATA: GA4 metrics — no GA_SERVICE_ACCOUNT_JSON / GOOGLE_APPLICATION_CREDENTIALS "
            "in the environment — owner adds a read-only service account (see docs/scheduled-tasks.md)"
        )
        return 2

    try:
        client = _client()
        d = args.days
        print(f"## GA4 — property {prop}, last {d} days vs the {d} days before (excludes today)\n")

        totals = _run(
            client, prop, d, [],
            ["activeUsers", "newUsers", "sessions", "screenPageViews",
             "engagementRate", "averageSessionDuration"],
        )
        names = ["Active users", "New users", "Sessions", "Views", "Engagement rate", "Avg session (s)"]
        tot = _rows(totals, 0).get((), {})
        cur = [_num(v) for v in tot.get("current", ["0"] * 6)]
        prev = [_num(v) for v in tot.get("previous", ["0"] * 6)]
        print("| Metric | Current | Previous | Δ |\n|---|---|---|---|")
        for name, c, p in zip(names, cur, prev, strict=True):
            print(f"| {name} | {_fmt(c)} | {_fmt(p)} | {_delta(c, p)} |")

        _table("Pages (by path)", _run(client, prop, d, ["pagePath"], ["screenPageViews", "activeUsers"],
               order_metric="screenPageViews"), ["pagePath"], ["v", "u"], ["Views", "Users"], 20)
        _table("Channels", _run(client, prop, d, ["sessionDefaultChannelGroup"], ["sessions", "engagedSessions"]),
               ["sessionDefaultChannelGroup"], ["s", "e"], ["Sessions", "Engaged sessions"], 10)
        _table("Landing pages", _run(client, prop, d, ["landingPage"], ["sessions", "bounceRate"]),
               ["landingPage"], ["s", "b"], ["Sessions", "Bounce rate"], 10)
        _table("Devices", _run(client, prop, d, ["deviceCategory"], ["activeUsers"]),
               ["deviceCategory"], ["u"], ["Users"], 5)
        _table("Countries / cities", _run(client, prop, d, ["country", "city"], ["activeUsers"]),
               ["country", "city"], ["u"], ["Users"], 10)
        _table("Events", _run(client, prop, d, ["eventName"], ["eventCount"]),
               ["eventName"], ["c"], ["Count"], 15)

        daily = _run(client, prop, 2 * d, ["date"], ["activeUsers", "screenPageViews"], compare=False)
        print(f"\n### Daily (last {2 * d} days)\n\n| date | Users | Views |\n|---|---|---|")
        for (date,), by_range in sorted(_rows(daily, 1).items()):
            u, v = by_range.get("current", ["0", "0"])
            print(f"| {date} | {u} | {v} |")
    except Exception as exc:  # noqa: BLE001 — report, never crash the routine; no secrets printed
        print(f"MISSING DATA: GA4 metrics — Data API call failed ({type(exc).__name__}: {str(exc)[:200]})")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
