---
description: Cut 3 standalone vertical Shorts from the channel's own finished long-form render, with rewritten hooks, captions and a standalone check. Needs a local shell (ffmpeg).
argument-hint: "<channel-handle> <video-slug> [count=3]"
allowed-tools: Read, Write, Edit, Glob, Grep, Task, Bash(npm run config:*), Bash(npm run validate:file:*), Bash(bash engine/ffmpeg/*:*), Bash(ffprobe:*), Bash(mkdir -p channels/*)
disable-model-invocation: false
---

# /clip-shorts

Arguments: $ARGUMENTS

## Objective

Derive Shorts only from the channel's own long-form video, each understandable without the long-form, each linking back to it.

## Arguments

| Argument | Required | Meaning |
|---|---|---|
| `channel-handle` | required | Channel folder under `channels/`. |
| `video-slug` | required | Source video; `channels/<channel-handle>/renders/<slug>/long.mp4` must exist. |
| `count` | optional | Default from `publishing.shorts_per_week` in `channel.config.yml` (3). |

## Workflow

1. Read `channel.config.yml` (`shorts_enabled` must be true) and `strategy/shorts-rules.md`.
2. Confirm `renders/<slug>/long.mp4` and `long.srt` exist; otherwise stop and tell the user to run /build-video.
3. Apply skill **shorts-clipping** (the **editor** agent rewrites hooks): pick `count` segments of 20-60 s from `long.srt` timings, each with its own hook, context and payoff.
4. Write `scripts/<slug>/shorts.json` (per Short: id, source_start, source_end, rewritten_hook, caption_text, payoff, cta_to_full_video, stands_alone yes/no with reason) and validate with `npm run validate:file -- engine/schemas/shorts-brief.schema.json <file>` for each item.
5. For each Short: `bash engine/ffmpeg/clip-by-timestamp.sh <long.mp4> <start> <end> <tmp.mp4>`, then `bash engine/ffmpeg/shorts-crop-916.sh <tmp.mp4> <out.mp4>`, then burn captions with `bash engine/ffmpeg/subtitles.sh` when the brand caption style requires it.
6. ffprobe each output and record resolution and duration in `shorts/<slug>/shorts-report.md`.

## Outputs

- `channels/<channel-handle>/scripts/<slug>/shorts.json`
- `channels/<channel-handle>/shorts/<slug>/short-01.mp4` ... `short-NN.mp4` (gitignored media), `shorts-report.md`
- Intermediate clips in `output/` only.

## Engine references

- `engine/ffmpeg/clip-by-timestamp.sh`, `engine/ffmpeg/shorts-crop-916.sh`, `engine/ffmpeg/subtitles.sh`
- `engine/schemas/shorts-brief.schema.json`
- `engine/scripts/extract-shorts-candidates.ts` (Prompt 03; use it for step 3 when present)

## Quality checks

- PASS: every Short is 1080x1920 and at most 60 s (Shorts length limits: VERIFY with YouTube Help).
- PASS: every `stands_alone` is `yes`; any `no` is rewritten or dropped.
- PASS: every Short CTA points to the full video.
- FAIL: source is not this channel's own render; a Short needs context only found elsewhere in the long-form.
