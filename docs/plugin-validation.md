# Plugin validation

How to check the plugin before committing or publishing. Commands verified against Claude Code 2.1.304 and the official [plugin manifest reference](https://code.claude.com/docs/en/plugins-reference) on 2026-10-21.

## 1. Manifest and components

```bash
claude plugin validate .
```

- Reports `Validation passed`, `Validation passed with warnings` or `Validation failed`.
- `--strict` turns warnings into failures (use in CI). `--json` prints a machine-readable report.
- Checks `plugin.json` types, that every component path starts with `./`, exists and stays inside the plugin root, and the skills/agents/commands it points to.
- `npm run validate:plugin` runs the same command.

This repo keeps components in `.claude/` and `plugin.json` points at them (`"commands": "./.claude/commands/"`, explicit `agents` and `skills` lists, inline `hooks`). See `docs/distribution-layout.md`.

## 2. Repo audit (frontmatter, sections, executables)

```bash
npm run audit
```

`scripts/audit-repo.sh` checks, per component:

| Component | Frontmatter keys | Required sections |
|---|---|---|
| Commands (`.claude/commands/*.md`) | `description`, `argument-hint`, `allowed-tools`, `disable-model-invocation` | Objective, Arguments, Workflow, Outputs, Engine references, Quality checks; uses `$ARGUMENTS` |
| Skills (`.claude/skills/<name>/SKILL.md`) | `name` = folder, `description`, `version`, `argument-hint`, `user-invocable`, `allowed-tools` | Objective, Arguments, Inputs, Workflow, Outputs, References, Quality checks, Failure conditions |
| Agents (`.claude/agents/*.md`) | `name` = file, `description`, `tools`, `model` | Role boundary; compliance has no Write/Edit/Bash |
| Hooks (`.claude/hooks/*.sh`) | executable, `bash -n` clean | registered in `.claude/settings.json` and `plugin.json` |

It also fails if any tracked file still contains the scaffold placeholder marker (the words `CLAUDE:` and `Replace` joined by a space).

## 3. Hook gates (no Claude needed)

Each gate exits `0` (pass), or `2` with `BLOCKED: <reason>` on stderr. Exit 2 is the documented blocking code; exit 1 would not block.

```bash
npm run check:script -- example-channel demo-video     # expect BLOCKED: missing .../brief.json
npm run check:render -- example-channel demo-video     # expect BLOCKED: missing .../script.md
npm run check:publish -- example-channel demo-video    # expect BLOCKED: missing .../packaging.json
npm run check:setup                                    # prints nothing when setup is complete
```

Hook mode (simulated PreToolUse stdin):

```bash
echo '{"tool_input":{"file_path":"channels/example-channel/scripts/demo-video/script.md"}}' \
  | CLAUDE_PROJECT_DIR=$PWD bash .claude/hooks/pre-script-check.sh; echo "exit=$?"
```

Watch hooks fire live with `claude --debug`.

## 4. Dry-run each command

Run in a session started at the repo root (`claude`) or with the plugin loaded (`claude --plugin-dir .`; commands are then namespaced `/dawn-makes-motion:<name>`). Use a throwaway channel so nothing real changes, then delete its folder.

| Command | Dry run | Expected |
|---|---|---|
| `/setup-engine` | `/setup-engine --skip-extras` | Prereq table; asks before any install; writes `output/engine-status.md` |
| `/init-channel` | `/init-channel test-channel "home espresso"` | Files under `channels/test-channel/` only; config validates |
| `/plan-content` | `/plan-content test-channel 2` | 2 long-form + 6 Shorts, all `planned` |
| `/script-video` | `/script-video test-channel week-1` | Stops: item not `approved` |
| `/build-video` | `/build-video test-channel missing-slug` | Stops at the pre-render gate |
| `/clip-shorts` | `/clip-shorts test-channel missing-slug` | Stops: no render |
| `/qa-publish` | `/qa-publish test-channel missing-slug` | Stops: script/packaging missing; no approval file |
| `/score-viral` | `/score-viral test-channel missing-slug` | Stops and lists missing files |

## 5. Unverified items

- Agent `tools` permission specifiers (`Bash(npm run *)`) are not used; the producer has plain `Bash` and its role boundary limits the commands. VERIFY in the subagents docs before tightening.
- `${user_config.template_repo}` substitution in command bodies applies only when loaded as a plugin; in the repo itself the literal text remains and `/setup-engine` treats it as unconfigured.
- Cowork runs plugin skills and commands; whether it runs shell hooks and local ffmpeg/Remotion depends on the Cowork environment: VERIFY before relying on the gates there.
