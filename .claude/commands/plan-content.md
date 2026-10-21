---
description: Build a 13-week hypothesis plan (1 long-form + 3 Shorts per week) with intent mix, checkpoints and a dated calendar. Document-only; no shell needed beyond validation.
argument-hint: "<channel-handle> [weeks=13] [start=YYYY-MM-DD]"
allowed-tools: Read, Write, Edit, Glob, Grep, Task, Bash(npm run config:*), Bash(npm run validate:file:*), Bash(date:*)
disable-model-invocation: false
---

# /plan-content

Arguments: $ARGUMENTS

## Objective

A 13-week content plan per channel, marked as a hypothesis to revise weekly from real data, that the user approves item by item before scripting.

## Arguments

| Argument | Required | Meaning |
|---|---|---|
| `channel-handle` | required | Channel folder under `channels/`. |
| `weeks` | optional | Default 13. |
| `start` | optional | First Monday. Default: the next Monday after today (`date`). |

## Workflow

1. Read `channels/<channel-handle>/channel.config.yml` (`npm run config -- ...`). Stop if invalid. Use `publishing.longform_per_week` and `publishing.shorts_per_week` (defaults 1 and 3).
2. Read `brand/identity.md`, `strategy/*.md` and `content-plan/ideas.md`. Stop and list what is missing (run /init-channel first).
3. Apply skill **90-day-planning** (delegate drafting to the **strategist** agent). Rules:
   - Weeks 1-3 foundation and search-led authority; one virality-led test in week 3.
   - Intent mix about 40% search-led, 25% virality-led, 20% authority-led, 15% monetisation-led; explain any deviation.
   - At most 2 hard-sell CTAs across the plan; monetisation-led items useful first.
   - Checkpoint weeks 4, 8 and 13 with review tasks and decision rules referencing `strategy/test-metrics.md`.
   - Per week: which Shorts also go to TikTok/Instagram Reels and a posting day/time stated as a starting assumption to test.
   - Channels whose config/identity marks tutorials or software: each item names a demonstrable artefact (workflow, checklist, template). Explainer/curiosity channels: each item has a named source list and a visual-format note.
4. Every item `status: "planned"`. Do not write scripts.
5. Validate the JSON (see Quality checks), fix and re-run until it passes.

## Outputs

All under `channels/<channel-handle>/content-plan/`:

- `90-day-plan.md` (human-readable, starts with "Hypothesis - revise weekly from data")
- `90-day-plan.json` (array of items; each long-form item has week, slug, working_title, core_promise, target_viewer, intent, hook_angle, outline (6-8 beats), evidence_required, cta_goal, affiliate_relevance, disclosure_required, thumbnail_concept, shorts (3 working titles), status)
- `calendar.csv` (columns: `date,format,title,status`)
- `checkpoints.md`

## Engine references

- `engine/schemas/content-plan-item.schema.json` (added by Prompt 03; until then validate structure manually and say so)
- `engine/schemas/video-brief.schema.json` (slug pattern `^[a-z0-9]+(-[a-z0-9]+)*$`)
- `.claude/skills/90-day-planning/SKILL.md`

## Quality checks

- PASS: exactly `weeks` long-form items and `weeks x shorts_per_week` Shorts (13 and 39 by default).
- PASS: no duplicate titles or slugs; every slug matches the video-brief slug pattern.
- PASS: first calendar date is the chosen Monday; dates are weekly.
- PASS: `npm run validate:file -- engine/schemas/content-plan-item.schema.json <item>` passes for every item when the schema exists.
- FAIL: more than 2 hard-sell CTAs; any status other than `planned`; any file written outside `channels/<channel-handle>/`.
