---
name: brand-identity
description: Builds a channel's brand system - names, slogan, audience, pillars, unique mechanism, voice, and Remotion-ready brand tokens with contrast-checked colours and openly licensed fonts. Use when asked to "create a channel brand", "name the channel", "define the voice", "make brand.json" or "refresh the brand", or from /init-channel.
version: 0.2.0
argument-hint: "<channel-handle>"
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm run config:*)
---

# brand-identity

Apply to: $ARGUMENTS

## Objective

A distinctive, consistent brand that renders in Remotion from `brand.json` and is clearly different from every other channel in `channels/` so A/B tests are not confounded.

## Arguments

- `channel-handle` (required).

## Inputs

- `channels/<channel-handle>/channel.config.yml`
- `channels/<channel-handle>/strategy/niche-brief.md` (from niche-research; stop if missing)
- Other channels' `channels/*/brand/brand.json` (to stay visually distinct)
- `engine/policies/kids-content.md`

## Workflow

1. Read the inputs. If the `taste-application` skill is installed, use it for the visual direction.
2. Draft 5 name options; for each note YouTube handle and domain checks as `VERIFY` (availability cannot be checked here).
3. Write slogan, audience profile, 4 content pillars, the unique mechanism (the repeatable thing only this channel does), voice and tone (do / don't examples), in-scope and out-of-scope lists.
4. Write `brand.json`: `name`, `handle`, `colors` (hex) with `textPairs` each listing foreground, background and computed contrast ratio, `fonts` with licence (SIL OFL or similar) and source URL, `logo`/`avatar`/`banner` briefs, `captions` style (font, size, position, highlight colour), `intro`/`outro` rules.
5. Compute WCAG contrast for every text pair; replace any pair under 4.5:1.
6. Compare with other channels' `brand.json`; change palette or type if they could be confused.

## Outputs

- `channels/<channel-handle>/brand/identity.md`
- `channels/<channel-handle>/brand/brand.json`

## References

- `engine/remotion/compositions/EpisodeTemplate.tsx` (consumes brand tokens; Prompt 04 adds the brand token schema)
- `engine/policies/kids-content.md`, `engine/policies/originality.md`

## Quality checks

- PASS: every text pair >= 4.5:1 with the ratio written down.
- PASS: every font has a licence and source URL; no proprietary fonts.
- PASS: palette and type differ visibly from every other channel in `channels/`.
- FAIL: names, mascots or styles imitating an existing channel; earnings or growth claims in slogan or copy.

## Failure conditions

- `strategy/niche-brief.md` missing: stop and run niche-research first.
