"""Generate @dovizveri card HTML (outlook + commentator) from specs. Data copied from the live site 2026-10-24."""
import html
import json
import pathlib
import sys

OUT = pathlib.Path(sys.argv[1])

CSS = """
:root { --bg:#FAFAF7; --surface:#FFFFFF; --border:#E3E1DA; --text:#16181B; --muted:#555A62;
  --accent:#1F3A8A; --bull:#15703D; --bull-bg:#E4F4EA; --bear:#B83227; --bear-bg:#FBE6E2;
  --neutral:#4B5563; --neutral-bg:#ECEDEE; --warn:#8A5A00; --warn-bg:#FFF4DB; }
* { box-sizing:border-box; margin:0; }
html, body { width:1200px; height:675px; }
body { background:var(--bg); color:var(--text); font-family:-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
  padding:44px 56px 36px; display:flex; flex-direction:column; }
header { display:flex; justify-content:space-between; align-items:center; font-size:17px; color:var(--muted); }
.brand { font-weight:700; color:var(--accent); letter-spacing:.08em; }
.brand span { font-weight:500; color:var(--muted); letter-spacing:.02em; }
h1 { font-family:Charter, "Iowan Old Style", Georgia, serif; font-weight:600; font-size:46px; line-height:1.12; letter-spacing:-.01em; }
h1 em { font-style:normal; }
.up { color:var(--bull); } .down { color:var(--bear); } .flat { color:var(--neutral); }
.sub { margin-top:16px; font-size:18px; line-height:1.45; color:var(--muted); }
.bar { display:flex; height:18px; border-radius:9px; overflow:hidden; margin-top:30px; gap:3px; }
.bar .up { background:var(--bull); } .bar .flat { background:#9AA1AB; } .bar .down { background:var(--bear); }
.legend { display:flex; gap:22px; margin-top:12px; font-size:17px; font-weight:600; }
.price { margin-top:28px; font-size:16px; color:var(--muted); }
.price b { color:var(--text); font-size:20px; font-variant-numeric:tabular-nums; }
.pill { font-size:16px; font-weight:600; padding:6px 12px; border-radius:999px; white-space:nowrap; }
.pill.up { color:var(--bull); background:var(--bull-bg); }
.pill.down { color:var(--bear); background:var(--bear-bg); }
.pill.flat { color:var(--neutral); background:var(--neutral-bg); }
footer { display:flex; justify-content:space-between; margin-top:22px; font-size:16px; color:var(--muted); }
footer b { color:var(--accent); font-weight:600; }
/* outlook */
.grid { flex:1; display:grid; grid-template-columns:440px 1fr; gap:48px; margin-top:30px; }
ul { list-style:none; padding:0; background:var(--surface); border:1px solid var(--border); border-radius:14px;
  display:flex; flex-direction:column; }
li { display:grid; grid-template-columns:1fr auto 74px; align-items:center; gap:14px; padding:0 22px; flex:1;
  border-top:1px solid var(--border); }
li:first-child { border-top:0; }
.name { font-size:20px; font-weight:600; }
.chg { display:block; margin-top:3px; font-size:14px; font-weight:600; color:var(--warn); }
.date { font-size:15px; color:var(--muted); text-align:right; font-variant-numeric:tabular-nums; }
/* commentator */
.c-main { flex:1; display:grid; grid-template-columns:1fr 330px; gap:44px; margin-top:28px; }
.topic { display:inline-block; font-size:15px; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
  color:var(--accent); background:rgba(31,58,138,.08); padding:6px 12px; border-radius:6px; }
.who { margin-top:18px; font-size:34px; font-weight:700; letter-spacing:-.01em; }
.view { display:flex; align-items:center; gap:14px; margin-top:14px; flex-wrap:wrap; }
.was { font-size:16px; font-weight:600; color:var(--warn); background:var(--warn-bg); padding:6px 12px; border-radius:999px; }
blockquote { margin-top:26px; font-family:Charter, "Iowan Old Style", Georgia, serif; font-weight:600; font-size:34px;
  line-height:1.28; border-left:5px solid var(--accent); padding-left:24px; }
.meta { margin-top:20px; font-size:17px; color:var(--muted); }
.meta b { color:var(--text); }
aside { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:26px 26px 22px;
  display:flex; flex-direction:column; }
aside h2 { font-size:15px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); }
aside .big { margin-top:14px; font-family:Charter, "Iowan Old Style", Georgia, serif; font-weight:600; font-size:28px; line-height:1.2; }
aside .bar { margin-top:20px; }
aside .legend { flex-direction:column; gap:8px; margin-top:16px; }
.c-main > section { display:flex; flex-direction:column; justify-content:center; align-items:flex-start; }
.tl { display:flex; align-items:center; gap:16px; margin-top:28px; }
.tl .step { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:12px 18px; }
.tl .step small { display:block; font-size:14px; color:var(--muted); margin-bottom:6px; }
.tl .step span { font-size:19px; font-weight:700; }
.tl .arrow { font-size:26px; color:var(--muted); }
.play { margin-top:auto; padding-top:18px; border-top:1px solid var(--border); font-size:16px; color:var(--muted); line-height:1.4; }
.play b { color:var(--text); }
"""

