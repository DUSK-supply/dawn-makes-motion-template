# Distribution layout

## Current layout (source of truth)

Components live in `.claude/`, where Claude Code loads them as project components when the repo is the working directory:

```
.claude/
  commands/<name>.md          8 commands
  skills/<name>/SKILL.md      7 plugin skills (+ dev-only remotion-* symlinks)
  agents/<name>.md            5 agents
  hooks/<name>.sh             gates, registered in .claude/settings.json
  settings.json
.claude-plugin/plugin.json    manifest only
```

`plugin.json` points at the same files (`commands`, `agents`, `skills` paths and inline `hooks` using `${CLAUDE_PLUGIN_ROOT}`), so the repo root also installs as a plugin (`claude --plugin-dir .` or via a marketplace) with no copy step. The hook scripts skip themselves when a project already registers its own copy, so each gate fires once.

## Conventional public layout

For public distribution, plugin components normally sit at the plugin root:

```
dist/plugin/
  .claude-plugin/plugin.json
  commands/  skills/  agents/
  hooks/hooks.json            hooks config
  scripts/                    hook scripts
  README.md  LICENSE
```

Reasons to ship that layout too: reviewers and tools expect it, default discovery works without custom paths, and the plugin does not have to carry the engine, channels or dev-only skills.

## Build: `engine/scripts/build-plugin.ts`

Implemented. `npm run build:plugin` deletes and recreates `dist/plugin` and `dist/template` (`dist/` is gitignored; `buildPlugin({ root, out })` refuses an `out` outside `root`).

| Source | Destination |
|---|---|
| `.claude/commands/*.md` | `dist/plugin/commands/` |
| `.claude/skills/<7 plugin skills>` (from `plugin.json` `skills`) | `dist/plugin/skills/` (`remotion-*` symlinks are not shipped) |
| `.claude/agents/*.md` | `dist/plugin/agents/` |
| `.claude/hooks/*.sh`, `.claude/hooks/lib/` | `dist/plugin/scripts/` (executable bit kept) |
| `.claude-plugin/plugin.json` | `dist/plugin/.claude-plugin/plugin.json`: no `commands`/`agents`/`skills` keys, inline `hooks` rewritten to `"${CLAUDE_PLUGIN_ROOT}"/scripts/<name>.sh`, `template_repo` default set to the DUSK Supply template |
| `.claude-plugin/marketplace.json` | `dist/plugin/.claude-plugin/marketplace.json` |
| `README.md`, `LICENSE`, `THIRD_PARTY_NOTICES.md` | `dist/plugin/` |
| `git ls-files` minus `engine/scripts/build-plugin*.ts`, `docs/superpowers/`, `docs/archive/`, `docs/prompt-*.md`, `.agents/`, `.claude/skills/remotion-*`, `skills-lock.json`, `docs/publish-dusk-supply.md`, `dist/`, example channels | `dist/template/` (plus an empty `channels/.gitkeep`) |

Then run `claude plugin validate dist/plugin --strict`. Publishing steps: `docs/publish-dusk-supply.md`.
