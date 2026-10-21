#!/usr/bin/env bash
set -euo pipefail
usage() { echo "Usage: $0 <input> <output.mp4>" >&2; exit 1; }
[ $# -eq 2 ] || usage
ffmpeg -y -i "$1" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k -movflags +faststart "$2"
