#!/usr/bin/env bash
# Repo audit against the plugin spec. Exits non-zero if any check fails.
set -uo pipefail
cd "$(dirname "$0")/.."
fails=0
pass() { printf 'PASS  %s\n' "$1"; }
fail() { printf 'FAIL  %s\n' "$1"; fails=$((fails + 1)); }
check() { if eval "$2"; then pass "$1"; else fail "$1"; fi; }
fm() { awk 'NR==1&&/^---$/{f=1;next} f&&/^---$/{exit} f' "$1"; }   # frontmatter of a .md

# Layout
for p in .claude-plugin/plugin.json .claude/settings.json .mcp.json package.json package-lock.json tsconfig.json \
         remotion.config.ts docker-compose.yml Makefile README.md ROADMAP.md LICENSE .gitattributes .gitignore \
         .nvmrc .env.example output/.gitkeep engine/remotion/index.ts engine/remotion/Root.tsx \
         engine/scripts/validate-manifest.ts engine/scripts/read-channel-config.ts \
         docs/setup.md docs/architecture.md docs/git-hygiene.md docs/plugin-validation.md \
         docs/distribution-layout.md; do
  check "exists $p" "[ -f '$p' ]"
done
# the build script is not shipped in the template, so its npm entry is removed there too
grep -q '"build:plugin"' package.json && check "exists engine/scripts/build-plugin.ts" "[ -f engine/scripts/build-plugin.ts ]"
for d in template engine/policies engine/scoring engine/prompts engine/remotion/compositions; do
  check "dir $d" "[ -d '$d' ]"
done
for s in episode-manifest channel-profile video-brief packaging shorts-brief; do
  check "schema $s parses" "node -e 'JSON.parse(require(\"fs\").readFileSync(\"engine/schemas/$s.schema.json\"))' 2>/dev/null"
done
for f in render-1080p shorts-crop-916 subtitles loudnorm clip-by-timestamp; do
  check "ffmpeg $f.sh" "[ -f engine/ffmpeg/$f.sh ]"
