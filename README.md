# Dawn Makes Motion

A DUSK Supply plugin for faceless YouTube channels.

Local-first Claude Code plugin and repo template for operating faceless YouTube channels.

## What it is

One plugin that works in Claude Code and Cowork, plus a repo template, for running faceless channels end to end: niche research, branding, 90-day planning, scripting, packaging, rendering (Remotion + FFmpeg), Shorts clipping, heuristic scoring and pre-publish QA. The core workflow needs no paid API; ElevenLabs, Higgsfield and similar are optional adapters in `engine/providers/`.

Each channel lives in its own folder under `channels/<channel-handle>/` (brand, strategy, content plan, scripts, assets, renders, shorts).

## Requirements

- Node 24 (`.nvmrc`), npm, git
- ffmpeg on `PATH` (render, clip and subtitle steps only)
- Claude Code or Cowork to use the plugin; `claude` CLI for `npm run validate:plugin`
- Optional: Docker, for a containerised Node + ffmpeg toolchain

## Quickstart

```bash
npm ci
npm run validate        # sample manifest + schema tests
npm run audit           # repo layout and hygiene checks
npm run remotion:studio # preview compositions
```

Open this folder in Claude Code (`claude`) to use the commands as project components, or load it as a plugin with `claude --plugin-dir .` (commands become `/dawn-makes-motion:<name>`).

Or install from the marketplace:

```
/plugin marketplace add DUSK-supply/dawn-makes-motion
/plugin install dawn-makes-motion@dusk-supply
```

### First run: `/setup-engine`

After installing the plugin, run `/setup-engine` (a session-start hook reminds you while anything is missing). With your approval at each step it:

1. checks Node, npm, git and ffmpeg;
2. clones the engine template into your project (URL from the plugin option *Engine template repository*);
3. runs `npm ci`;
4. sets up Higgsfield for image/video generation: `npm i -g @higgsfield/cli`, `higgsfield auth login` (you finish sign-in in the browser), `npx skills add higgsfield-ai/skills`;
5. offers optional video skills (manim-video, explainer-video-skills, video-shotcraft, taste-application, social-publisher);
6. validates channel configs and writes `output/engine-status.md`.

See `docs/plugin-validation.md` and `docs/distribution-layout.md`.

## Layout

| Path | Contents |
|---|---|
| `.claude-plugin/plugin.json`, `marketplace.json` | Plugin manifest and DUSK Supply marketplace listing (only files in that folder) |
| `.claude/skills/<name>/SKILL.md` | 7 plugin skills (+ dev-only `remotion-*`) |
| `.claude/commands/*.md` | 8 slash commands |
| `.claude/agents/*.md` | 5 subagents (compliance is read-only) |
| `.claude/hooks/`, `.claude/settings.json` | Pre-script, pre-render, pre-publish gates and session setup check |
| `.mcp.json` | MCP servers (none by default) |
| `engine/` | Schemas, policies, scoring, prompts, ffmpeg, Remotion, TypeScript tooling, optional providers |
| `channels/<slug>/` | Per-channel config, brand, strategy, content-plan, scripts, assets, renders, shorts, episodes |
| `template/` | Files copied into a new user project by `/setup-engine` |
| `docs/` | Setup, architecture, git hygiene |
| `output/` | Render output (git-ignored) |

## Commands

| Command | Does | Needs shell |
|---|---|---|
| `/setup-engine` | Check Node, ffmpeg, git and channel configs | yes |
| `/init-channel` | Channel identity, pillars, visual rules | no |
| `/plan-content` | 13-week content calendar | no |
| `/script-video` | Retention-structured script | no |
| `/build-video` | Render with Remotion + ffmpeg | yes |
| `/clip-shorts` | Standalone Shorts from owned long-form | yes |
| `/qa-publish` | Originality, disclosure and packaging QA | no |
| `/score-viral` | Heuristic packaging/retention score | no |

## Validation

| Script | Checks |
|---|---|
| `npm run typecheck` | TypeScript, strict |
| `npm run lint` | Typecheck + shell syntax |
| `npm test` | Schemas compile; sample manifest and channel configs validate |
| `npm run validate:episode` | Sample episode manifest |
| `npm run config -- <path>` | Channel config against `channel-profile` schema |
| `npm run validate:plugin` | `claude plugin validate .` |
| `npm run audit` | Layout, frontmatter, executable bits, tracked files, corrupted URLs, absolute paths |

Make targets: `make setup | validate | studio | render | clean`. Docker: `docker compose run --rm engine`.

## Licence

MIT — see [LICENSE](LICENSE).

## Disclaimer

This is a production toolkit, not a growth guarantee. Nothing here guarantees that any video will go viral, be monetised or earn income. Scores are heuristics. You are responsible for following YouTube's policies, disclosure rules and the law in your jurisdiction.

See [ROADMAP.md](ROADMAP.md) for planned work.
