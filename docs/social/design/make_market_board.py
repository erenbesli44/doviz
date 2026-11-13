#!/usr/bin/env python3
"""Render the US "market board" set (3 images, 1200x1350) for an X multi-image post.

Usage:
  python3 -I docs/social/design/make_market_board.py <data.json> <out_dir> \
      --time "13 Kas 19:21 TR" --session "seans içi"      # or --session "kapanış"
  options: --no-render (write HTML only)

data.json (from the Yahoo Finance fetch): {"indices": [...], "sectors": [...], "stocks": [...]},
each item {sym, last, prev, pct, cap, name?}. Writes in <out_dir>:
  mb-1-ozet.*, mb-2-sirketler.*, mb-3-sektorler.*  (.html, .png 2x, .webp 1200x1350)
  mb-phone.html/.png (375 px mockup: X 3-image grid + opened images), mb-alt.txt (alt texts)
Numbers are printed exactly as in data.json, rounded to 2 decimals with a Turkish decimal comma.
Colour shows only the sign (|%| <= 0.10 is grey); no arrows. Stdlib only; renders via render.sh.
"""
import argparse
import html
import json
import pathlib
import subprocess

HERE = pathlib.Path(__file__).resolve().parent
W, H = 1200, 1350
FLAT = 0.10        # |pct| <= FLAT -> grey
CLAMP = 6.0        # treemap colour clamp
MINUS = "−"

BULL, BEAR, NEUTRAL = "#15703D", "#B83227", "#4B5563"
TXT = "#16181B"

CSS = """
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#FAFAF7;--surface:#FFFFFF;--border:#E3E1DA;--text:#16181B;--muted:#555A62;--accent:#1F3A8A}
html,body{width:1200px;height:1350px;overflow:hidden}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif;
 display:flex;flex-direction:column;font-variant-numeric:tabular-nums}
.top{padding:40px 48px 0}
.brand{display:flex;justify-content:space-between;align-items:center;font-size:34px;font-weight:700;color:var(--accent);letter-spacing:.06em}
.brand span{color:var(--muted);font-weight:600;letter-spacing:0}
h1{margin-top:14px;font-family:Charter,"Iowan Old Style",Georgia,serif;font-weight:600;font-size:60px;line-height:1.1;letter-spacing:-.01em}
.when{margin-top:10px;font-size:34px;color:var(--muted)}
h2{margin-top:26px;padding-top:22px;border-top:2px solid var(--border);font-size:40px;font-weight:700}
h2 small{font-size:34px;font-weight:500;color:var(--muted)}
main{flex:1;position:relative;margin:22px 48px 24px}
.bar{display:flex;justify-content:space-between;align-items:center;background:var(--accent);color:#fff;
 padding:22px 48px;font-size:34px;font-weight:600}
.bar span{opacity:.92;font-weight:500}
/* 1 - summary */
.row{display:flex;justify-content:space-between;align-items:center;background:var(--surface);border:2px solid var(--border);
 border-radius:20px;padding:0 40px;height:208px;margin-bottom:20px}
.row .n{font-size:44px;font-weight:700}
.row .n small{display:block;font-size:34px;font-weight:500;color:var(--muted);margin-top:4px}
.row .v{text-align:right}
.row .lv{font-size:64px;font-weight:700;letter-spacing:-.01em}
.row .pc{display:inline-block;margin-top:6px;font-size:50px;font-weight:700;padding:2px 20px;border-radius:14px}
/* 2 - treemap */
.tile{position:absolute;overflow:hidden;letter-spacing:-.01em;display:flex;flex-direction:column;justify-content:center;align-items:center;
 border:2px solid var(--bg);border-radius:8px;line-height:1.08;text-align:center}
.tile b{font-weight:800}
.also{position:absolute;left:0;right:0;bottom:110px;font-size:34px;color:var(--muted);white-space:nowrap}
.legend{position:absolute;left:0;right:0;bottom:0;height:96px}
.grad{height:26px;border-radius:13px;margin:0 70px}
.lab{display:flex;justify-content:space-between;margin-top:10px;font-size:34px;color:var(--muted)}
/* 3 - sectors */
.srow{position:absolute;left:0;right:0;height:72px;display:flex;align-items:center}
.srow .sn{width:380px;font-size:36px;font-weight:600;white-space:nowrap}
.sbar{position:absolute;top:12px;height:48px;border-radius:6px}
.sval{position:absolute;top:0;height:72px;display:flex;align-items:center;font-size:36px;font-weight:700;white-space:nowrap}
.axis{position:absolute;top:0;width:3px;background:#9AA1AB}
"""


