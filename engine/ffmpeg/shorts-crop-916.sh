#!/usr/bin/env bash
set -euo pipefail
usage() { echo "Usage: $0 <input> <output.mp4>" >&2; exit 1; }
[ $# -eq 2 ] || usage
ffmpeg -y -i "$1" -vf "crop=ih*9/16:ih,scale=1080:1920" -c:v libx264 -preset medium -crf 20 -c:a aac -b:a 160k "$2"
