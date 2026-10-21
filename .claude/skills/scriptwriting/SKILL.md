---
name: scriptwriting
description: Writes original, retention-structured long-form scripts with a truthful 30-second hook and per-claim source tags, plus Shorts rewrites. Use when asked to "write the script", "draft the video", "rewrite the hook" or "tighten the script", or from /script-video.
version: 0.2.0
argument-hint: "<channel-handle> <video-slug>"
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep
---

# scriptwriting

Apply to: $ARGUMENTS

## Objective

A narration-ready script that delivers the title's promise early, keeps attention with clear structure, and asserts only sourced facts.

## Arguments

- `channel-handle`, `video-slug` (both required).

## Inputs

- `channels/<channel-handle>/scripts/<slug>/brief.json` and `sources.md` (the pre-script hook blocks without them)
- `channels/<channel-handle>/brand/identity.md` (voice), `strategy/packaging-rules.md`
- `engine/prompts/script-outline.md`

## Workflow

1. Read the inputs; restate the core promise in one sentence.
2. Hook (first 30 s): the specific payoff, why it matters to this viewer, and proof it is coming. No bait the video does not pay off.
3. Problem/tension, then walkthrough or story in numbered sections with a re-hook every 2-3 minutes.
4. Three key takeaways, CTA (one ask), end-screen teaser for a related video.
5. Tag every factual claim `[S<n>]` matching `sources.md`; move anything unsourced into a final "Needs verification" section.
6. Mark on-screen demonstrations as `[DEMO: <asset path>]` and only where the user can record the real thing.
7. Target length: channel `format.longform_minutes` at ~150 words per minute.

## Outputs

- `channels/<channel-handle>/scripts/<slug>/script.md`

## References

- `engine/prompts/script-outline.md`, `engine/policies/originality.md`, `engine/policies/disclosure.md`
- `.claude/hooks/pre-script-check.sh`

## Quality checks

- PASS: promise stated within the first 30 s of narration.
- PASS: every factual sentence has a source tag or sits under "Needs verification".
- PASS: word count inside the target range; voice matches `identity.md`.
- FAIL: paraphrased competitor script; invented statistics, demos, results or testimonials.

## Failure conditions

- `brief.json` or `sources.md` missing: stop (the hook will block anyway) and list what to create.