def num(v, dec=2):
    s = f"{abs(v):,.{dec}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return (MINUS if v < 0 else "") + s


def pct(v):
    """Turkish style: %+0,59 / %−1,12 / %0,00."""
    s = f"{abs(v):.2f}".replace(".", ",")
    if round(v, 2) == 0:
        return "%0,00"
    return "%" + ("+" if v > 0 else MINUS) + s


def sign_col(v):
    if abs(v) <= FLAT:
        return NEUTRAL, "#ECEDEE"
    return (BULL, "#E4F4EA") if v > 0 else (BEAR, "#FBE6E2")


def hex2rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def rgb2hex(c):
    return "#%02X%02X%02X" % tuple(round(x) for x in c)


def lum(c):
    def ch(x):
        x /= 255
        return x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(x) for x in c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


# diverging scale: grey at 0, light tint at the flat edge, strong at +-CLAMP
GREY = hex2rgb("#D5D8DC")
STOPS = {1: (hex2rgb("#BFE3CC"), hex2rgb("#0D5A2E")), -1: (hex2rgb("#F3C6BF"), hex2rgb("#8E2118"))}


def heat(v):
    if abs(v) <= FLAT:
        c = GREY
    else:
        lo, hi = STOPS[1 if v > 0 else -1]
        t = min(abs(v), CLAMP) / CLAMP
        c = tuple(a + (b - a) * t for a, b in zip(lo, hi))
    white, dark = (255, 255, 255), hex2rgb(TXT)
    fg = "#FFFFFF" if contrast(c, white) >= contrast(c, dark) else TXT
    return rgb2hex(c), fg, max(contrast(c, white), contrast(c, dark))


def squarify(items, x, y, w, h):
    """items: list of (value, payload) sorted desc; returns list of (payload, x, y, w, h)."""
    out = []
    items = list(items)
    total = sum(v for v, _ in items)
    scale = w * h / total
    vals = [(v * scale, p) for v, p in items]

    def worst(row, side):
        s = sum(a for a, _ in row)
        return max(max(side * side * a / (s * s), (s * s) / (side * side * a)) for a, _ in row)

    while vals:
        side = min(w, h)
        row = [vals.pop(0)]
        while vals and worst(row + [vals[0]], side) <= worst(row, side):
            row.append(vals.pop(0))
        s = sum(a for a, _ in row)
        if w >= h:   # lay row as a column on the left
            cw = s / h
            cy = y
            for a, p in row:
                out.append((p, x, cy, cw, a / cw))
                cy += a / cw
            x, w = x + cw, w - cw
        else:        # lay row along the top
            rh = s / w
            cx = x
            for a, p in row:
                out.append((p, cx, y, a / rh, rh))
                cx += a / rh
            y, h = y + rh, h - rh
    return out


def page(idx, panel, body, when):
    return f"""<!doctype html><html lang="tr"><meta charset="utf-8"><style>{CSS}</style><body>
<div class="top"><div class="brand">DÖVİZ VERİ<span>{idx}/3</span></div>
<h1>ABD borsaları · Günün tablosu</h1><div class="when">{html.escape(when)}</div>
<h2>{panel}</h2></div>
<main>{body}</main>
<div class="bar"><b>dovizveri.com · Kaynak: Yahoo Finance</b><span>Yatırım tavsiyesi değildir.</span></div>
</body></html>"""


def board_summary(d, when):
    names = {"^GSPC": "S&P 500", "^NDX": "Nasdaq 100", "^DJI": "Dow Jones", "^VIX": "VIX"}
    subs = {"^GSPC": "500 büyük şirket", "^NDX": "100 teknoloji ağırlıklı şirket",
            "^DJI": "30 büyük şirket", "^VIX": "oynaklık endeksi"}
    rows = []
    for i in d["indices"]:
        fg, bg = sign_col(i["pct"])
        rows.append(f'<div class="row"><div class="n">{names.get(i["sym"], i.get("name", i["sym"]))}'
                    f'<small>{subs.get(i["sym"], "")}</small></div>'
                    f'<div class="v"><div class="lv">{num(i["last"])}</div>'
                    f'<div class="pc" style="color:{fg};background:{bg}">{pct(i["pct"])}</div></div></div>')
    return page(1, "Endeksler <small>· seviye ve günlük değişim</small>", "".join(rows), when)


