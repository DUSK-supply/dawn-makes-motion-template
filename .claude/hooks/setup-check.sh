#!/usr/bin/env bash
# SessionStart: report what /setup-engine still has to do. Silent when setup is complete.
# Plain stdout from a SessionStart hook is added to Claude's context.
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
missing=()
[ -d engine ] && [ -d channels ] || missing+=("engine template not in this project (clone it)")
command -v node >/dev/null || missing+=("node")
command -v ffmpeg >/dev/null || missing+=("ffmpeg")
if ! command -v higgsfield >/dev/null; then missing+=("Higgsfield CLI")
elif ! higgsfield auth token >/dev/null 2>&1; then missing+=("Higgsfield login"); fi
[ -d "$HOME/.claude/skills/higgsfield-generate" ] || [ -d .claude/skills/higgsfield-generate ] || missing+=("Higgsfield skills")
[ ${#missing[@]} -eq 0 ] && exit 0
printf 'Dawn Makes Motion setup incomplete: %s. Tell the user and offer to run the setup-engine command, which installs and checks each item with their approval.\n' "$(IFS=';'; echo "${missing[*]}" | sed 's/;/, /g')"
