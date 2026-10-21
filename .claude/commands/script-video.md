---
description: Turn one approved plan item into brief, sources, full script, scene manifest and visual notes for a channel. Document-only; uses the pre-script gate.
argument-hint: "<channel-handle> <video-slug | week-N>"
allowed-tools: Read, Write, Edit, Glob, Grep, Task, WebSearch, WebFetch, Bash(npm run config:*), Bash(npm run validate:file:*), Bash(npm run check:script:*), Bash(npx tsx engine/scripts/stock-search.ts:*)
disable-model-invocation: false
---

# /script-video

Arguments: $ARGUMENTS

## Objective

A production-ready, original, fully sourced long-form script for one approved plan item, plus the manifest the renderer needs.

## Arguments

| Argument | Required | Meaning |
|---|---|---|
| `channel-handle` | required | Channel folder under `channels/`. |
| `video-slug` or `week-N` | required | Plan item slug, or `week-1` for the first approved long-form item of that week. |

## Workflow

1. Read `channels/<channel-handle>/channel.config.yml` (`npm run config -- ...`), `brand/identity.md`, `strategy/packaging-rules.md`.
2. Read `content-plan/90-day-plan.json`; select the item. If its status is not `approved`, stop and tell the user which field to set.
3. Write `scripts/<slug>/brief.json` and validate: `npm run validate:file -- engine/schemas/video-brief.schema.json channels/<channel-handle>/scripts/<slug>/brief.json`.
4. Delegate research to the **researcher** agent: write `scripts/<slug>/sources.md` (id, title, URL, publisher, access date). Primary sources preferred.
5. Run `npm run check:script -- <channel-handle> <slug>` (the same gate also runs as a hook when `script.md` is written). Stop on BLOCKED and show the reason.
6. Apply skill **scriptwriting** to write `script.md` following `engine/prompts/script-outline.md`.
7. Hand `script.md` to the **editor** agent for a clarity and pacing pass (meaning unchanged).
8. Write `scene-manifest.json` using the schema fields: per scene `id`, `durationFrames`, `text` (caption text), `type` (screen-recording | animation | diagram | generated | stock-licensed), `imagePath` or `videoPath`, and for stock scenes `licenceRef` and `stockClipId`; top-level `voiceoverPath` (placeholder until narration exists) and `captionsPath`. Validate: `npm run validate:file -- engine/schemas/episode-manifest.schema.json channels/<channel-handle>/scripts/<slug>/scene-manifest.json`.
9. Optional stock B-roll: for scenes that suit it, search only (no download) with `npx tsx engine/scripts/stock-search.ts <channel-handle> <slug> "<query>" --provider pexels|pixabay --orientation landscape|portrait`, and propose clips covering at most 30% of total scene duration. Download (`--download <id>`) and mark the scene `stock-licensed` only after the user approves each clip; the licence row is written automatically.
10. Write `visual-notes.md`: every asset the user must record or create manually. Never fabricate demos, results or testimonials. Mark scenes intended for Higgsfield generation as `generated` (illustrative only, never evidence).
11. Set the plan item status to `scripted`.

## Outputs

All under `channels/<channel-handle>/scripts/<slug>/`: `brief.json`, `sources.md`, `script.md`, `scene-manifest.json`, `visual-notes.md`. Plus the status update in `channels/<channel-handle>/content-plan/90-day-plan.json`.

## Engine references

- `engine/schemas/video-brief.schema.json`, `engine/schemas/episode-manifest.schema.json` (scene manifest; Prompt 03 extends it)
- `engine/prompts/script-outline.md`
- `engine/policies/originality.md`, `engine/policies/kids-content.md`
- `.claude/hooks/pre-script-check.sh`

## Quality checks

- PASS: both schema validations exit 0; `npm run check:script` prints OK.
- PASS: the first 30 seconds state the title's promise specifically and truthfully.
- PASS: word count within the channel's `format.longform_minutes` range at about 150 spoken words per minute.
- PASS: every factual claim carries `[S<n>]` matching an id in `sources.md`; claims without a source are listed under "Needs verification" and not asserted.
- FAIL: script copies or closely paraphrases a competitor; demo or result not backed by a real recording listed in `visual-notes.md`; anything written outside `channels/<channel-handle>/`.
