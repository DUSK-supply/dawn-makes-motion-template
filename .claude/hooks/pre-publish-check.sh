#!/usr/bin/env bash
# Gate before a video is approved or packed for upload (human-approval.json or
# renders/<slug>/PUBLISH-PACK.md): packaging exists, affiliate links carry a
# disclosure, and the QA report has no FAIL.
# Usage: pre-publish-check.sh <channel-handle> <video-slug>   (or as a PreToolUse hook on Write|Edit)
set -euo pipefail
. "$(dirname "$0")/lib/hook-input.sh"
if [ "$FROM_HOOK" = 1 ]; then case "$TARGET" in */scripts/*/human-approval.json|*/renders/*/PUBLISH-PACK.md) ;; *) exit 0 ;; esac; fi
[ -n "$CH" ] && [ -n "$VID" ] || block "usage: pre-publish-check.sh <channel-handle> <video-slug>"
d="channels/$CH/scripts/$VID"
[ -f "$d/packaging.json" ] || block "missing $d/packaging.json - run the packaging skill"
# Prompt 08 adds engine/scripts/qa-publish.ts; prefer it when present.
if [ -f engine/scripts/qa-publish.ts ]; then
  npx --no-install tsx engine/scripts/qa-publish.ts "$d" >&2 || block "qa-publish reported FAIL for $d - see $d/qa-report.md"
fi
[ -f "$d/qa-report.json" ] || block "missing $d/qa-report.json - run /qa-publish $CH $VID"
reason=$(node -e '
const fs=require("fs"),d=process.argv[1];
const q=JSON.parse(fs.readFileSync(d+"/qa-report.json","utf8"));
const fails=(q.rules||[]).filter(r=>r.status==="FAIL").map(r=>r.id);
if(q.overall==="FAIL"||fails.length){console.log("qa-report.json has FAIL: "+(fails.join(", ")||"overall"));process.exit(0)}
const p=fs.readFileSync(d+"/packaging.json","utf8");
if(/amzn\.to|amazon\.[a-z.]+\/|[?&]tag=|affiliate|sponsor/i.test(p)&&!/disclos|affiliate link|paid promotion|commission/i.test(JSON.parse(p).description||""))
  console.log("packaging.json mentions affiliate/sponsor links but the description has no disclosure line");
' "$d" 2>&1) || block "could not read $d/qa-report.json or packaging.json: $reason"
[ -z "$reason" ] || block "$reason"
echo "OK: pre-publish check passed for $CH/$VID"
