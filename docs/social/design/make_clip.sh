#!/usr/bin/env bash
# Cut a short, captioned clip from a YouTube video for an X post (playbook §3.4).
# Usage: make_clip.sh <video_id> <start mm:ss> <end mm:ss> <out_dir> "<name> · <channel> · <dd Ay yyyy> · <mm:ss>"
# Needs: yt-dlp, ffmpeg (brew install ffmpeg yt-dlp), uv (for Pillow).
# Output: <out_dir>/<video_id>-<start>.mp4 (720p, h264/aac, caption bar) and a check frame .png.
set -euo pipefail
[ $# -eq 5 ] || { sed -n 2,5p "$0"; exit 1; }
vid=$1 start=$2 end=$3 out=$4 label=$5
mkdir -p "$out"
base="$out/${vid}-${start//:/}"
raw="$base-raw.mp4"

yt-dlp -q --no-warnings --download-sections "*${start}-${end}" --force-keyframes-at-cuts \
  -f "bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720][ext=mp4]" \
  --merge-output-format mp4 -o "$raw" "https://www.youtube.com/watch?v=${vid}"

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

ffmpeg -v error -y -i "$raw" -i "$base-caption.png" \
  -filter_complex "[0:v]scale=1280:-2[v];[v][1:v]overlay=0:main_h-overlay_h" \
  -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -movflags +faststart "$base.mp4"
ffmpeg -v error -y -ss 2 -i "$base.mp4" -frames:v 1 "$base-frame.png"
rm -f "$raw" "$base-caption.png"

dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$base.mp4")
size=$(stat -f %z "$base.mp4")
echo "clip: $base.mp4  duration=${dur}s  size=${size}B  frame: $base-frame.png"
awk -v d="$dur" 'BEGIN{ if (d > 30.5) { print "WARNING: longer than 30 s (playbook §3.4)"; exit 1 } }'
