"""Pick clip cut points on sentence ends and audio pauses (playbook §3.4 item 1a).

Usage: python3 -I clip_bounds.py <video_id> <approx start> <approx end> <out_dir>
Times: m:ss, h:mm:ss or seconds, decimals allowed (e.g. 3:49 or 229.4).
Needs: yt-dlp, ffmpeg. Caches captions and the audio track in <out_dir>.

1. Reads the Turkish auto-captions (json3: word timings + punctuation) and splits them into
   sentences.
2. Widens the approximate window to whole sentences: the clip starts on the first word of the
   sentence that holds the start and ends after the last word of the sentence that holds the end.
3. Moves both cut points into the audio pause at each boundary (ffmpeg silencedetect on the
   cached audio track), so no word is cut.
4. Prints the sentences around the window, the chosen span, warnings, and the make_clip.sh times.
The topic check stays with the reader: the first sentence must open the topic and the last one
must close the thought.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

MAX_LEN, SNAP = 30.0, 1.5
NOISE, MIN_PAUSE = "-32dB", 0.12
# A sentence opening with these leans on the previous one; a clip ending with these is cut short.
LEAD_WORDS = {"ama", "fakat", "ancak", "çünkü", "dolayısıyla", "yani", "ve", "işte", "hatta",
              "ayrıca", "zaten", "sonuçta"}
LEAD_PHRASES = ("o yüzden", "bu yüzden", "bu nedenle", "o nedenle", "bunun için", "o zaman")
TRAIL_WORDS = {"ama", "ve", "çünkü", "ki", "gibi", "için", "eğer", "hem", "ya", "veya", "da", "de"}


def to_sec(t: str) -> float:
    parts = [float(p) for p in t.split(":")]
    return sum(p * 60 ** i for i, p in enumerate(reversed(parts)))


def fmt(s: float) -> str:
    return f"{int(s // 60)}:{s % 60:04.1f}"


def words_from_json3(path: Path) -> list[tuple[float, str]]:
    words = []
    for ev in json.loads(path.read_text())["events"]:
        for seg in ev.get("segs", []):
            text = seg["utf8"].strip()
            if text:
                words.append(((ev["tStartMs"] + seg.get("tOffsetMs", 0)) / 1000, text))
    return words


def words_from_vtt(path: Path) -> list[tuple[float, str]]:
    """Uploader subtitles come as vtt cues only; spread each cue's words evenly over the cue."""
    words = []
    cues = re.findall(r"([\d:.]+) --> ([\d:.]+)[^\n]*\n(.*?)(?:\n\n|\Z)", path.read_text(), re.S)
    for a, b, text in cues:
        ws = re.sub(r"<[^>]+>", "", text).split()
        t0, t1 = to_sec(a), to_sec(b)
        words += [(t0 + (t1 - t0) * k / len(ws), w) for k, w in enumerate(ws)]
    return words


def sentences(words):
    """[(start, next_start, text)]; next_start = when the next sentence's first word begins."""
    out, cur = [], []
    for t, w in words:
        cur.append((t, w))
        if re.search(r"[.?!…]$", w):
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return [(s[0][0], out[i + 1][0][0] if i + 1 < len(out) else s[-1][0] + 1.0,
             " ".join(w for _, w in s)) for i, s in enumerate(out)]


def pauses(vid: str, a: float, b: float, out: Path, noise: str = NOISE) -> list[tuple[float, ...]]:
    # Whole audio track, cached: yt-dlp audio sections are unreliable (full length or ffmpeg error).
    audio = out / f"{vid}.m4a"
    if not audio.exists():
        subprocess.run(["yt-dlp", "-q", "--no-warnings", "-f", "ba[ext=m4a]/ba", "-o", str(audio),
                        f"https://www.youtube.com/watch?v={vid}"], check=True)
    run = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-ss", f"{a:.2f}", "-t",
                          f"{b - a:.2f}", "-i", str(audio), "-af",
                          f"silencedetect=noise={noise}:d={MIN_PAUSE}", "-f", "null", "-"],
                         capture_output=True, text=True)
    if run.returncode:
        audio.unlink()  # a broken download must not stay cached
        sys.exit(f"Audio track of {vid} is unreadable; rerun to download it again")
    log = run.stderr
    starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", log)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    ends += [b - a] * (len(starts) - len(ends))
    return [(a + s, a + e) for s, e in zip(starts, ends, strict=True)]


def pause_near(ps, t, lo, hi):
    """The pause closest to t whose span overlaps [t+lo, t+hi]."""
    near = [p for p in ps if p[1] >= t + lo and p[0] <= t + hi]
    return min(near, key=lambda p: abs((p[0] + p[1]) / 2 - t), default=None)


