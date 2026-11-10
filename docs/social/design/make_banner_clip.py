"""Banner clip for X (owner 2026-11-10): who + lead line on top, 16:9 clip, footer; 1:1 to 4:5.

Usage:
  python3.13 -I make_banner_clip.py <clip.mp4> <out.mp4> <spec.json>
spec.json: {"name", "meta", "chip", "quote", "source", "avatar" (path or null), "initials"}
  name     speaker (or channel for main-idea posts), e.g. "Murat Sağman"
  meta     "Integral Forextv · 9 Kasım yayını"
  chip     instrument or "Ana fikir", e.g. "BIST"
  quote    the post's lead line, verbatim, without quote marks
  source   "Kaynak: youtube.com/watch?v=<id> · dk 31:25" (playbook §3.4 item 2; media only)
  avatar   the speaker's own channel photo; null -> grey initials (guest on a multi-guest channel)
The input clip should be the raw cut (no caption bar). Needs ffmpeg and Pillow (uv run --with pillow).
Writes <out.mp4>, <out>-frame.png (2 s) and <out>-banner.png.
"""

import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W = 1080  # height varies: 1080 (1:1) to 1350 (4:5)
VIDEO_H = 608  # 1080 x 608 = 16:9, never cropped (playbook §3.4 item 3)
FOOT_H = 136
AV = 120
NAVY, INK, MUTED, BG, WHITE = "#1F3A8A", "#16181B", "#555A62", "#FAFAF7", "#FFFFFF"
SANS = "/System/Library/Fonts/HelveticaNeue.ttc"
SERIF = "/System/Library/Fonts/Supplemental/Charter.ttc"


def font(path: str, size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size, index=index)


def wrap(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont, width: int) -> list[str]:
    lines, cur = [], ""
    for word in text.split():
        trial = f"{cur} {word}".strip()
        if draw.textlength(trial, font=f) <= width:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    return [*lines, cur] if cur else lines


def avatar(spec: dict, size: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
    if spec.get("avatar"):
        im = Image.open(spec["avatar"]).convert("RGB").resize((size, size))
    else:
        im = Image.new("RGB", (size, size), "#4B5563")
        d = ImageDraw.Draw(im)
        f = font(SANS, size // 3, 1)
        t = spec["initials"]
        d.text(((size - d.textlength(t, font=f)) / 2, size / 2), t, font=f, fill=WHITE, anchor="lm")
    out = Image.new("RGBA", (size, size))
    out.paste(im, (0, 0), mask)
    return out


def banner(spec: dict) -> tuple[Image.Image, int]:
    """Return the background frame and the y where the video goes."""
    probe = ImageDraw.Draw(Image.new("RGB", (W, 10)))
    left, width = 48 + 30, W - 48 - 30 - 48
    quote_top = 48 + AV + 36
    # Largest roman serif size whose quote keeps the canvas <= 4:5.
    for size_q in range(52, 39, -2):
        fq = font(SERIF, size_q)
        lines = wrap(probe, f"“{spec['quote']}”", fq, width)
        lh = int(size_q * 1.25)
        video_y = quote_top + len(lines) * lh + 40
        if video_y + VIDEO_H + FOOT_H <= 1350:
            break
    else:
        sys.exit("quote does not fit even at 40px: shorten the banner line")
    h = max(1080, video_y + VIDEO_H + FOOT_H)
    h += h % 2  # libx264 needs an even height
    video_y = h - FOOT_H - VIDEO_H  # extra height (short quotes) goes above the video
    im = Image.new("RGBA", (W, h), BG)
    d = ImageDraw.Draw(im)
    # Who: avatar + name + meta, chip at the right end of the name row.
    im.alpha_composite(avatar(spec, AV), (48, 48))
    x = 48 + AV + 28
    d.text((x, 48 + 38), spec["name"], font=font(SANS, 60, 1), fill=INK, anchor="lm")
    d.text((x, 48 + 96), spec["meta"], font=font(SANS, 34), fill=MUTED, anchor="lm")
    fc = font(SANS, 34, 1)
    cw = d.textlength(spec["chip"], font=fc) + 44
    d.rounded_rectangle((W - 48 - cw, 48 + 12, W - 48, 48 + 64), radius=26, fill=NAVY)
    d.text((W - 48 - cw / 2, 48 + 38), spec["chip"], font=fc, fill=WHITE, anchor="mm")
    # Lead line, top-aligned under the name.
    d.rectangle((48, quote_top + 8, 58, quote_top + len(lines) * lh - 8), fill=NAVY)
    for i, line in enumerate(lines):
        d.text((left, quote_top + i * lh), line, font=fq, fill=INK)
    # Footer: brand + disclaimer, source line under it.
    d.rectangle((0, h - FOOT_H, W, h), fill=NAVY)
    y1, y2 = h - FOOT_H + 42, h - FOOT_H + 92
    d.text((48, y1), "dovizveri.com", font=font(SANS, 34, 1), fill=WHITE, anchor="lm")
    d.text((W - 48, y1), "Yatırım tavsiyesi değildir.", font=font(SANS, 34), fill=WHITE, anchor="rm")
    d.text((48, y2), spec["source"], font=font(SANS, 30), fill="#C9D3EE", anchor="lm")
    print(f"quote: {size_q}px, {len(lines)} lines, canvas {W}x{h}")
    return im, video_y


def main() -> None:
    clip, out, spec_path = sys.argv[1:4]
    spec = json.loads(Path(spec_path).read_text(encoding="utf-8"))
    out_p = Path(out)
    png = out_p.with_name(out_p.stem + "-banner.png")
    bg, video_y = banner(spec)
    bg.convert("RGB").save(png)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-loop", "1", "-i", str(png), "-i", clip, "-filter_complex",
         f"[1:v]scale={W}:{VIDEO_H}:force_original_aspect_ratio=decrease,"
         f"pad={W}:{VIDEO_H}:(ow-iw)/2:(oh-ih)/2:black[v];[0:v][v]overlay=0:{video_y}:shortest=1,"
         "format=yuv420p[o]",
         "-map", "[o]", "-map", "1:a", "-c:v", "libx264", "-preset", "fast", "-crf", "22",
         "-r", "30", "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", out],
        check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "2", "-i", out, "-frames:v", "1",
                    str(out_p.with_name(out_p.stem + "-frame.png"))], check=True)
    print(f"{out}  {out_p.stat().st_size} B")


if __name__ == "__main__":
    main()
