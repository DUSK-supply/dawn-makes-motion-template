#!/usr/bin/env bash
# Normalise audio to -14 LUFS integrated (YouTube playback target).
set -euo pipefail
usage() { echo "Usage: $0 <input> <output>" >&2; exit 1; }
[ $# -eq 2 ] || usage
ffmpeg -y -i "$1" -af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:v copy -c:a aac -b:a 192k "$2"
