#!/usr/bin/env bash
# Gate before a render: ffmpeg present; when the video is known, script.md and a
# schema-valid scene-manifest.json exist.
# Usage: pre-render-check.sh <channel-handle> <video-slug>   (or as a PreToolUse hook on Bash)
set -euo pipefail
. "$(dirname "$0")/lib/hook-input.sh"
# Only commands that start a render (at a line start or after ; & | &&), not text that mentions one.
if [ "$FROM_HOOK" = 1 ]; then
  printf '%s\n' "$TARGET" | grep -qE '(^|[;&|(])[[:space:]]*(npx (--no-install )?)?(remotion render|tsx engine/scripts/render-episode|bash engine/ffmpeg/)' || exit 0
fi
command -v ffmpeg >/dev/null || block "ffmpeg not installed (macOS: brew install ffmpeg)"
if [ -n "$CH" ] && [ -n "$VID" ]; then
  d="channels/$CH/scripts/$VID"
  for f in script.md scene-manifest.json; do [ -f "$d/$f" ] || block "missing $d/$f"; done
  out=$(npx --no-install tsx engine/scripts/validate-manifest.ts engine/schemas/episode-manifest.schema.json "$d/scene-manifest.json" 2>&1) \
    || block "$d/scene-manifest.json fails engine/schemas/episode-manifest.schema.json: $(printf '%s' "$out" | tail -3 | tr '\n' ' ')"
elif [ "$FROM_HOOK" = 0 ]; then
  block "usage: pre-render-check.sh <channel-handle> <video-slug>"
fi
echo "OK: pre-render check passed"
