#!/usr/bin/env bash
# Gate before channels/<handle>/scripts/<slug>/script.md is written:
# channel config, video brief and source list must already exist.
# Usage: pre-script-check.sh <channel-handle> <video-slug>   (or as a PreToolUse hook on Write|Edit)
set -euo pipefail
. "$(dirname "$0")/lib/hook-input.sh"
if [ "$FROM_HOOK" = 1 ]; then case "$TARGET" in */channels/*/scripts/*/script.md|channels/*/scripts/*/script.md) ;; *) exit 0 ;; esac; fi
[ -n "$CH" ] && [ -n "$VID" ] || block "usage: pre-script-check.sh <channel-handle> <video-slug>"
[ -f "channels/$CH/channel.config.yml" ] || block "missing channels/$CH/channel.config.yml - run /init-channel $CH first"
d="channels/$CH/scripts/$VID"
[ -f "$d/brief.json" ] || block "missing $d/brief.json - write the video brief before the script"
[ -f "$d/sources.md" ] || block "missing $d/sources.md - every factual claim needs a source id; create the source list first"
[ -f "channels/$CH/brand/identity.md" ] || echo "WARN: channels/$CH/brand/identity.md not found; voice rules unavailable" >&2
echo "OK: pre-script check passed for $CH/$VID"
