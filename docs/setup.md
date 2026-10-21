# Setup

## Local development (this repo)

```bash
nvm use            # Node 24 from .nvmrc
npm ci
npm run validate
npm run audit
claude --plugin-dir .   # load the plugin from this checkout
```

ffmpeg must be on `PATH` for render, clip and subtitle steps. Without libass, `engine/ffmpeg/subtitles.sh` adds soft subtitles instead of burning them in.

## Optional API keys

Set in `.env` (see `.env.example`); all are optional: `ELEVENLABS_API_KEY` (paid narration), `PEXELS_API_KEY` and `PIXABAY_API_KEY` (stock search), and LLM keys (`OPENAI_API_KEY`, `MOONSHOT_API_KEY`, `DEEPSEEK_API_KEY`, `GEMINI_API_KEY` with `FYE_LLM_PROVIDER`). Nothing paid is called without your approval.

## Provisioning design for `/setup-engine` (not implemented yet)

Goal: give a user a ready project folder from the plugin, with no shell state or aliases assumed.

1. **Choose target.** Ask for an absolute folder path. Refuse a non-empty folder unless the user confirms; never overwrite existing files.
2. **Check prerequisites.** `node --version` (major ≥ 24), `npm --version`, `git --version`, `ffmpeg -version`. Missing ffmpeg is a warning (document-only commands still work); missing Node or git stops setup with install guidance.
3. **Copy the template.** Copy `${CLAUDE_PLUGIN_ROOT}/template/` into the target (or `git clone` the template repo when a URL is given). The template carries only user-project files: `package.json`, `package-lock.json`, `tsconfig.json`, `remotion.config.ts`, `.gitignore`, `.gitattributes`, `.nvmrc`, `.env.example`, `channels/` skeleton, `output/.gitkeep`. Tooling stays in the plugin's `engine/` and is referenced via `${CLAUDE_PLUGIN_ROOT}`.
4. **Environment.** Create `.env` from `.env.example` only if `.env` does not exist. Never print or log its values. All keys are optional.
5. **Install.** `npm ci` in the target.
6. **Initialise git** if the folder is not a repo (`git init`, no remote, no commit).
7. **Verify.** Run `npm run audit` and report PASS/FAIL lines.

Cowork: steps 2, 5, 6, 7 and 8 need a local shell. Without one, `/setup-engine` stops after step 3 and lists the shell steps for the user.

Open design point: the template currently holds only `.gitkeep`. Populating it, and keeping it in sync with the root files, is Phase 6.
