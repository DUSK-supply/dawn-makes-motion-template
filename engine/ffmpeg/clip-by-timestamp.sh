#!/usr/bin/env bash
# Cut [start, end] from input, re-encoding for frame-accurate cuts.
set -euo pipefail
usage() { echo "Usage: $0 <input> <start HH:MM:SS> <end HH:MM:SS> <output.mp4>" >&2; exit 1; }
[ $# -eq 4 ] || usage
ffmpeg -y -ss "$2" -to "$3" -i "$1" -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k "$4"
