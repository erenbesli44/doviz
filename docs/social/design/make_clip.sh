#!/usr/bin/env bash
# Cut a short, captioned clip from a YouTube video for an X post (playbook §3.4).
# Usage: make_clip.sh <video_id> <start> <end> <out_dir> "<name> · <channel> · <dd Ay yyyy> · <mm:ss>"
# Times: m:ss, h:mm:ss or seconds, decimals allowed. Take them from clip_bounds.py (sentence ends).
# Needs: yt-dlp, ffmpeg (brew install ffmpeg yt-dlp), uv (for Pillow).
# Output: <out_dir>/<video_id>-<mss>.mp4 (720p, h264/aac, caption bar), a frame at 2 s and one
# 0.5 s before the end. Fails if longer than 60 s or if either cut lands in speech.
set -euo pipefail
[ $# -eq 5 ] || { sed -n 2,7p "$0"; exit 1; }
vid=$1 out=$4 label=$5
to_sec() { awk -F: '{ s = 0; for (i = 1; i <= NF; i++) s = s * 60 + $i; printf "%.3f", s }' <<<"$1"; }
start=$(to_sec "$2") end=$(to_sec "$3")
mkdir -p "$out"
base="$out/${vid}-$(awk -v s="$start" 'BEGIN{ printf "%d%02d", s / 60, int(s) % 60 }')"
raw="$base-raw.mp4"

# yt-dlp sections fail on fractional times: fetch whole seconds with 1 s margin, trim exactly below.
raw_a=$(awk -v s="$start" 'BEGIN{ a = int(s) - 1; print (a < 0 ? 0 : a) }')
raw_b=$(awk -v s="$end" 'BEGIN{ print int(s) + 2 }')
# The section download fails now and then ("ffmpeg exited with code 187"): retry up to 3 times.
for try in 1 2 3; do
  yt-dlp -q --no-warnings --download-sections "*${raw_a}-${raw_b}" --force-keyframes-at-cuts \
    -f "bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720][ext=mp4]" \
    --merge-output-format mp4 -o "$raw" "https://www.youtube.com/watch?v=${vid}" && break
  [ "$try" -lt 3 ] || exit 1
  rm -f "$raw"*; sleep 3
done
off=$(awk -v s="$start" -v a="$raw_a" 'BEGIN{ printf "%.3f", s - a }')
len=$(awk -v s="$start" -v e="$end" 'BEGIN{ printf "%.3f", e - s }')

# Caption bar as PNG (Homebrew ffmpeg has no drawtext).
LABEL="$label" VID="$vid" OUT="$base-caption.png" uv run -q --with pillow python - <<'EOF'
import os
from PIL import Image, ImageDraw, ImageFont
im = Image.new("RGBA", (1280, 84), (0, 0, 0, 150)); d = ImageDraw.Draw(im)
f1 = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 30)
f2 = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 20)
d.text((24, 12), os.environ["LABEL"], font=f1, fill="white")
d.text((24, 52), f"Kaynak: youtube.com/watch?v={os.environ['VID']} · dovizveri.com · Yatırım tavsiyesi değildir",
       font=f2, fill=(255, 255, 255, 220))
im.save(os.environ["OUT"])
EOF

ffmpeg -v error -y -i "$raw" -i "$base-caption.png" -ss "$off" -t "$len" \
  -filter_complex "[0:v]scale=1280:-2[v];[v][1:v]overlay=0:main_h-overlay_h" \
  -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -movflags +faststart "$base.mp4"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$base.mp4")
ffmpeg -v error -y -ss 2 -i "$base.mp4" -frames:v 1 "$base-frame.png"
ffmpeg -v error -y -ss "$(awk -v d="$dur" 'BEGIN{ print d - 0.5 }')" -i "$base.mp4" -frames:v 1 \
  "$base-end.png"
rm -f "$raw" "$base-caption.png"

size=$(stat -f %z "$base.mp4")
echo "clip: $base.mp4  duration=${dur}s  size=${size}B  frames: $base-frame.png $base-end.png"
awk -v d="$dur" 'BEGIN{ if (d > 60.5) { print "WARNING: longer than 60 s (playbook §3.4)"; exit 1 } }'

# Both cuts must sit in a pause (§3.4 item 1a): silence at the first and the last 0.1 s.
ffmpeg -hide_banner -nostats -i "$base.mp4" -af silencedetect=noise=-32dB:d=0.1 -f null - 2>&1 |
  awk -v d="$dur" '
    /silence_start/ { s = $NF + 0; open = 1; if (s <= 0.05) head = 1 }
    /silence_end/   { split($0, p, "silence_end: "); e = p[2] + 0; open = 0; if (e >= d - 0.05) tail = 1 }
    END {
      if (open) tail = 1
      if (!head) print "FAIL: the clip starts in speech; move the start into the pause before the sentence"
      if (!tail) print "FAIL: the clip ends in speech; move the end into the pause after the sentence"
      if (head && tail) print "cuts: both in a pause"
      exit !(head && tail)
    }'
