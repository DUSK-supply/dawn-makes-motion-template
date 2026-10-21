---
description: First-run setup after installing the plugin - check Node/ffmpeg/git, clone the engine template (with approval), install dependencies, set up Higgsfield and optional video skills, then validate. Needs a local shell.
argument-hint: "[channel-handle] [--target <dir>] [--skip-higgsfield] [--skip-extras]"
allowed-tools: Read, Write, Glob, Grep, AskUserQuestion, Bash(node --version), Bash(npm --version), Bash(git --version), Bash(ffmpeg -version), Bash(ffprobe -version), Bash(git clone:*), Bash(npm ci), Bash(npm install), Bash(npm run:*), Bash(npm i -g @higgsfield/cli), Bash(higgsfield:*), Bash(npx --yes skills add:*), Bash(npx tsx engine/scripts/transcribe.ts:*), Bash(ls:*), Bash(test:*)
disable-model-invocation: false
---

# /setup-engine

Arguments: $ARGUMENTS

## Objective

Take a fresh install of the Dawn Makes Motion plugin to a working local engine: prerequisites present, engine template in the project, dependencies installed, Higgsfield ready for image/video generation, and `npm run validate` passing. Idempotent: every step checks first and skips work already done.

## Arguments

| Argument | Required | Meaning |
|---|---|---|
| `channel-handle` | optional | Also check `channels/<channel-handle>/channel.config.yml`. Default: every folder in `channels/`. |
| `--target <dir>` | optional | Where to clone the engine template when the current project has no `engine/`. Default: the current project directory if empty, otherwise ask. |
| `--skip-higgsfield` | optional | Skip step 4. |
| `--skip-extras` | optional | Skip step 5. |

Template repository: `${user_config.template_repo}`. If that text is still a literal `${user_config...}` placeholder or contains `OWNER`, the template URL is not configured yet.

## Workflow

Report each step as PASS / FIXED / SKIPPED / FAIL. Never install, clone or sign in without the user's explicit approval for that step (use AskUserQuestion). Never print tokens or secrets.

1. **Prerequisites.** Run `node --version` (need >= 24, see `.nvmrc`), `npm --version`, `git --version`, `ffmpeg -version`, `ffprobe -version`. For each missing tool, record the fix (macOS: `brew install node ffmpeg git`; others: official installers) and continue; ffmpeg is only needed for rendering.
2. **Engine template.** If the project already has `engine/`, `channels/` and a `package.json` whose `name` is `faceless-youtube-engine`, mark PASS. Otherwise:
   - If the template URL is not configured, stop this step and tell the user to set it with `/config` (plugin option "Engine template repository") or pass the URL; mark FAIL.
   - Ask: "Clone the Dawn Makes Motion template from <url> into <target>? The plugin's commands need it." Options: Clone (recommended) / Choose another folder / Skip.
   - On approval run `git clone <url> <target>`. Refuse if `<target>` exists and is not empty. After cloning, tell the user to open `<target>` as the project folder (Claude Code: `cd <target> && claude`; Cowork: select the folder).
3. **Dependencies.** In the engine project run `npm ci` (fall back to `npm install` only if there is no `package-lock.json`). Copy `.env.example` to `.env` only if `.env` is absent, and never fill values.
4. **Higgsfield** (unless `--skip-higgsfield`). Ask once for approval to: (a) install the CLI, (b) open the browser sign-in, (c) install the companion skills. Then:
   1. `higgsfield --version`; if missing run `npm i -g @higgsfield/cli`.
   2. `higgsfield auth token >/dev/null 2>&1` (exit status only, never show the token); if it fails run `higgsfield auth login` and tell the user to finish sign-in in the browser it opens, then re-check.
   3. If `~/.claude/skills/higgsfield-generate` is absent, run `npx --yes skills add higgsfield-ai/skills -g -a claude-code -s '*' -y`.
   4. Confirm with `higgsfield model list --video | head -5`. Generation spends Higgsfield credits: note that every later generation step asks first.
5. **Optional video skills** (unless `--skip-extras`). Ask with a multi-select which to install (user-level, `-g -a claude-code -y`):

   | Skill | Install command | Used by |
   |---|---|---|
   | manim-video | `npx --yes skills add affaan-m/ECC --skill manim-video -g -a claude-code -y` | /build-video explainer diagrams |
   | explainer-video-skills | `npx --yes skills add iart-ai/explainer-video-skills -g -a claude-code -s '*' -y` | /build-video whiteboard/isometric/diagram scenes |
   | video-shotcraft | `npx --yes skills add Vincentwei1021/video-shotcraft -g -a claude-code -y` | scene-manifest shot planning |
   | taste-application | `npx --yes skills add affaan-m/ECC --skill taste-application -g -a claude-code -y` | brand-identity visual direction |
   | social-publisher | `npx --yes skills add affaan-m/ECC --skill social-publisher -g -a claude-code -y` | PUBLISH-PACK cross-post captions (never auto-posts) |
   | media-use | VERIFY: several publishers use this name (e.g. `waker240/fullvideoproductionskill`, `zrong/skills`); ask the user which source they mean before installing | asset handling |

   Skills run with full agent permissions: tell the user to review them before use.
6. **Local transcription (optional).** Ask approval, then run `npx tsx engine/scripts/transcribe.ts --install` (downloads whisper.cpp and the small.en model into `.whisper/`, several hundred MB). Remotion licence for `@remotion/install-whisper-cpp`: VERIFY https://www.remotion.dev/license.
7. **Channel configs.** For each target channel run `npm run config -- channels/<handle>/channel.config.yml` (validates against `engine/schemas/channel-profile.schema.json`).
8. **Validate.** Run `npm run validate` and `npm run check:setup` (prints nothing when setup is complete).
9. **Report.** Write `output/engine-status.md` with a table of every step, its status and the fix for each FAIL, then tell the user "ready" only if no step is FAIL.

## Outputs

- `output/engine-status.md` (overwritten each run)
- `.env` (copied from `.env.example` only when missing; never committed)
- Engine template clone at `<target>/` (only with approval)

## Engine references

- `engine/schemas/channel-profile.schema.json`, `engine/scripts/read-channel-config.ts`
- `.claude/hooks/setup-check.sh` (same checks, run at session start)
- `docs/setup.md`, `docs/plugin-validation.md`

## Quality checks

- PASS: `npm run validate` exits 0.
- PASS: `npm run check:setup` prints nothing.
- PASS: every missing dependency in `output/engine-status.md` has a concrete fix.
- FAIL: anything was installed, cloned or signed in without approval.
- FAIL: a token, key or `.env` value appears in output or files.
- FAIL: the core path needs a paid service (Higgsfield is optional; local Remotion/ffmpeg must still work without it).
