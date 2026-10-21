---
name: policy-and-monetisation-qa
description: Checks a video package against originality, reused-content, sourcing, disclosure, packaging-honesty, licence, kids-content and AI-disclosure rules, returning PASS/WARN/FAIL per rule with fixes. Use when asked to "check before publishing", "run QA", "is this monetisable", "check disclosures" or "compliance review", or from /qa-publish.
version: 0.2.0
argument-hint: "<channel-handle> <video-slug>"
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep
---

# policy-and-monetisation-qa

Apply to: $ARGUMENTS

## Objective

A clear, fixable QA verdict that blocks risky or misleading videos before a human approves them. The rules are a safety net, not legal advice.

## Arguments

- `channel-handle`, `video-slug` (both required).

## Inputs

- Every file in `channels/<channel-handle>/scripts/<slug>/` (script, sources, scene-manifest, packaging, shorts)
- `channels/<channel-handle>/assets/LICENSES.md`, `channel.config.yml`
- `engine/policies/*.md` and `engine/policies/policies.yml` thresholds (Prompt 03/08)

## Workflow

1. Read the inputs and policies.
2. Evaluate each rule listed in `.claude/commands/qa-publish.md` (generic-script, unsourced-claims, disclosure, promise-delivered, shorts-standalone, licences, stock-share, reused-content, fake-demo, kids-boundary, ai-disclosure). Cite the file and line for every FAIL or WARN.
3. Monetisation fit: note advertiser-friendliness risks and affiliate placement; mark any YouTube Partner Programme threshold or policy detail `VERIFY` with the official Help URL.
4. Overall = FAIL if any rule FAILs, WARN if any WARN, else PASS.

## Outputs

- `channels/<channel-handle>/scripts/<slug>/qa-report.json` and `qa-report.md` (format defined in `/qa-publish`)

## References

- `engine/policies/originality.md`, `engine/policies/disclosure.md`, `engine/policies/monetisation.md`, `engine/policies/kids-content.md`
- `engine/scripts/qa-publish.ts` (Prompt 08), `.claude/hooks/pre-publish-check.sh`

## Quality checks

- PASS: every rule has status, reason and (for FAIL/WARN) a concrete fix.
- PASS: every platform or legal statement is sourced or marked `VERIFY`.
- FAIL: any earnings claim left unflagged; a FAIL downgraded to WARN without justification.

## Failure conditions

- Script or packaging missing: stop and list them; do not produce a partial PASS.
