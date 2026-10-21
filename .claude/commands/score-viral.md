---
description: Give a heuristic 0-100 packaging and retention score with per-criterion reasons and the two weakest fixes; after publishing, compare against real metrics. Labelled heuristic, never a prediction.
argument-hint: "<channel-handle> <video-slug> [--post-publish]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsx engine/scoring/score.ts:*), Bash(npm run config:*)
disable-model-invocation: false
---

# /score-viral

Arguments: $ARGUMENTS

## Objective

Score a video's packaging and structure against the engine rubric so the weakest parts get fixed before publishing, and feed real metrics into the channel A/B decision afterwards.

## Arguments

| Argument | Required | Meaning |
|---|---|---|
| `channel-handle` | required | Channel folder under `channels/`. |
| `video-slug` | required | Folder under `channels/<channel-handle>/scripts/`. |
| `--post-publish` | optional | Also read `channels/<channel-handle>/tracking/<slug>.csv` and compare the score with real results. |

## Workflow

1. Read `channel.config.yml`, `scripts/<slug>/script.md`, `packaging.json`, and `shorts.json` if present. Stop and list missing files.
2. If `engine/scoring/score.ts` exists (Prompt 03), run `npx tsx engine/scoring/score.ts channels/<channel-handle>/scripts/<slug>` and use its JSON. Otherwise score manually with `engine/scoring/packaging-rubric.md` (and `engine/scoring/scoring.config.yml` weights when present) across: hook strength, packaging clarity, retention structure, audience specificity, monetisation fit, repurposing potential, originality.
3. For each criterion record score, weight and a reason citing the exact line or field.
4. Name the two weakest criteria and one concrete fix each.
5. `--post-publish`: read the tracking CSV (date, impressions, CTR, average view duration, average percentage viewed, views, subscribers gained, affiliate clicks), compare with the channel's other videos and `strategy/test-metrics.md` decision rules, and append the findings.

## Outputs

- `channels/<channel-handle>/scripts/<slug>/score.json` as `{ "label": "heuristic score, not a prediction of performance", "total": 0-100, "criteria": [{ "id", "score", "weight", "reason" }], "weakest": [{ "id", "fix" }] }`
- `channels/<channel-handle>/scripts/<slug>/score.md`
- `--post-publish`: `channels/<channel-handle>/tracking/<slug>-review.md`

## Engine references

- `engine/scoring/packaging-rubric.md`, `engine/scoring/scoring.config.yml` and `engine/scoring/score.ts` (Prompt 03)
- `channels/<channel-handle>/strategy/test-metrics.md`

## Quality checks

- PASS: `label` is exactly "heuristic score, not a prediction of performance" and appears in `score.md`.
- PASS: every criterion has a reason that cites the script or packaging.
- PASS: exactly two weakest criteria, each with an actionable fix.
- FAIL: any promise of views, virality, income or growth.
