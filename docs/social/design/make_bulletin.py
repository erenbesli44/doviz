"""Daily bulletin clip for X (prototype 2026-11-10): the day's views in one video, no voice-over.

Usage:
  uv run --with pillow python3 -I make_bulletin.py <spec.json> <out.mp4>
spec.json:
  {"date": "10 Kasım 2026", "title": "Bugün kim ne dedi?",
   "segments": [{"clip", "topic", "chip", "name", "meta", "quote", "source", "avatar", "initials"}]}
  clip     raw cut (no caption bar), whole sentences, both cuts in a pause (clip_bounds.py)
  topic    title of the topic card, e.g. "Altın"; chip = the label on the segment ("Altın", "Ana fikir")
  other keys as in make_banner_clip.py
Structure: opening card with the rundown -> per segment: topic card -> segment -> closing card.
The top strip (brand, date, progress bar) and the footer are the same pixels in every part, so the
soft wipe between parts only moves the middle of the frame.
Writes <out.mp4> and <out>-sheet.png (one frame per part). Needs ffmpeg and Pillow.
"""

import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw

from make_banner_clip import BG, INK, MUTED, NAVY, SANS, SERIF, WHITE, avatar, font, wrap

W, H, FPS = 1080, 1350, 30
STRIP_H, FOOT_H, VIDEO_H = 104, 136, 608
VIDEO_Y = H - FOOT_H - VIDEO_H
M = 48  # side margin
BAR_Y, BAR_H, BAR_GAP = 22, 6, 8
TRACK, SOFT = "#5C6FA8", "#C9D3EE"  # progress track (not yet played), secondary text on navy
XF = 0.4  # wipe length between parts; segments carry XF of frozen video on both ends
T_OPEN, T_TOPIC, T_CLOSE = 3.2, 1.5, 3.0


def bar_rects(n: int) -> list[tuple[int, int]]:
    bw = (W - 2 * M - (n - 1) * BAR_GAP) / n
    return [(round(M + i * (bw + BAR_GAP)), round(M + i * (bw + BAR_GAP) + bw)) for i in range(n)]


def frame(spec: dict, played: int, hole: int | None = None, source: str = "") -> Image.Image:
    """Top strip + footer. `played` bars are white; bar `hole` is left transparent (animated)."""
    im = Image.new("RGBA", (W, H), BG)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, STRIP_H), fill=NAVY)
    for i, (x0, x1) in enumerate(bar_rects(len(spec["segments"]))):
        fill = (0, 0, 0, 0) if i == hole else (WHITE if i < played else TRACK)
        d.rectangle((x0, BAR_Y, x1, BAR_Y + BAR_H), fill=fill)
    d.text((M, 66), "dovizveri", font=font(SANS, 34, 1), fill=WHITE, anchor="lm")
    bx = M + d.textlength("dovizveri", font=font(SANS, 34, 1))
    d.text((bx, 66), "  ·  Günün bülteni", font=font(SANS, 34), fill=WHITE, anchor="lm")
    d.text((W - M, 66), spec["date"], font=font(SANS, 30), fill=SOFT, anchor="rm")
    d.rectangle((0, H - FOOT_H, W, H), fill=NAVY)
    y1, y2 = H - FOOT_H + 42, H - FOOT_H + 92
    d.text((M, y1), "dovizveri.com", font=font(SANS, 34, 1), fill=WHITE, anchor="lm")
    d.text((W - M, y1), "Yatırım tavsiyesi değildir.", font=font(SANS, 34), fill=WHITE, anchor="rm")
    d.text((M, y2), source, font=font(SANS, 30), fill=SOFT, anchor="lm")
    return im


def chip(d: ImageDraw.ImageDraw, right: int, cy: int, text: str, size: int = 34) -> None:
    f = font(SANS, size, 1)
    cw = d.textlength(text, font=f) + 44
    d.rounded_rectangle((right - cw, cy - 26, right, cy + 26), radius=26, fill=NAVY)
    d.text((right - cw / 2, cy), text, font=f, fill=WHITE, anchor="mm")