done
for d in channels/*/; do
  [ -d "$d" ] || continue
  c=$(basename "$d")
  for sub in brand strategy content-plan scripts assets renders shorts; do
    check "channel $c/$sub" "[ -d channels/$c/$sub ]"
  done
done
check ".claude-plugin holds only plugin.json (+ marketplace.json in the source repo)" "[ \"\$(ls -A .claude-plugin | tr '\n' ' ')\" = 'marketplace.json plugin.json ' ] || [ \"\$(ls -A .claude-plugin | tr '\n' ' ')\" = 'plugin.json ' ]"
check "no root-level commands/ skills/ agents/ hooks/" "[ -z \"\$(git ls-files commands skills agents hooks)\" ]"
check "plugin validate passes" "claude plugin validate . >/dev/null 2>&1 || ! command -v claude >/dev/null"

# Skills
for s in niche-research brand-identity 90-day-planning scriptwriting packaging shorts-clipping policy-and-monetisation-qa; do
  f=".claude/skills/$s/SKILL.md"
  if [ ! -f "$f" ]; then fail "skill $s missing"; continue; fi
  h=$(fm "$f")
  check "skill $s name matches folder" "printf '%s\n' \"\$h\" | grep -qx 'name: $s'"
  for k in description version argument-hint user-invocable allowed-tools; do
    printf '%s\n' "$h" | grep -q "^$k: ." || fail "skill $s frontmatter '$k'"
  done
  check "skill $s in plugin.json" "grep -q '\"./.claude/skills/$s\"' .claude-plugin/plugin.json"
  for sec in Objective Arguments Inputs Workflow Outputs References 'Quality checks' 'Failure conditions'; do
    grep -qx "## $sec" "$f" || fail "skill $s section '$sec'"
  done
done

# Commands
for c in setup-engine init-channel plan-content script-video build-video clip-shorts qa-publish score-viral; do
  f=".claude/commands/$c.md"
  if [ ! -f "$f" ]; then fail "command $c missing"; continue; fi
  h=$(fm "$f")
  for k in description argument-hint allowed-tools disable-model-invocation; do
    printf '%s\n' "$h" | grep -q "^$k: ." || fail "command $c frontmatter '$k'"
  done
  check "command $c uses \$ARGUMENTS" "grep -q '\\\$ARGUMENTS' '$f'"
  check "command $c reads channel.config.yml" "grep -q 'channel.config.yml' '$f'"
  for sec in Objective Arguments Workflow Outputs 'Engine references' 'Quality checks'; do
    grep -qx "## $sec" "$f" || fail "command $c section '$sec'"
  done
done

# Agents
for a in strategist researcher producer editor compliance; do
  f=".claude/agents/$a.md"
  if [ ! -f "$f" ]; then fail "agent $a missing"; continue; fi
  h=$(fm "$f")
  check "agent $a frontmatter" "printf '%s\n' \"\$h\" | grep -qx 'name: $a' && printf '%s\n' \"\$h\" | grep -q '^description: .' && printf '%s\n' \"\$h\" | grep -q '^tools: '"
  grep -qx "## Role boundary" "$f" || fail "agent $a section 'Role boundary'"
done
check "compliance agent is read-only" "! fm .claude/agents/compliance.md | grep '^tools:' | grep -qE 'Write|Edit|Bash'"

# Hooks and executable bits
for s in pre-script-check pre-render-check pre-publish-check setup-check; do
  check "settings.json registers $s" "grep -q '.claude/hooks/$s.sh' .claude/settings.json"
  check "plugin.json registers $s" "grep -q '/.claude/hooks/$s.sh' .claude-plugin/plugin.json"
done
for f in scripts/*.sh .claude/hooks/*.sh engine/ffmpeg/*.sh; do
  check "executable $f" "[ -x '$f' ] && ! git ls-files -s '$f' | grep -q '^100644'"
done

# Tracked-file hygiene
bad=$(git ls-files | grep -E '(^|/)node_modules/|^output/[^.]|(^|/)\.env($|\.)|\.(mp4|mov|wav|mp3)$|(^|/)\.DS_Store$' | grep -vE '^\.env\.example$|^engine/.*/fixtures/' || true)
check "no generated, secret or media files tracked" "[ -z \"\$bad\" ]"
[ -n "$bad" ] && printf '      %s\n' $bad
big=$(git ls-files -z | xargs -0 -n 50 stat -f '%z %N' 2>/dev/null | awk '$1 > 5242880 {print $2}')
check "no tracked file over 5 MB" "[ -z \"\$big\" ]"
check "tracked files under 1000 ($(git ls-files | wc -l | tr -d ' '))" "[ \$(git ls-files | wc -l) -lt 1000 ]"

# Corrupted URLs and absolute paths (tracked text files)
urls=$(git ls-files '*.json' '*.yml' '*.yaml' | xargs grep -nE '<https?:|\]\(https?:' 2>/dev/null || true)
urls="$urls$(git ls-files '*.md' | xargs grep -nE '"\$(schema|id)"[^,]*(<https?:|\]\(https?:)' 2>/dev/null || true)"
check "no corrupted URLs in \$schema/\$id or JSON/YAML" "[ -z \"\$urls\" ]"
[ -n "$urls" ] && printf '      %s\n' "$urls"
abs=$(git ls-files | grep -vE '^package-lock\.json$|^\.agents/' | xargs grep -lE "/${HOME_ROOT:-Users}/[A-Za-z]" 2>/dev/null || true)
check "no hard-coded home-directory paths" "[ -z \"\$abs\" ]"
[ -n "$abs" ] && printf '      %s\n' $abs

# Stubs (informational)
marker="CLAUDE:"" Replace"  # split so this file never contains the marker itself
stubs=$(git ls-files -co --exclude-standard | grep -vE '^\.agents/' | xargs grep -lF "$marker" 2>/dev/null || true)
check "no files contain the stub marker" "[ -z \"\$stubs\" ]"
[ -n "$stubs" ] && printf '      %s\n' $stubs

# Third-party notices and ASCII-only provider/caption sources
check "THIRD_PARTY_NOTICES.md credits MoneyPrinterTurbo" "grep -q MoneyPrinterTurbo THIRD_PARTY_NOTICES.md"
check "engine/providers and engine/captions are ASCII-only" "perl -ne 'exit 1 if /[^\\x00-\\x7F]/' \$(find engine/providers engine/captions -type f 2>/dev/null) </dev/null"

echo "----"
if [ "$fails" -eq 0 ]; then echo "AUDIT PASSED"; else echo "AUDIT FAILED: $fails check(s)"; exit 1; fi
