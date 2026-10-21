# Architecture

## Two roles, one repo

- **Plugin** (`.claude/` + `.claude-plugin/plugin.json`): `.claude/commands/`, `.claude/skills/`, `.claude/agents/`, `.claude/hooks/` (registered in `.claude/settings.json`). `plugin.json` points at the same files, so the repo works as project components and as an installed plugin. See `docs/distribution-layout.md`.
- **Tooling** (`engine/`): schemas, policies, scoring, prompts, ffmpeg wrappers, Remotion app, TypeScript scripts, optional providers.

Rule: `engine/` holds the tooling; `template/` holds only the files copied into a new user's project. Nothing is duplicated between them.

## Flow

```
/setup-engine  → prereqs, template clone, npm ci, Higgsfield, extras   → output/engine-status.md
/init-channel  → niche-research, brand-identity (researcher, strategist) → channels/<h>/brand, strategy, content-plan/ideas.md
/plan-content  → 90-day-planning (strategist)                          → channels/<h>/content-plan/90-day-plan.*
/script-video  → scriptwriting (researcher, editor)  [pre-script gate] → channels/<h>/scripts/<slug>/{brief.json,sources.md,script.md,scene-manifest.json,visual-notes.md}
/build-video   → Remotion + ffmpeg (producer)        [pre-render gate] → channels/<h>/renders/<slug>/long.mp4
/clip-shorts   → shorts-clipping (editor, producer)                    → channels/<h>/shorts/<slug>/, scripts/<slug>/shorts.json
/score-viral   → heuristic rubric                                       → channels/<h>/scripts/<slug>/score.json
/qa-publish    → policy-and-monetisation-qa (compliance) [pre-publish gate] → scripts/<slug>/qa-report.*, human-approval.json
```

Commands read `channels/<h>/channel.config.yml` and write only inside `channels/<h>/` or `output/`.

## Hooks

Registered in `.claude/settings.json` (project) and inline in `plugin.json` (plugin). Scripts in `.claude/hooks/`:

| Script | Event | Fires on | Blocks when |
|---|---|---|---|
| `pre-script-check.sh` | PreToolUse Write/Edit | `channels/*/scripts/*/script.md` | channel config, `brief.json` or `sources.md` missing |
| `pre-render-check.sh` | PreToolUse Bash | a command starting `remotion render`, `render-episode` or `bash engine/ffmpeg/` | ffmpeg missing; script or scene manifest missing or schema-invalid |
| `pre-publish-check.sh` | PreToolUse Write/Edit | `scripts/*/human-approval.json`, `renders/*/PUBLISH-PACK.md` | packaging missing, QA report missing or has FAIL, affiliate links without disclosure |
| `setup-check.sh` | SessionStart (startup) | every new session | never blocks; tells Claude what `/setup-engine` still needs |

Gates read hook JSON on stdin or take `<channel> <slug>` args (`npm run check:*`), resolve paths from `CLAUDE_PROJECT_DIR`, exit 0 for unrelated calls and exit **2** with `BLOCKED: <reason>` on stderr to block.

## Engine

- TypeScript strict, ESM, run with `tsx`. Validation with `ajv` 2020-12 + `ajv-formats` (`engine/scripts/ajv.ts`).
- Remotion app in `engine/remotion/`; `remotion.config.ts` sits at the repo root because the CLI reads it from there, and sets the entry point and `output/`.
- ffmpeg wrappers take explicit input/output arguments, use `set -euo pipefail` and print usage on bad arguments.
- `engine/providers/` is reserved for optional paid adapters (ElevenLabs, Higgsfield). Nothing in the core workflow imports them.
- LLM providers (`engine/providers/llm/`) are for optional headless batch use; Claude commands remain the default and validate/score scripts never call them.

## Ported engines

Optional adapters, all credited in `THIRD_PARTY_NOTICES.md`; the core workflow runs without them.

- Narration: `engine/providers/narration/` (Edge, ElevenLabs) via `engine/scripts/narrate.ts`.
- Captions / transcribe: `engine/captions/` (alignment, SRT) and `engine/providers/transcribe/whisper.ts` via `engine/scripts/transcribe.ts`.
- LLM presets: `engine/providers/llm/` (OpenAI-compatible providers).
- Stock footage: `engine/providers/stock/` (Pexels, Pixabay, licence recording) via `engine/scripts/stock-search.ts`.

## Dev-only skills

`.claude/skills/remotion-*` are symlinks to Remotion's agent skills in `.agents/` (tracked via `skills-lock.json`). They load as project skills when developing this repo but are not listed in `plugin.json`. Third-party video skills and Higgsfield skills are installed at user level by `/setup-engine`, not vendored.
