"""Turkish voice-over + subtitles for an English clip (owner 2026-11-15: Tom Lee, Joseph Carlson).

Two steps, with an editor check between them (playbook §3.4 item 10):
  0. captions: python3 -I make_tr_voice_clip.py captions <video_id> <work_dir>
     Caches the English captions; run it before clip_bounds.py ... en when YouTube answers 429.
  1. translate: python3 -I make_tr_voice_clip.py translate <video_id> <start> <end> <work_dir>
     Reads the English captions in <work_dir> (clip_bounds.py ... en caches them), splits the
     clip span into sentences and translates them with MiniMax (text). Writes <work_dir>/cues.json
     with en / tr_raw / tr per sentence and prints them. Edit "tr" in cues.json where the Turkish
     is wrong or stiff; never change a number, a ticker or a direction.
  2. render: python3 -I make_tr_voice_clip.py render <video_id> <start> <end> <work_dir> <out.mp4>
     Speaks every "tr" line with a stock MiniMax Turkish voice (never a clone of the speaker),
     lays it over the original audio at 12 %, burns the Turkish subtitles and the label
     "Yapay zekâ ile Türkçe seslendirme" into the 16:9 video. Feed <out.mp4> to
     make_banner_clip.py as the raw cut.
Times are the clip_bounds.py cut times (m:ss or seconds). Run with:
  uv run -q --with pillow --with httpx --with certifi --with youtube-transcript-api python -I make_tr_voice_clip.py ...
Key: MINIMAX_API_KEY from the environment, else from ~/Documents/self-projects/tracker/.env
(the M Plan key; text and speech share its quota). The key is never printed.
"""

import binascii
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import certifi
import httpx
from PIL import Image, ImageDraw, ImageFont

API = "https://api.minimax.io/v1"
TEXT_MODEL, TTS_MODEL, VOICE = "MiniMax-M3.1-Flash", "speech-2.8-hd", "Turkish_Trustworthyman"
W, H = 1280, 720
SANS = "/System/Library/Fonts/HelveticaNeue.ttc"
LABEL = "Yapay zekâ ile Türkçe seslendirme"
BG_VOL, MAX_TEMPO, GAP_MIN = 0.12, 1.25, 0.2


def to_sec(t: str) -> float:
    s = 0.0
    for part in t.split(":"):
        s = s * 60 + float(part)
    return s


