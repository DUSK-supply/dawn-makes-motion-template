---
description: Create or refresh a channel's identity, brand tokens, strategy pack and first 12 ideas from a niche brief, using web research for competitor structure only. Document-only; no shell needed beyond validation.
argument-hint: "<channel-handle> \"<niche or topics>\" [\"<audience>\"]"
allowed-tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Task, Bash(npm run config:*), Bash(npm run validate:file:*), Bash(mkdir -p channels/*)
disable-model-invocation: false
---

# /init-channel

Arguments: $ARGUMENTS

## Objective

Produce a differentiated, policy-safe channel system under `channels/<channel-handle>/`: identity, brand tokens usable by Remotion, positioning, monetisation, packaging/Shorts rules, A/B test metrics and the first 12 long-form ideas.

## Arguments

| Argument | Required | Meaning |
|---|---|---|
| `channel-handle` | required | kebab-case folder name, e.g. `example-channel`. |
| `niche or topics` | required unless `channel.config.yml` already lists `niche` | Topics/pillars to research. |
| `audience` | optional | Target viewer; otherwise derived from research and confirmed with the user. |

Stop and ask if the handle is missing or not kebab-case.

## Workflow

1. Read `channels/<channel-handle>/channel.config.yml` if it exists (`npm run config -- channels/<channel-handle>/channel.config.yml`). If the folder is missing, create the standard skeleton: `brand/ strategy/ content-plan/ scripts/ assets/ renders/ shorts/ tracking/`.
2. Read `engine/policies/originality.md`, `engine/policies/kids-content.md`, `engine/policies/monetisation.md`, `engine/policies/disclosure.md`.
3. Delegate competitor research to the **researcher** agent (skill **niche-research**): 5-10 successful channels in the niche, recording handle, URL, packaging/pacing/format patterns and why each works. Never copy scripts, characters, footage, names or thumbnails. Save to `strategy/sources.md`.
4. Delegate positioning to the **strategist** agent, then apply skill **brand-identity** to write the brand files.
5. Write the strategy pack (list below). Mark every platform rule, threshold, price or licence not verified from the official source in this session as `VERIFY (<intended source URL>)`.
6. Update `channel.config.yml` (name, handle, niche, tone, format, publishing) and validate it with `npm run config -- channels/<channel-handle>/channel.config.yml`.
7. Write `content-plan/ideas.md`: 12 long-form ideas, each with search or curiosity angle and monetisation relevance.
8. If the niche could attract children (animals, science, cartoons), add an explicit "not made for kids" positioning section to `brand/identity.md` and a risk entry in `strategy/positioning.md`.

## Outputs

All under `channels/<channel-handle>/`:

- `channel.config.yml`
- `brand/identity.md` (5 name options with handle/domain checks marked VERIFY, slogan, audience profile, 4 pillars, unique mechanism, voice and tone, in/out of scope)
- `brand/brand.json` (colours with contrast-checked text pairs, openly licensed fonts, logo/avatar/banner brief, caption style, intro/outro rules)
- `strategy/positioning.md`, `strategy/monetisation.md`, `strategy/packaging-rules.md`, `strategy/shorts-rules.md`, `strategy/test-metrics.md`, `strategy/sources.md`
- `content-plan/ideas.md`

## Engine references

- `engine/schemas/channel-profile.schema.json` (via `npm run config`)
- `engine/policies/*.md`
- `.claude/skills/niche-research/SKILL.md`, `.claude/skills/brand-identity/SKILL.md`

## Quality checks

- PASS: `npm run config -- channels/<channel-handle>/channel.config.yml` exits 0.
- PASS: every text/background pair in `brand.json` has a stated contrast ratio >= 4.5:1.
- PASS: every competitor claim cites a URL in `strategy/sources.md`.
- PASS: exactly 12 ideas, each with angle and monetisation relevance.
- FAIL: any platform rule stated as fact without `VERIFY` or an official source.
- FAIL: copied names, characters, scripts or thumbnails from a competitor; any income or growth promise.
- FAIL: anything written outside `channels/<channel-handle>/`.
