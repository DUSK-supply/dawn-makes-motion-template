---
name: packaging
description: Creates honest titles, thumbnail concepts with A/B variants, description with timestamps and disclosure, tags, chapters and pinned comment for a video. Use when asked for "titles", "thumbnail ideas", "description", "metadata", "tags" or "packaging", before /qa-publish.
version: 0.2.0
argument-hint: "<channel-handle> <video-slug>"
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm run validate:file:*)
---

# packaging

Apply to: $ARGUMENTS

## Objective

Packaging that earns the click and matches the payoff, with every required disclosure in place.

## Arguments

- `channel-handle`, `video-slug` (both required).

## Inputs

- `channels/<channel-handle>/scripts/<slug>/script.md`, `brief.json`
- `channels/<channel-handle>/strategy/packaging-rules.md`, `brand/brand.json`
- `channels/<channel-handle>/renders/<slug>/long.srt` when rendered (real timestamps)

## Workflow

1. Read the inputs; quote the line in the first 2 minutes of the script that delivers the promise.
2. Write 3 titles under 60 characters, each pointing at that payoff.
3. Write 3 thumbnail concepts (subject, composition, overlay text of 4 words or fewer, colours from `brand.json`) with an A/B variant each. Production may use the `higgsfield-youtube-thumbnail` skill or Remotion stills (/build-video --thumbnails).
4. Write the description: first 2 lines carry promise and keywords; timestamps (from `long.srt` when available, else marked "provisional"); disclosure line whenever affiliate, sponsor or product links appear; AI/altered-content note decision (`VERIFY` current YouTube rules).
5. Write 10 tags, chapters, end-screen/card plan and a pinned comment.
6. Validate: `npm run validate:file -- engine/schemas/packaging.schema.json channels/<channel-handle>/scripts/<slug>/packaging.json`.

## Outputs

- `channels/<channel-handle>/scripts/<slug>/packaging.json` (`titles`, `thumbnails`, `description`, `tags`, `chapters`, `pinned_comment`, `disclosure_required`)

## References

- `engine/schemas/packaging.schema.json`, `engine/scoring/packaging-rubric.md`
- `engine/policies/disclosure.md`, `.claude/hooks/pre-publish-check.sh` (blocks undisclosed affiliate links)

## Quality checks

- PASS: schema validation exits 0; all titles under 60 characters.
- PASS: each title/thumbnail promise maps to the quoted payoff line.
- PASS: a disclosure line exists whenever any link is affiliate or sponsored.
- FAIL: clickbait the video does not deliver; health, finance or income claims; competitor thumbnail styles copied.

## Failure conditions

- `script.md` missing: stop and run /script-video first.