HEAD = f'<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>{CSS}</style></head><body>'
# In-page (X composer) rendering: same CSS scoped to .page, drawn via SVG foreignObject.
PAGE_CSS = CSS.replace("html, body { width:1200px; height:675px; }", "").replace("body {", ".page { width:1200px; height:675px;")
ARROW = {"up": "↑ Yükseliş", "down": "↓ Düşüş", "flat": "→ Yatay"}
WORD = {"up": "yükseliş", "down": "düşüş", "flat": "yatay"}
e = html.escape


def header(date):
    return f'<header><div class="brand">DÖVİZ VERİ <span>· Kim ne bekliyor?</span></div><div>{e(date)}</div></header>'


def bar(counts):
    segs = "".join(f'<div class="{k}" style="flex:{v}"></div>' for k, v in counts.items() if v)
    legend = "".join(f'<span class="{k}">{ARROW[k].split()[0]} {v} {WORD[k]}</span>' for k, v in counts.items() if v)
    return f'<div class="bar">{segs}</div><div class="legend">{legend}</div>'


def outlook(c):
    rows = ""
    for r in c["rows"]:
        chg = f'<span class="chg">Değişti: {WORD[r["was"]]} → {WORD[r["dir"]]}</span>' if r.get("was") else ""
        rows += (f'<li><div class="name">{e(r["name"])}{chg}</div>'
                 f'<span class="pill {r["dir"]}">{ARROW[r["dir"]]}</span><span class="date">{e(r["date"])}</span></li>')
    return (HEAD + header(c["date"]) + '<div class="grid"><section>'
            f'<h1>{c["title_html"]}</h1><p class="sub">{e(c["sub"])}</p>{bar(c["counts"])}'
            f'<p class="price">{c["price_html"]}</p></section><ul>{rows}</ul></div>'
            f'<footer><span><b>dovizveri.com</b>/piyasa/{e(c["slug"])} · kaynak: yorumcuların YouTube videoları</span>'
            '<span>Yatırım tavsiyesi değildir.</span></footer></body></html>')


def commentator(c):
    was = '<span class="was">Görüşünü değiştirdi</span>' if c.get("was") else ""
    horizon = f' · vade: <b>{e(c["horizon"])}</b>' if c.get("horizon") else ""
    tl = (f'<div class="tl"><div class="step"><small>Önceki görüş · {e(c["was_date"])}</small>'
          f'<span class="{c["was"]}">{ARROW[c["was"]]}</span></div><div class="arrow">→</div>'
          f'<div class="step"><small>Şimdi · {e(c["video_date"])}</small>'
          f'<span class="{c["dir"]}">{ARROW[c["dir"]]}</span></div></div>') if c.get("was") else ""
    return (HEAD + header(c["date"]) + '<div class="c-main"><section>'
            f'<span class="topic">{e(c["topic"])}</span><div class="who">{e(c["name"])}</div>'
            f'<div class="view"><span class="pill {c["dir"]}">{ARROW[c["dir"]]} bekliyor</span>{was}</div>'
            f'<blockquote>“{e(c["quote"])}”</blockquote>'
            f'<p class="meta">{e(c["video_date"])} videosu, dakika <b>{e(c["ts"])}</b>{horizon}</p>{tl}</section>'
            f'<aside><h2>{e(c["topic"])} · son görüşler</h2><div class="big">{e(c["peers_line"])}</div>'
            f'{bar(c["counts"])}<p class="play">▶ Yorumun geçtiği dakikaya gitmek için <b>gönderideki video linkine</b> dokunun.</p></aside></div>'
            f'<footer><span><b>dovizveri.com</b>/piyasa/{e(c["slug"])} · kaynak: {e(c["name"])} YouTube videosu</span>'
            '<span>Yatırım tavsiyesi değildir.</span></footer></body></html>')


specs = json.loads(pathlib.Path(sys.argv[2]).read_text())
fragments = {"css": PAGE_CSS}
for s in specs:
    page = outlook(s) if s["kind"] == "outlook" else commentator(s)
    (OUT / f'{s["id"]}.html').write_text(page)
    fragments[s["id"]] = page.split("<body>", 1)[1].rsplit("</body>", 1)[0]
    print(s["id"])
(OUT / "fragments.json").write_text(json.dumps(fragments, ensure_ascii=False))