def opening(spec: dict) -> Image.Image:
    im = frame(spec, 0, source="Kaynak: her bölümde belirtilen YouTube yayını")
    d = ImageDraw.Draw(im)
    d.text((M, 250), spec["title"], font=font(SERIF, 92, 3), fill=INK, anchor="lm")
    d.text((M, 340), f"{spec['date']}  ·  {len(spec['segments'])} görüş, tek video",
           font=font(SANS, 36), fill=MUTED, anchor="lm")
    d.rectangle((M, 400, W - M, 402), fill="#D9D9D2")
    rows = spec["segments"]
    step = min(190, (H - FOOT_H - 440) // len(rows))
    for i, s in enumerate(rows):
        cy = 440 + i * step + step // 2
        d.text((M, cy), str(i + 1), font=font(SANS, 56, 1), fill=NAVY, anchor="lm")
        d.text((M + 70, cy - 24), s["topic"], font=font(SANS, 46, 1), fill=INK, anchor="lm")
        d.text((M + 70, cy + 30), f"{s['name']}  ·  {s['meta'].split(' · ')[0]}",
               font=font(SANS, 32), fill=MUTED, anchor="lm")
    return im


def topic_card(spec: dict, i: int) -> Image.Image:
    s = spec["segments"][i]
    im = frame(spec, i, source=s["source"])
    d = ImageDraw.Draw(im)
    d.rectangle((0, STRIP_H, W, H - FOOT_H), fill=NAVY)
    d.rectangle((0, STRIP_H, W, STRIP_H + 2), fill="#31499A")  # hairline under the strip
    d.rectangle((0, H - FOOT_H - 2, W, H - FOOT_H), fill="#31499A")
    d.text((M, 470), f"{i + 1} / {len(spec['segments'])}", font=font(SANS, 40, 1), fill=SOFT,
           anchor="lm")
    size = 132
    while d.textlength(s["topic"], font=font(SANS, size, 1)) > W - 2 * M:
        size -= 6
    d.text((M, 590), s["topic"], font=font(SANS, size, 1), fill=WHITE, anchor="lm")
    d.rectangle((M, 690, M + 120, 696), fill=WHITE)
    im.alpha_composite(avatar(s, 112), (M, 750))
    d.text((M + 140, 786), s["name"], font=font(SANS, 52, 1), fill=WHITE, anchor="lm")
    d.text((M + 140, 842), s["meta"], font=font(SANS, 32), fill=SOFT, anchor="lm")
    return im


def segment_ui(spec: dict, i: int) -> Image.Image:
    """Segment frame with transparent holes for the video and for the running progress bar."""
    s = spec["segments"][i]
    im = frame(spec, i, hole=i, source=s["source"])
    d = ImageDraw.Draw(im)
    top = STRIP_H + 36
    im.alpha_composite(avatar(s, 120), (M, top))
    x = M + 120 + 28
    d.text((x, top + 38), s["name"], font=font(SANS, 60, 1), fill=INK, anchor="lm")
    d.text((x, top + 96), s["meta"], font=font(SANS, 34), fill=MUTED, anchor="lm")
    chip(d, W - M, top + 38, s["chip"])
    # Lead line, centred in the space between the name block and the video.
    left, width = M + 30, W - 2 * M - 30
    a, b = top + 120 + 24, VIDEO_Y - 24
    for size in range(64, 39, -2):
        fq = font(SERIF, size)
        lines = wrap(d, f"“{s['quote']}”", fq, width)
        lh = int(size * 1.25)
        if len(lines) * lh <= b - a:
            break
    else:
        sys.exit(f"segment {i + 1}: the quote does not fit, shorten it")
    y = a + (b - a - len(lines) * lh) // 2
    d.rectangle((M, y + 8, M + 10, y + len(lines) * lh - 8), fill=NAVY)
    for k, line in enumerate(lines):
        d.text((left, y + k * lh), line, font=fq, fill=INK)
    d.rectangle((0, VIDEO_Y, W, VIDEO_Y + VIDEO_H), fill=(0, 0, 0, 0))
    return im


def closing(spec: dict) -> Image.Image:
    n = len(spec["segments"])
    im = frame(spec, n, source="Kaynak: her bölümde belirtilen YouTube yayını")
    d = ImageDraw.Draw(im)
    d.rectangle((0, STRIP_H, W, H - FOOT_H), fill=NAVY)
    d.text((M, 520), "Kim ne bekliyor?", font=font(SERIF, 92, 3), fill=WHITE, anchor="lm")
    d.text((M, 620), "Görüşlerin tamamı ve önceki görüşlerle", font=font(SANS, 40), fill=SOFT,
           anchor="lm")
    d.text((M, 674), "karşılaştırması:", font=font(SANS, 40), fill=SOFT, anchor="lm")
    d.text((M, 790), "dovizveri.com", font=font(SANS, 96, 1), fill=WHITE, anchor="lm")
    return im


def ff(*args: str) -> None:
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


ENC = ["-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(FPS),
       "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2"]


def still(png: Path, dur: float, out: Path) -> None:
    ff("-loop", "1", "-t", f"{dur}", "-i", str(png), "-f", "lavfi", "-t", f"{dur}", "-i",
       "anullsrc=r=44100:cl=stereo", *ENC, "-shortest", str(out))


def duration(path: str) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
                        "csv=p=0", path], capture_output=True, text=True, check=True)
    return float(r.stdout)