def board_treemap(d, when):
    mw, mh = W - 96, 1350 - 330 - 24 - 84 - 22   # main area (approx; legend at bottom)
    legend_h = 96 + 64   # legend + 'Ayrıca' line
    stocks = sorted(d["stocks"], key=lambda s: -s["cap"])
    rects = squarify([(s["cap"], s) for s in stocks], 0, 0, mw, mh - legend_h)
    tiles, labelled, unlabelled = [], [], []
    for s, x, y, w, h in rects:
        bg, fg, cr = heat(s["pct"])
        t, p = s["sym"], pct(s["pct"])
        inner_w, inner_h = w - 24, h - 14
        # glyph widths (Inter-like, bold): ~0.66 em per ticker char, ~0.60 em per % char
        fs = min(76, inner_h / 2.3, inner_w / (0.72 * len(t)))
        ps = max(34, min(fs * .82, inner_w / (0.63 * len(p))))   # % line shrinks first, never < 34 px
        fits = fs >= 34 and 0.63 * len(p) * ps <= inner_w and (fs + ps) * 1.08 <= inner_h
        lab = ""
        if fits:
            lab = (f'<b style="font-size:{fs:.0f}px">{t}</b>'
                   f'<span style="font-size:{ps:.0f}px;font-weight:600">{p}</span>')
            labelled.append((t, round(fs), round(ps), round(cr, 2)))
        else:
            unlabelled.append(t)
        tiles.append(f'<div class="tile" style="left:{x:.1f}px;top:{y:.1f}px;width:{w:.1f}px;height:{h:.1f}px;'
                     f'background:{bg};color:{fg}">{lab}</div>')
    stops = ", ".join(f"{heat(v)[0]} {(v + CLAMP) / (2 * CLAMP) * 100:.1f}%"
                      for v in (-6, -4.5, -3, -1.5, -0.11, 0, 0.11, 1.5, 3, 4.5, 6))
    legend = (f'<div class="legend"><div class="grad" style="background:linear-gradient(90deg,{stops})"></div>'
              f'<div class="lab"><span>%{MINUS}6 ve altı</span><span>0</span><span>%+6 ve üstü</span></div></div>')
    # biggest movers among the colour-only tiles get one text line (max 3, |%| >= 1)
    small = sorted((x for x in d["stocks"] if x["sym"] in unlabelled and abs(x["pct"]) >= 1),
                   key=lambda x: -abs(x["pct"]))[:3]
    also = ""
    if small:
        items = " · ".join(f'<b style="color:{sign_col(x["pct"])[0]}">{x["sym"]} {pct(x["pct"])}</b>' for x in small)
        also = f'<div class="also">Küçük kutulardan: {items}</div>'
    body = "".join(tiles) + also + legend
    return page(2, "Büyük şirketler <small>· alan = piyasa değeri</small>", body, when), labelled, unlabelled, small


def board_sectors(d, when):
    secs = sorted(d["sectors"], key=lambda s: -s["pct"])
    lo = min(0.0, min(s["pct"] for s in secs))
    hi = max(0.0, max(s["pct"] for s in secs))
    x0, x1 = 400, W - 96 - 10       # bar zone incl. labels
    label_w = 150                    # room for value text on each side
    zone_l, zone_r = x0 + (label_w if lo < 0 else 0), x1 - (label_w if hi > 0 else 0)
    span = (hi - lo) or 1
    ppu = (zone_r - zone_l) / span
    zx = zone_l - lo * ppu
    rows, step = [], 82
    for k, s in enumerate(secs):
        fg, _ = sign_col(s["pct"])
        y = k * step
        v = s["pct"]
        bw = max(abs(v) * ppu, 4)
        bx = zx if v >= 0 else zx - bw
        if v >= 0:
            val = f'<div class="sval" style="left:{zx + bw + 12:.0f}px;color:{fg}">{pct(v)}</div>'
        else:
            val = f'<div class="sval" style="right:{1104 - (zx - bw - 12):.0f}px;color:{fg}">{pct(v)}</div>'
        rows.append(f'<div class="srow" style="top:{y}px"><div class="sn">{html.escape(s["name"])}</div>'
                    f'<div class="sbar" style="left:{bx:.0f}px;width:{bw:.0f}px;background:{fg}"></div>{val}</div>')
    axis = f'<div class="axis" style="left:{zx - 1:.0f}px;height:{len(secs) * step - 10}px"></div>'
    return page(3, "Sektörler <small>· SPDR sektör fonları, günlük değişim</small>", axis + "".join(rows), when)


