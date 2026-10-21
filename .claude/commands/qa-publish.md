---
description: Run the publishing gate on one video - originality, sources, disclosure, packaging honesty, Shorts standalone, licences - and write qa-report.md/.json; status becomes ready-to-publish only after a human approval file. Never uploads.
argument-hint: "<channel-handle> <video-slug>"
allowed-tools: Read, Write, Edit, Glob, Grep, Task, Bash(npm run config:*), Bash(npm run check:publish:*), Bash(npx tsx engine/scripts/qa-publish.ts:*)
disable-model-invocation: true
---

# /qa-publish

Arguments: $ARGUMENTS

## Objective

Refuse approval for any video that fails a governance rule, and record exactly why, so publishing decisions are evidence-based and reversible.

## Arguments

| Argument | Required | Meaning |
|---|---|---|
| `channel-handle` | required | Channel folder under `channels/`. |
| `video-slug` | required | Folder under `channels/<channel-handle>/scripts/`. |

## Workflow

1. Read `channel.config.yml`, then every file in `channels/<channel-handle>/scripts/<slug>/` and `channels/<channel-handle>/assets/LICENSES.md`.
2. If `engine/scripts/qa-publish.ts` exists (Prompt 08), run `npx tsx engine/scripts/qa-publish.ts channels/<channel-handle>/scripts/<slug>` and use its results. Otherwise apply skill **policy-and-monetisation-qa** with the **compliance** agent (read-only) evaluating each rule:

   | id | FAIL when |
   |---|---|
   | `generic-script` | fewer than 3 specific examples, numbers, demonstrations or sources |
   | `unsourced-claims` | any factual claim lacks a `[S<n>]` source or remains under "Needs verification" |
   | `disclosure` | affiliate, sponsor or product links exist without a disclosure line in description and script |
   | `promise-delivered` | the title/thumbnail promise is not delivered in the first 2 minutes of `script.md` |
   | `shorts-standalone` | any Short in `shorts.json` has `stands_alone: no` |
   | `licences` | any manifest asset lacks a row in `assets/LICENSES.md`; every `stock-licensed` scene needs a `licenceRef` matching a row there |
   | `stock-share` | scenes typed `stock-licensed` exceed 50% of total `durationFrames` |
   | `reused-content` | the video is mostly third-party material without substantial original commentary |
   | `fake-demo` | a manifest scene claims a demonstration with no recorded source asset |
   | `kids-boundary` | content could reasonably be seen as directed at children (WARN unless the channel is made-for-kids) |
   | `ai-disclosure` | realistic altered/synthetic media is present and no disclosure decision is recorded (VERIFY current YouTube rules) |

3. Write `qa-report.json` as `{ "video": "<slug>", "checked_at": "<ISO date>", "overall": "PASS|WARN|FAIL", "rules": [{ "id", "status": "PASS|WARN|FAIL", "reason", "fix" }] }` and a readable `qa-report.md`.
4. If any FAIL: stop, list the fixes, and do not create the approval file.
5. If no FAIL: create `human-approval.json` as `{ "approved": false, "approved_by": "", "approved_at": "", "notes": "" }` (the pre-publish hook re-checks the report) and ask the user to set `approved: true` and their name themselves. Never fill these fields for the user.
6. When the user confirms they edited it, re-read the file; run `npm run check:publish -- <channel-handle> <slug>`. Only if both pass, set the plan item status to `ready-to-publish` in `content-plan/90-day-plan.json`.

## Outputs

Under `channels/<channel-handle>/scripts/<slug>/`: `qa-report.json`, `qa-report.md`, `human-approval.json` (template only). Status update in `channels/<channel-handle>/content-plan/90-day-plan.json`.

## Engine references

- `engine/policies/originality.md`, `engine/policies/disclosure.md`, `engine/policies/monetisation.md`, `engine/policies/kids-content.md`, `engine/policies/policies.yml` (Prompt 03/08 thresholds)
- `engine/scripts/qa-publish.ts` (Prompt 08), `.claude/hooks/pre-publish-check.sh`

## Quality checks

- PASS: every rule in the table has a status and a reason; every FAIL has a concrete fix.
- PASS: `npm run check:publish` prints OK before status changes.
- FAIL: status set to `ready-to-publish` with any FAIL or without `approved: true` written by the user.
- FAIL: any upload, post or scheduling action. This command never publishes.
