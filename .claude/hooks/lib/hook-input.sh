# Sourced by pre-*-check.sh. Sets CH, VID, TARGET and FROM_HOOK from args
# (command use: <channel> <video>) or from PreToolUse JSON on stdin
# (tool_input.file_path or tool_input.command).
cd "${CLAUDE_PROJECT_DIR:-.}"
block() { echo "BLOCKED: $1" >&2; exit 2; }   # exit 2 = blocking error; stderr is shown to Claude
# Installed as a plugin inside a project that has its own copy registered in .claude/settings.json:
# let the project copy run so each gate fires once.
if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -f ".claude/hooks/$(basename "$0")" ] \
   && [ "$(cd "$(dirname "$0")" && pwd -P)" != "$(cd .claude/hooks && pwd -P)" ]; then exit 0; fi
if [ $# -gt 0 ]; then
  CH="${1:-}"; VID="${2:-}"; TARGET=""; FROM_HOOK=0
else
  FROM_HOOK=1
  TARGET=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{let t={};try{t=JSON.parse(s).tool_input||{}}catch{}process.stdout.write(t.file_path||t.command||"")})')
  re='s#.*channels/([a-z0-9][a-z0-9-]*)/(scripts|renders|shorts)/([a-z0-9][a-z0-9-]*)/.*#'   # kebab-case only, so <placeholders> never match
  CH=$(printf '%s' "$TARGET" | sed -nE "${re}\1#p" | head -1)
  VID=$(printf '%s' "$TARGET" | sed -nE "${re}\3#p" | head -1)
fi
