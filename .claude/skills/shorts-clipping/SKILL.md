---
name: shorts-clipping
description: Selects and rewrites standalone Shorts from the channel's own long-form video, each with its own hook, context, payoff and link to the full video. Use when asked to "make Shorts", "clip this video", "find Shorts moments" or "repurpose for TikTok/Reels", or from /clip-shorts.
version: 0.2.0
argument-hint: "<channel-handle> <video-slug> [count=3]"
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(bash engine/ffmpeg/*:*), Bash(npm run validate:file:*)
---

# shorts-clipping

Apply to: $ARGUMENTS

## Objective

Shorts that work for a viewer who has never seen the long-form, and send interested viewers to it.

## Arguments

- `channel-handle`, `video-slug` (required); `count` (optional, default 3).

## Inputs

- `channels/<channel-handle>/scripts/<slug>/script.md`
- `channels/<channel-handle>/renders/<slug>/long.mp4` and `long.srt` (own render only)
- `channels/<channel-handle>/strategy/shorts-rules.md`, `brand/brand.json` (caption style)

## Workflow

1. Read inputs; list candidate segments of 20-60 s with a complete idea and visible payoff.
2. For each pick: rewrite the opening line as a standalone hook, add one line of context if needed, keep the payoff, add a CTA to the full video.
3. Answer "stands alone without the long-form? yes/no" with a reason; drop or rewrite any "no".
4. Write the plan, then cut with `engine/ffmpeg/clip-by-timestamp.sh`, `engine/ffmpeg/shorts-crop-916.sh` (pass a centre offset when the subject is off-centre) and `engine/ffmpeg/subtitles.sh`.

## Outputs

- `channels/<channel-handle>/scripts/<slug>/shorts.json`
- `channels/<channel-handle>/shorts/<slug>/short-NN.mp4`

## References

- `engine/schemas/shorts-brief.schema.json`, `engine/ffmpeg/clip-by-timestamp.sh`, `engine/ffmpeg/shorts-crop-916.sh`, `engine/ffmpeg/subtitles.sh`
- `engine/policies/originality.md`

## Quality checks

- PASS: every item validates against `engine/schemas/shorts-brief.schema.json`.
- PASS: every Short has hook, payoff, CTA and `stands_alone: yes`.
- PASS: outputs are 1080x1920; captions inside the platform safe area (`VERIFY` safe-area guidance).
- FAIL: clips from anyone else's video; a Short that only makes sense after watching the long-form.

## Failure conditions

- No owned render: stop and run /build-video first.
