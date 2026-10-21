---
name: 90-day-planning
description: Creates a 13-week hypothesis content plan of 1 long-form and 3 Shorts per week with intent mix, checkpoints, cross-platform notes and a dated calendar. Use when asked to "plan 90 days", "build a content calendar", "plan the next quarter" or "revise the plan", or from /plan-content.
version: 0.2.0
argument-hint: "<channel-handle> [weeks=13] [start=YYYY-MM-DD]"
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm run config:*), Bash(npm run validate:file:*), Bash(date:*)
---

# 90-day-planning

Apply to: $ARGUMENTS

## Objective

A balanced, data-revisable plan that builds search authority first, tests virality deliberately and keeps monetisation useful-first.

## Arguments

- `channel-handle` (required); `weeks` (optional, default 13); `start` (optional, default next Monday).

## Inputs

- `channels/<channel-handle>/channel.config.yml` (cadence)
- `brand/identity.md`, `strategy/positioning.md`, `strategy/monetisation.md`, `strategy/test-metrics.md`, `content-plan/ideas.md`

## Workflow

1. Read inputs; compute dates from `start` with weekly steps.
2. Assign each week's long-form an intent class (search-led, virality-led, authority-led, monetisation-led) targeting 40/25/20/15 percent; weeks 1-3 search-led authority with one virality test in week 3.
3. For each long-form write: week, slug, working title, core promise, target viewer, intent, hook angle, 6-8 beat outline, evidence or demo required, CTA goal, affiliate relevance with disclosure flag, thumbnail concept (one line), 3 derived Shorts.
4. Mark weeks 4, 8, 13 as checkpoints with review tasks and decision rules from `strategy/test-metrics.md`.
5. Add per-week cross-post choices (TikTok, Instagram Reels) and a posting day/time labelled "starting assumption".
6. Set every status to `planned`.

## Outputs

`channels/<channel-handle>/content-plan/90-day-plan.md`, `90-day-plan.json`, `calendar.csv` (`date,format,title,status`), `checkpoints.md`.

## References

- `engine/schemas/content-plan-item.schema.json` (Prompt 03), `engine/schemas/video-brief.schema.json` (slug pattern)
- `engine/policies/monetisation.md`, `engine/policies/disclosure.md`

## Quality checks

- PASS: counts are exactly `weeks` long-form and `weeks x shorts_per_week` Shorts.
- PASS: no duplicate titles or slugs; intent mix within 5 points of target or the deviation is explained.
- PASS: at most 2 hard-sell CTAs; checkpoints at weeks 4, 8, 13.
- FAIL: plan presented as a forecast rather than a hypothesis; any status other than `planned`.

## Failure conditions

- Identity or strategy files missing: stop and run /init-channel first.
