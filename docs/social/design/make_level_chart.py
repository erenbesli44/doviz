#!/usr/bin/env python3
"""Fill and render the level-chart card (playbook §3.5 item 6).

Usage:
  python3 -I docs/social/design/make_level_chart.py --topic altin --video 830 --out <scratchpad>/lc830
  options: --person "Ad" (when one video has several speakers on the topic)
           --levels 5000,5600   (override the parsed key_levels; numbers in the series' unit)
           --headline "…"       (must be a verbatim part of the speaker's quote)
           --hours 2160         (series window; default 3 months, falls back to 1 year when a level
                                 sits outside the 3-month range)
           --no-render          (write the HTML only)

Reads the view from the site (/api/v1/inference/topics/<key>/opinions), keeps only key_levels that
are real prices in the series' unit, fetches the site's price history (/api/v1/quotes/<SYMBOL>/history),
writes <out>.html from card-level-chart.html, renders <out>.png/.webp with render.sh, writes
<out>-phone.html/.png (375 px feed mockup) and prints the alt text. Stdlib only.
"""
import argparse
import datetime as dt
import json
import pathlib
import re
import subprocess
import sys
import urllib.request

SITE = "https://dovizveri.com/api/v1"
HERE = pathlib.Path(__file__).resolve().parent
TEMPLATE = HERE / "card-level-chart.html"

# topic key -> series. unit: the unit word family the levels must carry (or none = bare number ok).
TOPICS = {
    "altin": dict(symbol="XAU-USD", label="Ons altın", unit="usd", sym="$", dec=0,
                  alt={"try": "gram altın (GAUTRY)"}),
    "gumus": dict(symbol="XAG-USD", label="Ons gümüş", unit="usd", sym="$", dec=2),
    "dolar-tl": dict(symbol="USD-TRY", label="Dolar/TL", unit="try", sym="TL", dec=2),
    "bist": dict(symbol="XU100", label="BIST 100", unit="pts", sym="", dec=0),
    "bitcoin": dict(symbol="BTC-USD", label="Bitcoin", unit="usd", sym="$", dec=0),
    "petrol-enerji": dict(symbol="BRENT", label="Brent petrol", unit="usd", sym="$", dec=2),
    # us-markets: key_levels may belong to Nasdaq/Dow; pass --levels only when the speaker named S&P 500.
    "us-markets": dict(symbol="SPX", label="S&P 500", unit="pts", sym="", dec=0, explicit_levels=True),
}
UNIT_WORDS = {
    "usd": r"dolar|\$|usd",
    "try": r"lira|\btl\b|₺",
    "pts": r"puan",
}
SKIP_WORDS = r"%|milyar|milyon|\bbin\b|günlük|haftalık|aylık|yıllık|ortalama|\bay\b|hafta|\bgün\b|\byıl"
MONTH_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
MONTH_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
MONTH_TR_LONG = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül",
                 "Ekim", "Kasım", "Aralık"]