def api_key() -> str:
    if os.environ.get("MINIMAX_API_KEY"):
        return os.environ["MINIMAX_API_KEY"]
    env = Path.home() / "Documents/self-projects/tracker/.env"
    for line in env.read_text().splitlines():
        if line.startswith("MINIMAX_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"')
    sys.exit("MINIMAX_API_KEY not set and not found in tracker/.env")


def client() -> httpx.Client:
    return httpx.Client(verify=certifi.where(), timeout=180,
                        headers={"Authorization": f"Bearer {api_key()}"})


def captions(vid: str, work: Path) -> Path:
    """Cache <vid>.en.json3 (word timings). yt-dlp first; on a YouTube 429 the transcript API
    (segment timings, words spread evenly) writes the same json3 shape. clip_bounds.py ... en
    reads this cache too."""
    path = work / f"{vid}.en.json3"
    if path.exists():
        return path
    subprocess.run(["yt-dlp", "-q", "--no-warnings", "--skip-download", "--write-auto-subs",
                    "--sub-langs", "en", "--sub-format", "json3", "-o", str(work / vid),
                    f"https://www.youtube.com/watch?v={vid}"])
    if not path.exists():
        from youtube_transcript_api import YouTubeTranscriptApi  # noqa: PLC0415

        snippets = YouTubeTranscriptApi().fetch(vid, languages=["en"])
        path.write_text(json.dumps({"events": [
            {"tStartMs": int(s.start * 1000), "dDurationMs": int(s.duration * 1000),
             "segs": [{"utf8": s.text.replace("\n", " ")}]} for s in snippets]}))
    return path


def words(work: Path, vid: str) -> list[tuple[float, str]]:
    path = captions(vid, work)
    out = []
    for ev in json.loads(path.read_text())["events"]:
        segs = [s for s in ev.get("segs", []) if s["utf8"].strip()]
        t_end = ev["tStartMs"] + ev.get("dDurationMs", 0)
        for k, seg in enumerate(segs):
            t0 = ev["tStartMs"] + seg.get("tOffsetMs", 0)
            t1 = ev["tStartMs"] + segs[k + 1].get("tOffsetMs", 0) if k + 1 < len(segs) else t_end
            ws = seg["utf8"].split()
            out += [((t0 + max(t1 - t0, 0) * n / len(ws)) / 1000, w) for n, w in enumerate(ws)]
    return out


def translate(vid: str, a: float, b: float, work: Path) -> None:
    every, cur = [], []
    for t, w in words(work, vid):
        cur.append((t, w))
        if re.search(r"[.?!]$", w):
            every.append(cur)
            cur = []
    # Caption timings are approximate (whole segments on the 429 fallback): keep a sentence when
    # its midpoint is inside the cut, always whole, never a fragment of its neighbour.
    sents = [s for s in every if a <= (s[0][0] + s[-1][0]) / 2 <= b]
    cues = [{"start": round(max(s[0][0], a) - a, 2),
             "end": round((sents[i + 1][0][0] if i + 1 < len(sents) else b) - a, 2),
             "en": " ".join(w for _, w in s)} for i, s in enumerate(sents)]
    prompt = (
        "Translate each English sentence of this US stock-market commentary into natural, faithful "
        "Turkish for subtitles and a voice-over. Keep every number, ticker, percent and direction "
        "exactly; add nothing, soften nothing. Short, spoken Turkish. Market terms: rally=ralli, "
        "forward P/E=ileriye dönük F/K. Return only JSON {\"tr\": [...]} with the same number of "
        "items.\n\n" + json.dumps([c["en"] for c in cues], ensure_ascii=False))
    with client() as c:
        r = c.post(f"{API}/chat/completions", json={
            "model": TEXT_MODEL, "reasoning_effort": "low", "reasoning_split": True,
            "messages": [{"role": "user", "content": prompt}]})
    r.raise_for_status()
    text = r.json()["choices"][0]["message"]["content"]
    tr = json.loads(re.search(r"\{.*\}", text, re.S).group(0))["tr"]
    if len(tr) != len(cues):
        sys.exit(f"translation returned {len(tr)} lines for {len(cues)} sentences: rerun")
    for cue, line in zip(cues, tr, strict=True):
        cue["tr_raw"] = cue["tr"] = line
    (work / "cues.json").write_text(json.dumps(cues, ensure_ascii=False, indent=1))
    for cue in cues:
        print(f"{cue['start']:6.2f}  EN: {cue['en']}\n        TR: {cue['tr']}")
    print(f"\n{work / 'cues.json'}: edit \"tr\" where needed, then run render.")


def tts(c: httpx.Client, text: str, work: Path) -> tuple[Path, float]:
    p = work / f"tts-{hashlib.sha1(text.encode()).hexdigest()[:10]}.mp3"
    if not p.exists():
        j = c.post(f"{API}/t2a_v2", json={
            "model": TTS_MODEL, "text": text, "stream": False, "language_boost": "Turkish",
            "output_format": "hex",
            "voice_setting": {"voice_id": VOICE, "speed": 1.1, "vol": 1, "pitch": 0},
            "audio_setting": {"sample_rate": 32000, "bitrate": 128000, "format": "mp3",
                              "channel": 1}}).json()
        if j.get("base_resp", {}).get("status_code") not in (0, None):
            sys.exit(f"TTS error: {j['base_resp']}")
        p.write_bytes(binascii.unhexlify(j["data"]["audio"]))
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries",
                                       "format=duration", "-of", "csv=p=0", str(p)]))
    return p, d


def wrap(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont) -> list[str]:
    lines, cur = [], ""
    for w in text.split():
        trial = f"{cur} {w}".strip()
        if draw.textlength(trial, font=f) <= 1100:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    return [*lines, cur] if cur else lines


