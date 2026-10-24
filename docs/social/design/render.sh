#!/usr/bin/env bash
# Render a card/banner/avatar HTML to PNG (2x) and an X-ready WebP.
# Usage: render.sh <input.html> <out-basename> [width height]   (default 1200 675)
# Headless Chrome often does not exit after --screenshot, so we wait for the file and kill it.
set -euo pipefail
in="$1"; out="$2"; w="${3:-1200}"; h="${4:-675}"
chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
profile="$(mktemp -d)"
rm -f "$out.png"
"$chrome" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --window-size="$w,$h" --timeout=6000 --user-data-dir="$profile" \
  --screenshot="$out.png" "file://$(cd "$(dirname "$in")" && pwd)/$(basename "$in")" >/dev/null 2>&1 &
pid=$!
for _ in $(seq 1 40); do [ -s "$out.png" ] && break; perl -e 'select(undef,undef,undef,0.5)'; done
perl -e 'select(undef,undef,undef,1)'
kill "$pid" 2>/dev/null || true
rm -rf "$profile"
[ -s "$out.png" ] || { echo "render failed" >&2; exit 1; }
cwebp -quiet -q 82 -resize "$w" "$h" "$out.png" -o "$out.webp"
echo "$out.png $(stat -f%z "$out.png") bytes; $out.webp $(stat -f%z "$out.webp") bytes"
