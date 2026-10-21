# Git hygiene

- Never commit `node_modules/`, `.env` (only `.env.example`), renders, or media (`*.mp4`, `*.mov`, `*.wav`, `*.mp3`). Test fixtures may live under `engine/**/fixtures/`.
- `output/` and `channels/*/renders/` are ignored except their `.gitkeep`.
- `package-lock.json` is committed; install with `npm ci`.
- Line endings are normalised to LF by `.gitattributes`.
- Stage by explicit path; check `git status` before any broad `git add`.
- If an ignored path is already tracked, untrack it with `git rm -r --cached <path>` (files stay on disk).
- Never delete files during reorganisation: use `git mv` for tracked files and list every move.
- `npm run audit` fails on tracked generated files, files over 5 MB, corrupted `$schema` URLs and hard-coded home-directory paths. Run it before every commit.
