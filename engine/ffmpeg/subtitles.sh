#!/usr/bin/env bash
# Burn an SRT into the video when ffmpeg has libass; otherwise mux it as a soft (toggleable) track.
set -euo pipefail
usage() { echo "Usage: $0 <input> <subtitles.srt> <output.mp4>" >&2; exit 1; }
[ $# -eq 3 ] || usage
[ -f "$2" ] || { echo "Subtitle file not found: $2" >&2; exit 1; }
if ffmpeg -hide_banner -filters 2>/dev/null | grep -q ' subtitles '; then
  ffmpeg -y -i "$1" -vf "subtitles=filename='$2'" -c:v libx264 -preset medium -crf 18 -c:a copy "$3"
else
  echo "NOTE: ffmpeg lacks libass; adding soft subtitles instead of burning in" >&2
  ffmpeg -y -i "$1" -i "$2" -map 0 -map 1 -c copy -c:s mov_text "$3"
fi