def first_word(text: str) -> str:
    return text.split()[0].lower().strip(",.;:")


def main() -> int:
    if len(sys.argv) != 5:
        print(__doc__.split("\n\n")[1])
        return 1
    vid, a, b, out = sys.argv[1], to_sec(sys.argv[2]), to_sec(sys.argv[3]), Path(sys.argv[4])
    out.mkdir(parents=True, exist_ok=True)
    # yt-dlp prefers the uploader's own subtitles (often vtt only) over auto-captions (json3).
    subs = [p for p in (out / f"{vid}.tr.json3", out / f"{vid}.tr.vtt") if p.exists()]
    if not subs:
        subprocess.run(["yt-dlp", "-q", "--no-warnings", "--skip-download", "--write-subs",
                        "--write-auto-subs", "--sub-langs", "tr", "--sub-format", "json3/vtt",
                        "-o", str(out / vid), f"https://www.youtube.com/watch?v={vid}"], check=True)
        subs = [p for p in (out / f"{vid}.tr.json3", out / f"{vid}.tr.vtt") if p.exists()]
    if not subs:
        print(f"No Turkish captions for {vid}: pick the cut by ear or use the card (§3.4 item 4)")
        return 1
    read = words_from_json3 if subs[0].suffix == ".json3" else words_from_vtt
    sents = sentences(read(subs[0]))
    # A window edge within SNAP s of a sentence boundary counts as on it (no extra sentence).
    i = next(k for k, s in enumerate(sents) if s[1] > a + SNAP)
    j = max(k for k, s in enumerate(sents) if s[0] < b - SNAP)

    print(f"Sentences around {fmt(a)}–{fmt(b)} (› = in the clip):")
    for k, (s, e, text) in enumerate(sents):
        if s < a - 40 or s > b + 40:
            continue
        print(f"{'›' if i <= k <= j else ' '} [{k}] {fmt(s)}–{fmt(e)}  {text}")

    start_t, end_t = sents[i][0], sents[j + 1][0] if j + 1 < len(sents) else sents[j][1]
    ps = pauses(vid, max(0.0, start_t - 3), end_t + 3, out)
    warn = []
    ps += pauses(vid, max(0.0, start_t - 3), end_t + 3, out, "-26dB")  # noisy studio fallback
    p = pause_near(ps, start_t, -0.8, 0.15)
    cut_a = max(p[0], p[1] - 0.25) if p else start_t - 0.15
    if not p:
        warn.append(f"no pause before {fmt(start_t)}: start cut may clip a word")
    p = pause_near(ps, end_t, -1.5, 0.15)
    cut_b = min(p[1], p[0] + 0.25) if p else end_t - 0.15
    if not p:
        warn.append(f"no pause after the last sentence ({fmt(end_t)}): end cut may clip a word")

    head = sents[i][2].lower()
    if first_word(head) in LEAD_WORDS or head.startswith(LEAD_PHRASES):
        warn.append(f"[{i}] opens with '{first_word(head)}': it leans on [{i - 1}]; include it "
                    "or start later")
    tail = sents[j][2].lower().rstrip(".?!… ").split()[-1]
    if tail in TRAIL_WORDS or not re.search(r"[.?!…]$", sents[j][2]):
        warn.append(f"[{j}] does not end a sentence ('…{tail}')")
    if j + 1 < len(sents) and first_word(sents[j + 1][2]) in LEAD_WORDS:
        warn.append(f"[{j + 1}] continues the thought ('{first_word(sents[j + 1][2])}…'): "
                    f"check the topic is closed at [{j}]")
    dur = cut_b - cut_a
    if dur > MAX_LEN:
        warn.append(f"{dur:.1f} s > {MAX_LEN:.0f} s: pick fewer whole sentences (rerun with a "
                    "narrower window); never cut inside one. If the thought does not fit, use the "
                    "card (§3.4 item 4)")

    print(f"\nSpan: sentences [{i}]–[{j}]  cut {cut_a:.2f}–{cut_b:.2f}  "
          f"({fmt(cut_a)}–{fmt(cut_b)}, {dur:.1f} s)")
    print(f"First words: {' '.join(sents[i][2].split()[:8])} …")
    print(f"Last words:  … {' '.join(sents[j][2].split()[-8:])}")
    for w in warn:
        print(f"WARNING: {w}")
    print(f"\nmake_clip.sh {vid} {cut_a:.2f} {cut_b:.2f} {out} \"<label>\"")
    return 2 if warn else 0


if __name__ == "__main__":
    sys.exit(main())