def get(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def fmt(v, dec):
    s = f"{v:,.{dec}f}"
    return s.replace(",", "X").replace(".", ",").replace("X", ".")


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def parse_number(tok):
    tok = tok.strip()
    if "," in tok:
        whole, frac = tok.rsplit(",", 1)
        return float(whole.replace(".", "") + "." + frac)
    if re.fullmatch(r"\d{1,3}(\.\d{3})+", tok):
        return float(tok.replace(".", ""))
    return float(tok.replace(".", "")) if "." in tok else float(tok)


def parse_levels(key_levels, cfg, lo, hi):
    """Return (used, skipped) — used: list of floats in the series unit; skipped: list of (text, why)."""
    used, skipped = [], []
    unit_re = re.compile(UNIT_WORDS[cfg["unit"]], re.I)
    other = {u: re.compile(w, re.I) for u, w in UNIT_WORDS.items() if u != cfg["unit"]}
    for text in key_levels:
        nums = re.findall(r"\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?", text)
        if not nums:
            skipped.append((text, "sayı yok"))
            continue
        if re.search(SKIP_WORDS, text, re.I):
            skipped.append((text, "oran/tutar/süre, fiyat değil"))
            continue
        hit = [u for u, rx in other.items() if rx.search(text)]
        if hit and not unit_re.search(text):
            alt = (cfg.get("alt") or {}).get(hit[0])
            skipped.append((text, f"başka birim ({alt or hit[0]}); bu seride çizilemez"))
            continue
        for n in nums:
            v = parse_number(n)
            if lo * 0.5 <= v <= hi * 2:
                if v not in used:
                    used.append(v)
            else:
                skipped.append((n, "serinin aralığı dışında"))
    return used, skipped


def tr_time(label, today):
    """API time label -> (display label, sort key). '06 Nov' / \"Aug '25\" / '09:35'."""
    m = re.fullmatch(r"(\d{2}) ([A-Za-z]{3})", label)
    if m:
        d, mo = int(m.group(1)), MONTH_EN.index(m.group(2)) + 1
        y = today.year if mo <= today.month else today.year - 1
        return f"{d} {MONTH_TR[mo - 1]}", dt.date(y, mo, d), "daily"
    m = re.fullmatch(r"([A-Za-z]{3}) '(\d{2})", label)
    if m:
        mo = MONTH_EN.index(m.group(1)) + 1
        return f"{MONTH_TR[mo - 1]} '{m.group(2)}", dt.date(2000 + int(m.group(2)), mo, 1), "weekly"
    return label, None, "intraday"


def nice_ticks(lo, hi, n=4):
    span = hi - lo
    raw = span / n
    mag = 10 ** int(f"{raw:e}".split("e")[1])
    step = next(s * mag for s in (1, 2, 2.5, 5, 10) if s * mag >= raw)
    start = (int(lo / step) + 1) * step
    ticks = []
    t = start
    while t < hi:
        ticks.append(t)
        t += step
    return ticks


def build_svg(points, levels, cfg, today):
    W, H = 1072, 316
    x0, x1 = 128, 836
    top, bottom = 24, H - 42
    vals = [p["value"] for p in points]
    lo, hi = min(vals + levels), max(vals + levels)
    pad = (hi - lo) * 0.08 or 1
    lo, hi = lo - pad, hi + pad
    sy = lambda v: bottom - (v - lo) / (hi - lo) * (bottom - top)
    sx = lambda i: x0 + i / max(len(points) - 1, 1) * (x1 - x0)
    out = []
    for t in nice_ticks(lo, hi):
        y = sy(t)
        out.append(f'<line class="grid" x1="{x0}" y1="{y:.1f}" x2="{x1}" y2="{y:.1f}"/>')
        out.append(f'<text class="y" x="{x0 - 14}" y="{y + 10:.1f}" text-anchor="end">{fmt(t, cfg["dec"])}</text>')
    out.append(f'<line class="grid" x1="{x0}" y1="{bottom}" x2="{x1}" y2="{bottom}"/>')
    # x labels: first, two interior, last (dedupe)
    idx = sorted({0, len(points) // 3, 2 * len(points) // 3, len(points) - 1})
    seen = []
    for k, i in enumerate(idx):
        lab = tr_time(points[i]["time"], today)[0]
        if lab in seen:
            continue
        seen.append(lab)
        anchor = "start" if k == 0 else "end" if i == len(points) - 1 else "middle"
        out.append(f'<text class="x" x="{sx(i):.1f}" y="{H - 6}" text-anchor="{anchor}">{esc(lab)}</text>')
    path = " ".join(f"{'M' if i == 0 else 'L'}{sx(i):.1f},{sy(v):.1f}" for i, v in enumerate(vals))
    out.append(f'<path class="series" d="{path}"/>')
    # right-gutter labels: level pills + last close, kept inside the plot and >= 46 px apart;
    # a thin leader joins a label to its line when it had to move.
    items = sorted([(sy(v), "level", v) for v in levels] + [(sy(vals[-1]), "last", vals[-1])])
    ys = [max(top + 23, min(bottom - 23, y)) for y, _, _ in items]
    for i in range(1, len(ys)):
        ys[i] = max(ys[i], ys[i - 1] + 46)
    ys[-1] = min(ys[-1], bottom - 23)
    for i in range(len(ys) - 2, -1, -1):
        ys[i] = min(ys[i], ys[i + 1] - 46)
    for (ly, kind, v), y in zip(items, ys):
        txt = f"{fmt(v, cfg['dec'])} {cfg['sym']}".strip()
        if kind == "level":
            out.append(f'<line class="level" x1="{x0}" y1="{ly:.1f}" x2="{x1 + 6}" y2="{ly:.1f}"/>')
            if abs(y - ly) > 3:
                out.append(f'<line class="leader" x1="{x1 + 6}" y1="{ly:.1f}" x2="{x1 + 14}" y2="{y:.1f}"/>')
            w = 22 * len(txt) + 28
            out.append(f'<rect class="pill" x="{x1 + 14}" y="{y - 23:.1f}" width="{w}" height="46" rx="12"/>')
            out.append(f'<text class="pill-t" x="{x1 + 28}" y="{y + 12:.1f}">{esc(txt)}</text>')
        else:
            out.append(f'<circle class="last-dot" cx="{x1:.1f}" cy="{ly:.1f}" r="9"/>')
            if abs(y - ly) > 3:
                out.append(f'<line class="leader last" x1="{x1 + 9}" y1="{ly:.1f}" x2="{x1 + 22}" y2="{y:.1f}"/>')
            out.append(f'<text class="last-t" x="{x1 + 26}" y="{y + 12:.1f}">{esc(txt)}</text>')
    return f'<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">' + "".join(out) + "</svg>"


def first_sentence(q):
    q = q.strip().strip('"“”')
    m = re.match(r"(.+?[.!?…])(\s|$)", q)
    return (m.group(1) if m else q).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--topic", required=True, choices=sorted(TOPICS))
    ap.add_argument("--video", required=True, type=int)
    ap.add_argument("--out", required=True)
    ap.add_argument("--person")
    ap.add_argument("--levels")
    ap.add_argument("--headline")
    ap.add_argument("--hours", type=int, default=2160)
    ap.add_argument("--no-render", action="store_true")
    a = ap.parse_args()
    cfg = TOPICS[a.topic]
    today = dt.date.today()

    rows = [o for o in get(f"{SITE}/inference/topics/{a.topic}/opinions?limit=50&days=14")
            if o["video_id"] == a.video and (not a.person or o["person_name"] == a.person)]
    if len(rows) != 1:
        sys.exit(f"{len(rows)} rows for video {a.video} on {a.topic}; use --person")
    o = rows[0]
    if not (o.get("outlook_explicit") and o.get("outlook") not in (None, "none")):
        sys.exit("not an explicit view (outlook_explicit false or outlook none) — chart not allowed")
    quote = (o.get("outlook_quote_clean") or o.get("outlook_quote") or "").strip().strip('"“”')
    if not quote:
        sys.exit("no quote — chart not allowed")
    headline = (a.headline or first_sentence(quote)).strip().strip('"“”')
    if headline not in quote:
        sys.exit("headline must be a verbatim part of the quote")
    if len(headline) > 130:
        sys.exit(f"headline too long ({len(headline)} chars); pass a shorter sentence with --headline")

    hist = get(f"{SITE}/quotes/{cfg['symbol']}/history?hours={a.hours}")
    pts = hist.get("points") or []
    if len(pts) < 5:
        sys.exit(f"history for {cfg['symbol']} has {len(pts)} points — chart not possible")
    vals = [p["value"] for p in pts]
    if a.levels:
        levels, skipped = [float(x) for x in a.levels.split(",")], []
    elif cfg.get("explicit_levels"):
        sys.exit(f"{a.topic}: pass --levels with the numbers the speaker gave for {cfg['label']}")
    else:
        levels, skipped = parse_levels(o.get("key_levels") or [], cfg, min(vals), max(vals))
    if not levels:
        print("skipped:", skipped)
        sys.exit("no real price level in key_levels — use the card instead")
    if len(levels) > 3:
        sys.exit(f"{len(levels)} levels {levels}: max 3 on a card — pass --levels with the ones in the quote")
    hours = a.hours
    if any(v < min(vals) * 0.85 or v > max(vals) * 1.15 for v in levels) and hours < 8760:
        hist = get(f"{SITE}/quotes/{cfg['symbol']}/history?hours=8760")
        pts, hours = hist.get("points") or pts, 8760
        vals = [p["value"] for p in pts]
    if any(v < min(vals) * 0.7 or v > max(vals) * 1.3 for v in levels):
        sys.exit(f"levels {levels} are far outside the {hours} h range {min(vals)}–{max(vals)} — use the card")

    gran = tr_time(pts[0]["time"], today)[2]
    gran_tr = {"daily": "günlük kapanış", "weekly": "haftalık kapanış", "intraday": "saatlik"}[gran]
    period = {720: "son 30 gün", 2160: "son 3 ay", 8760: "son 1 yıl"}.get(hours, f"son {hours // 24} gün")
    pub = dt.datetime.fromisoformat(o["published_at"])
    date_short = f"{pub.day} {MONTH_TR[pub.month - 1]}"
    date_long = f"{pub.day} {MONTH_TR_LONG[pub.month - 1]} {pub.year}"
    name, channel = o["person_name"], o["channel_name"]
    chan = "YouTube kanalı" if channel.casefold() == name.casefold() else channel
    unit_name = {"usd": "USD", "try": "TL", "pts": "puan"}[cfg["unit"]]
    last_lab = tr_time(pts[-1]["time"], today)[0]
    fetched = dt.datetime.fromisoformat(hist["fetched_at"].replace("Z", "+00:00"))
    fetched_tr = f"{fetched.day} {MONTH_TR_LONG[fetched.month - 1]} {fetched.year}"
    last_txt = f"{fmt(vals[-1], cfg['dec'])} {cfg['sym']}".strip()
    lv_txt = " ve ".join(f"{fmt(v, cfg['dec'])} {cfg['sym']}".strip() for v in sorted(levels))

    body = "\n".join([
        f'<h1 class="{"long" if len(headline) > 95 else ""}">“{esc(headline)}”</h1>',
        f'<div class="who"><b>{esc(name)}</b> · {esc(chan)} · {date_short}</div>',
        f'<div class="chart">{build_svg(pts, levels, cfg, today)}</div>',
        f'<div class="legend"><span><i></i>{cfg["label"]}, {unit_name} · {gran_tr} · {period}</span>'
        f'<span><i class="l"></i>{esc(name)}\'in söylediği seviyeler</span></div>',
    ])
    tpl = TEMPLATE.read_text(encoding="utf-8")
    html = re.sub(r"(<!-- card:start -->).*?(<!-- card:end -->)", lambda m: f"{m.group(1)}\n{body}\n{m.group(2)}",
                  tpl, flags=re.S)
    out = pathlib.Path(a.out)
    out.with_suffix(".html").write_text(html, encoding="utf-8")

    alt = (f"Grafik: {cfg['label']} fiyatı, {period} ({gran_tr}, {unit_name}), kaynak dovizveri.com. "
           f"{name} ({channel} YouTube kanalı, {date_long}) şu seviyeleri söyledi: {lv_txt}. "
           f"Son değer ({fetched_tr} itibarıyla): {last_txt}. Alıntı: “{quote}” Yatırım tavsiyesi değildir.")
    if len(alt) > 1000:
        cut = quote[: len(quote) - (len(alt) - 1000) - 1].rsplit(" ", 1)[0] + "…"
        alt = alt.replace(quote, cut)

    print(f"view: {name} · {channel} · {o['published_at'][:10]} · video {a.video} · outlook {o['outlook']}")
    print(f"headline ({len(headline)}): {headline}")
    print(f"levels used: {lv_txt}; skipped: {skipped}")
    for v in levels:  # the chart states the speaker's level: it must be in their own words
        digits = re.sub(r"\D", "", fmt(v, cfg["dec"]))
        if digits not in re.sub(r"\D", "", quote):
            print(f"WARNING: {fmt(v, cfg['dec'])} is not in the quote — confirm it in the clip passage or drop it (--levels)")
    print(f"series: {cfg['symbol']} {hist['provider']} {len(pts)} pts, {period}, {gran_tr}, "
          f"{tr_time(pts[0]['time'], today)[0]} → {last_lab} = {last_txt} (fetched {hist['fetched_at']})")
    print(f"alt text ({len(alt)}): {alt}")
    print(f"html: {out.with_suffix('.html')}")
    if a.no_render:
        return
    subprocess.run([str(HERE / "render.sh"), str(out.with_suffix(".html")), str(out)], check=True)
    webp = out.with_suffix(".webp")
    for q in (78, 74, 70):  # README target <= 45 KB; never below -q 70
        if webp.stat().st_size <= 45 * 1024:
            break
        subprocess.run(["cwebp", "-quiet", "-q", str(q), "-resize", "1200", "675", str(out.with_suffix(".png")),
                        "-o", str(webp)], check=True)
        print(f"webp re-encoded at q{q}: {webp.stat().st_size} bytes")
    phone = f"""<!doctype html><meta charset="utf-8"><style>
body{{margin:0;width:375px;background:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#0f1419}}
.p{{padding:12px 16px;border-bottom:1px solid #eff3f4}} .h{{font-size:15px;font-weight:700}} .h span{{color:#536471;font-weight:400}}
.t{{font-size:15px;line-height:20px;margin-top:4px}} img{{display:block;border-radius:16px;border:1px solid #cfd9de;margin-top:12px}}
.l{{font-size:11px;color:#536471;margin-top:6px}}</style>
<div class="p"><div class="h">Döviz Veri <span>@dovizveri · 1s</span></div><div class="t">“{esc(headline)}”<br><b>{esc(name)} · {cfg['label']} · Görüş özeti</b></div>
<img src="{out.name}.png" width="295"><div class="l">feed (~295 px)</div></div>
<div class="p"><img src="{out.name}.png" width="343"><div class="l">post page (~343 px)</div></div>"""
    ph = pathlib.Path(f"{out}-phone.html")
    ph.write_text(phone, encoding="utf-8")
    subprocess.run([str(HERE / "render.sh"), str(ph), f"{out}-phone", "375", "640"], check=True)


if __name__ == "__main__":
    main()