def alt_texts(d, when):
    names = {"^GSPC": "S&P 500", "^NDX": "Nasdaq 100", "^DJI": "Dow Jones", "^VIX": "VIX (oynaklık endeksi)"}
    tail = " Kaynak: Yahoo Finance, dovizveri.com. Yatırım tavsiyesi değildir."
    a1 = (f"Tablo 1/3, ABD borsaları, günün tablosu, {when}. Endeksler, seviye ve günlük değişim: "
          + "; ".join(f"{names[i['sym']]} {num(i['last'])}, {pct(i['pct'])}" for i in d["indices"]) + "." + tail)
    st = sorted(d["stocks"], key=lambda s: -s["cap"])
    a2 = (f"Isı haritası 2/3, 30 büyük ABD şirketi, kutu alanı piyasa değerine göre, renk günlük değişime göre "
          f"(kırmızı düşüş, yeşil yükseliş, gri yatay), {when}. Piyasa değeri sırasıyla: "
          + "; ".join(f"{s['sym']} {pct(s['pct'])}" for s in st) + "." + tail)
    sc = sorted(d["sectors"], key=lambda s: -s["pct"])
    a3 = (f"Çubuk grafik 3/3, ABD sektörleri (SPDR sektör fonları), günlük değişim, {when}, büyükten küçüğe: "
          + "; ".join(f"{s['name']}, {s['sym']}: {pct(s['pct'])}" for s in sc) + "." + tail)
    return [a.replace(MINUS, "-") for a in (a1, a2, a3)]


def phone(out, names):
    grid = (f'<div class="g"><img class="a" src="{names[0]}.png"><div class="r">'
            f'<img src="{names[1]}.png"><img src="{names[2]}.png"></div></div>')
    opened = "".join(f'<img class="o" src="{n}.png" width="343">' for n in names)
    doc = f"""<!doctype html><meta charset="utf-8"><style>
body{{margin:0;width:375px;background:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#0f1419}}
.p{{padding:12px 16px;border-bottom:1px solid #eff3f4}} .h{{font-size:15px;font-weight:700}} .h span{{color:#536471;font-weight:400}}
.t{{font-size:15px;line-height:20px;margin-top:4px}} .l{{font-size:11px;color:#536471;margin-top:6px}}
.g{{display:flex;gap:2px;width:295px;height:166px;margin-top:12px;border-radius:16px;overflow:hidden;border:1px solid #cfd9de}}
.g img{{object-fit:cover;display:block}} .g .a{{width:146px;height:166px}} .r{{display:flex;flex-direction:column;gap:2px}}
.r img{{width:147px;height:82px}} .o{{display:block;border-radius:12px;border:1px solid #cfd9de;margin-top:10px}}</style>
<div class="p"><div class="h">Döviz Veri <span>@dovizveri · 1s</span></div>
<div class="t">ABD borsaları · Günün tablosu</div>{grid}<div class="l">feed grid (~295 px, X crops each image)</div></div>
<div class="p">{opened}<div class="l">opened images (~343 px)</div></div>"""
    p = out / "mb-phone.html"
    p.write_text(doc, encoding="utf-8")
    subprocess.run([str(HERE / "render.sh"), str(p), str(out / "mb-phone"), "375", "1500"], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("data")
    ap.add_argument("out_dir")
    ap.add_argument("--time", required=True, help='e.g. "13 Kas 19:21 TR"')
    ap.add_argument("--session", required=True, choices=["seans içi", "kapanış"])
    ap.add_argument("--no-render", action="store_true")
    a = ap.parse_args()
    d = json.loads(pathlib.Path(a.data).read_text(encoding="utf-8"))
    out = pathlib.Path(a.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    when = f"{a.time} · " + ("seans içi, gecikmeli" if a.session == "seans içi" else "kapanış")

    tm, labelled, unlabelled, small = board_treemap(d, when)
    pages = {"mb-1-ozet": board_summary(d, when), "mb-2-sirketler": tm, "mb-3-sektorler": board_sectors(d, when)}
    for name, doc in pages.items():
        (out / f"{name}.html").write_text(doc, encoding="utf-8")
    print("treemap labels (ticker, px, contrast):", labelled)
    print("colour-only tiles:", unlabelled)
    print("listed under the map:", [x["sym"] for x in small])
    alts = alt_texts(d, when)
    (out / "mb-alt.txt").write_text("\n\n".join(alts) + "\n", encoding="utf-8")
    for k, t in enumerate(alts, 1):
        print(f"alt {k} ({len(t)} chars): {t}")
        if len(t) > 1000:
            print(f"WARNING: alt {k} over 1000 chars")
    if a.no_render:
        return
    for name in pages:
        subprocess.run([str(HERE / "render.sh"), str(out / f"{name}.html"), str(out / name), str(W), str(H)],
                       check=True)
        webp = out / f"{name}.webp"
        if webp.stat().st_size > 1024 * 1024:
            print(f"WARNING: {webp} over 1 MB")
    phone(out, list(pages))


if __name__ == "__main__":
    main()