def render(vid: str, a: float, b: float, work: Path, out: Path) -> None:
    cues = json.loads((work / "cues.json").read_text())
    dur = b - a
    raw = work / f"{vid}-section.mp4"
    lo = max(int(a) - 1, 0)
    for _ in range(3):
        if subprocess.run(["yt-dlp", "-q", "--no-warnings", "--download-sections",
                           f"*{lo}-{int(b) + 2}", "--force-keyframes-at-cuts", "-f",
                           "bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720][ext=mp4]",
                           "--merge-output-format", "mp4", "-o", str(raw),
                           f"https://www.youtube.com/watch?v={vid}"]).returncode == 0:
            break
    cut = work / f"{vid}-cut.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a - lo:.3f}", "-t", f"{dur:.3f}",
                    "-i", str(raw), "-vf", f"scale={W}:{H}", "-c:v", "libx264", "-preset", "fast",
                    "-crf", "20", "-c:a", "aac", "-b:a", "160k", str(cut)], check=True)
    # Voice: one TTS line per sentence, laid end to end from the first sentence's start, sped
    # up (≤ 1.25×) only when the Turkish is longer than the clip.
    with client() as c:
        speech = [tts(c, cue["tr"], work) for cue in cues]
    total = sum(d for _, d in speech)
    avail = dur - cues[0]["start"] - 0.3
    tempo = max(1.0, total / (avail - GAP_MIN * len(cues)))
    if tempo > MAX_TEMPO:
        sys.exit(f"Turkish is {tempo:.2f}× the clip: shorten the tr lines or widen the clip")
    gap = (avail - total / tempo) / len(cues)
    t, spans = cues[0]["start"], []
    for _, d in speech:
        spans.append((t, t + d / tempo))
        t += d / tempo + gap
    # Subtitles follow the Turkish voice: ≤ 2 lines per screen, ≥ 1.4 s each.
    f, fl = ImageFont.truetype(SANS, 46, index=1), ImageFont.truetype(SANS, 30, index=1)
    probe = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    screens = []
    for cue, (s, e) in zip(cues, spans, strict=True):
        lines = wrap(probe, cue["tr"], f)
        groups = [lines[i:i + 2] for i in range(0, len(lines), 2)]
        n = sum(len(" ".join(g)) for g in groups)
        for g in groups:
            d = (e - s) * len(" ".join(g)) / n
            screens.append([s, s + d, g])
            s += d
    for i, sc in enumerate(screens):
        if i:
            sc[0] = max(sc[0], screens[i - 1][1])
        sc[1] = min(max(sc[1], sc[0] + 1.4), dur)
    pngs = []
    for i, (s, e, g) in enumerate(screens):
        im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        lh, y0 = 58, H - 40 - 58 * len(g)
        bw = max(d.textlength(line, font=f) for line in g) + 48
        d.rounded_rectangle(((W - bw) / 2, y0 - 14, (W + bw) / 2, H - 26), radius=14,
                            fill=(0, 0, 0, 190))
        for j, line in enumerate(g):
            d.text((W / 2, y0 + j * lh + lh / 2 - 4), line, font=f, fill="white", anchor="mm")
        lw = d.textlength(LABEL, font=fl) + 32
        d.rounded_rectangle((24, 24, 24 + lw, 72), radius=24, fill=(31, 58, 138, 230))
        d.text((40, 48), LABEL, font=fl, fill="white", anchor="lm")
        p = work / f"sub-{i:02d}.png"
        im.save(p)
        pngs.append((p, s, e))
    args = ["ffmpeg", "-v", "error", "-y", "-i", str(cut)]
    for p, _, _ in pngs:
        args += ["-i", str(p)]
    for p, _ in speech:
        args += ["-i", str(p)]
    fc, last = [], "0:v"
    for i, (_, s, e) in enumerate(pngs):
        fc.append(f"[{last}][{i + 1}:v]overlay=0:0:enable='between(t,{s:.2f},{e:.2f})'[v{i}]")
        last = f"v{i}"
    fc.append(f"[0:a]volume={BG_VOL}[bg]")
    for i, (s, _) in enumerate(spans):
        ms = int(s * 1000)
        fc.append(f"[{1 + len(pngs) + i}:a]atempo={tempo:.3f},adelay={ms}|{ms},volume=1.6[t{i}]")
    fc.append("[bg]" + "".join(f"[t{i}]" for i in range(len(spans)))
              + f"amix=inputs={len(spans) + 1}:normalize=0:duration=first[a]")
    args += ["-filter_complex", ";".join(fc), "-map", f"[{last}]", "-map", "[a]", "-c:v",
             "libx264", "-preset", "fast", "-crf", "20", "-c:a", "aac", "-b:a", "160k",
             "-t", f"{dur:.3f}", str(out)]
    subprocess.run(args, check=True)
    raw.unlink(missing_ok=True)
    print(f"{out}  {dur:.1f} s  voice {total:.1f} s  tempo {tempo:.2f}  lines {len(cues)}")


def main() -> None:
    if len(sys.argv) == 4 and sys.argv[1] == "captions":
        print(captions(sys.argv[2], Path(sys.argv[3])))
        return
    if len(sys.argv) < 6 or sys.argv[1] not in ("translate", "render"):
        sys.exit(__doc__)
    cmd, vid, a, b, work = sys.argv[1], sys.argv[2], to_sec(sys.argv[3]), to_sec(sys.argv[4]), \
        Path(sys.argv[5])
    work.mkdir(parents=True, exist_ok=True)
    if cmd == "translate":
        translate(vid, a, b, work)
    elif len(sys.argv) == 7:
        render(vid, a, b, work, Path(sys.argv[6]))
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