def segment(spec: dict, i: int, ui: Path, white: Path, out: Path) -> float:
    clip = spec["segments"][i]["clip"]
    dur = duration(clip)
    total = dur + 2 * XF
    x0, x1 = bar_rects(len(spec["segments"]))[i]
    bw = x1 - x0
    ff("-f", "lavfi", "-t", f"{total}", "-i", f"color=c={TRACK}:s={W}x{H}:r={FPS}",
       "-loop", "1", "-t", f"{total}", "-i", str(white), "-i", clip,
       "-loop", "1", "-t", f"{total}", "-i", str(ui), "-filter_complex",
       f"[1:v]scale={bw}:{BAR_H}[bar];"
       f"[2:v]scale={W}:{VIDEO_H}:force_original_aspect_ratio=decrease,"
       f"pad={W}:{VIDEO_H}:(ow-iw)/2:(oh-ih)/2:black,fps={FPS},"
       f"tpad=start_duration={XF}:start_mode=clone:stop_duration={XF}:stop_mode=clone[v];"
       f"[0:v][bar]overlay=x='{x0}-{bw}+{bw}*min(max(t-{XF},0)/{dur},1)':y={BAR_Y}[b];"
       f"[b][v]overlay=0:{VIDEO_Y}[c];[c][3:v]overlay=0:0[o];"
       f"[2:a]afade=t=in:d=0.08,afade=t=out:st={dur - 0.15}:d=0.15,"
       f"adelay={int(XF * 1000)}:all=1,apad=pad_dur={XF}[a]",
       "-map", "[o]", "-map", "[a]", "-t", f"{total}", *ENC, str(out))
    return total


def main() -> None:
    spec_path, out = sys.argv[1:3]
    spec = json.loads(Path(spec_path).read_text(encoding="utf-8"))
    out_p = Path(out)
    work = out_p.with_name(out_p.stem + "-parts")
    work.mkdir(exist_ok=True)
    white = work / "white.png"
    Image.new("RGB", (16, 16), WHITE).save(white)

    parts: list[tuple[Path, float]] = []
    sheet: list[Image.Image] = []

    def add_still(name: str, im: Image.Image, dur: float) -> None:
        png, mp4 = work / f"{name}.png", work / f"{name}.mp4"
        im.convert("RGB").save(png)
        still(png, dur, mp4)
        parts.append((mp4, dur))
        sheet.append(im.convert("RGB"))

    add_still("00-open", opening(spec), T_OPEN)
    for i in range(len(spec["segments"])):
        add_still(f"{i + 1:02d}a-topic", topic_card(spec, i), T_TOPIC)
        ui, mp4 = work / f"{i + 1:02d}b-ui.png", work / f"{i + 1:02d}b-seg.mp4"
        segment_ui(spec, i).save(ui)
        parts.append((mp4, segment(spec, i, ui, white, mp4)))
        sheet.append(None)  # filled from the rendered video below
    add_still("99-close", closing(spec), T_CLOSE)

    # Chain: soft wipe (video) + crossfade of the silent edges (audio).
    inputs, fc, run = [], [], parts[0][1]
    for p, _ in parts:
        inputs += ["-i", str(p)]
    v, a = "[0:v]", "[0:a]"
    for k in range(1, len(parts)):
        fc.append(f"{v}[{k}:v]xfade=transition=smoothleft:duration={XF}:offset={run - XF:.3f}[v{k}]")
        fc.append(f"{a}[{k}:a]acrossfade=d={XF}:c1=tri:c2=tri[a{k}]")
        v, a = f"[v{k}]", f"[a{k}]"
        run += parts[k][1] - XF
    ff(*inputs, "-filter_complex", ";".join(fc), "-map", v, "-map", a, *ENC,
       "-movflags", "+faststart", out)

    # Contact sheet: one frame per part (segments: 2 s into the clip).
    t, shots = 0.0, []
    for k, (p, dur) in enumerate(parts):
        if sheet[k] is None:
            png = work / f"shot-{k}.png"
            ff("-ss", f"{XF + 2}", "-i", str(p), "-frames:v", "1", str(png))
            sheet[k] = Image.open(png).convert("RGB")
        shots.append(f"{k}: {t:5.1f}s  {p.stem}")
        t += dur - XF
    cols = 5
    rows = -(-len(sheet) // cols)
    tw, th = W // 3, H // 3
    sh = Image.new("RGB", (cols * tw + (cols + 1) * 12, rows * th + (rows + 1) * 12), "#E5E5E0")
    for k, im in enumerate(sheet):
        sh.paste(im.resize((tw, th)), (12 + (k % cols) * (tw + 12), 12 + (k // cols) * (th + 12)))
    sh.save(out_p.with_name(out_p.stem + "-sheet.png"))
    print("\n".join(shots))
    print(f"{out}  {duration(out):.1f} s  {out_p.stat().st_size} B")


if __name__ == "__main__":
    main()
