---
name: niche-research
description: Evaluates a YouTube niche's demand, competition and monetisation fit from cited evidence, and studies competitor packaging, pacing and format patterns without copying them. Use when asked to "research a niche", "validate a channel idea", "find competitors" or "analyse outlier videos", or from /init-channel.
version: 0.2.0
argument-hint: "<channel-handle> \"<niche or topics>\""
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch
---

# niche-research

Apply to: $ARGUMENTS

## Objective

An evidence-based niche brief: who watches, what already works and why, where the gap is, and how the niche can earn, with every claim cited and every estimate labelled.

## Arguments

- `channel-handle` (required): output goes to `channels/<channel-handle>/strategy/`.
- `niche or topics` (required unless `channels/<channel-handle>/channel.config.yml` lists `niche`).

## Inputs

- `channels/<channel-handle>/channel.config.yml` (niche, tone, format)
- `engine/policies/originality.md`, `engine/policies/kids-content.md`, `engine/policies/monetisation.md`

## Workflow

1. Read the channel config and the policies above.
2. Search for 5-10 channels and 10+ recent videos in the niche, including small-channel outliers (views far above subscriber count). Record handle, URL, upload cadence, typical length, title pattern, thumbnail pattern, pacing and why it works.
3. Separate observed evidence (with URL) from your inference (labelled "Assumption").
4. Rate demand, competition and monetisation fit 1-5 with one-line reasons. Label any CPM/RPM figure "estimate" with its source.
5. Identify 3 differentiation gaps the channel can own without copying any competitor.
6. Flag kids-directed risk: if topics could attract children, state how positioning keeps the channel general-audience.

## Outputs

- `channels/<channel-handle>/strategy/niche-brief.md` (ratings, gaps, risks)
- `channels/<channel-handle>/strategy/sources.md` (appended: id, title, URL, publisher, access date)

## References

- `engine/policies/originality.md`, `engine/policies/kids-content.md`, `engine/policies/monetisation.md`
- `engine/schemas/channel-profile.schema.json`

## Quality checks

- PASS: every competitor claim cites a URL in `strategy/sources.md` with an access date.
- PASS: every monetary figure is labelled "estimate" with a source.
- PASS: at least 5 competitors analysed, each with a "why it works" line.
- FAIL: competitor scripts, names, characters or thumbnails reproduced; platform rules stated as fact without `VERIFY`.

## Failure conditions

- No niche given and none in the config: stop and ask for it.
- Web search unavailable: stop and say research could not be performed; do not invent competitors.
