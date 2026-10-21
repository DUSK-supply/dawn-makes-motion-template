---
description: Render an approved, scripted video locally - pre-render gate, asset check, Remotion render, loudness normalisation, captions and ffprobe report; optional Higgsfield visuals with approval. Needs a local shell (Node, ffmpeg).
argument-hint: "<channel-handle> <video-slug> [--thumbnails] [--higgsfield]"
allowed-tools: Read, Write, Edit, Glob, Grep, Task, AskUserQuestion, Bash(npm run check:render:*), Bash(npm run config:*), Bash(npm run validate:file:*), Bash(npx remotion render:*), Bash(npx remotion still:*), Bash(npx tsx engine/scripts/render-episode.ts:*), Bash(bash engine/ffmpeg/*:*), Bash(ffprobe:*), Bash(mkdir -p channels/*), Bash(higgsfield:*), Bash(npx tsx engine/scripts/transcribe.ts:*), Bash(npx tsx engine/scripts/narrate.ts:*), Bash(npx tsx engine/scripts/stock-search.ts:*)
disable-model-invocation: false
---

# /build-video

Arguments: $ARGUMENTS

## Objective

Turn `scene-manifest.json` plus user-supplied narration and recordings into `channels/<channel-handle>/renders/<slug>/long.mp4` (1920x1080), captions and an ffprobe report, with no fabricated or unlicensed media.

## Arguments

| Argument | Required | Meaning |
|---|---|---|
| `channel-handle` | required | Channel folder under `channels/`. |
| `video-slug` | required | Folder under `channels/<channel-handle>/scripts/`. |
| `--thumbnails` | optional | Also produce 3 thumbnail variants from `packaging.json` concepts. |
| `--higgsfield` | optional | Allow Higgsfield to generate scenes typed `generated` (asks before each paid batch). |

## Workflow

1. Read `channels/<channel-handle>/channel.config.yml` and `brand/brand.json`.
2. Run `npm run check:render -- <channel-handle> <slug>`. Stop on BLOCKED and show the reason.
3. Narration: choose with the user. Generated voice: `npx tsx engine/scripts/narrate.ts channels/<channel-handle>/scripts/<slug>/script.md --provider edge|elevenlabs --voice <id>` (Edge voices are `en-XX-...`; ask approval before any ElevenLabs paid usage; needs ELEVENLABS_API_KEY) writes `assets/audio/<slug>.mp3` and `<slug>.captions.json`. User-recorded voice: `npx tsx engine/scripts/transcribe.ts channels/<channel-handle>/assets/audio/<slug>.mp3 channels/<channel-handle>/scripts/<slug>/script.md` (install with `npx tsx engine/scripts/transcribe.ts --install`), then review the printed mismatches; it writes `<slug>.captions.json` and `<slug>.srt`. Then set `voiceoverPath` and `captionsPath` in `scene-manifest.json`. Stock clips are downloaded only with approval: `npx tsx engine/scripts/stock-search.ts <channel-handle> <slug> "<query>" --provider pexels|pixabay --orientation landscape --download <id>` (licence row written automatically).
4. Delegate to the **producer** agent. Asset check (including the narration audio and captions from step 3): list every path in `scene-manifest.json`. For each missing file, stop and list what the user must record or create (narration in `assets/audio/`, screen recordings in `assets/footage/`). Confirm each third-party asset has a row in `assets/LICENSES.md`.
5. Generated scenes: if `--higgsfield` and the user approves the credit spend, use the `higgsfield-generate` or `higgsfield-video-explainer` skill for scenes typed `generated`, saving into `channels/<channel-handle>/assets/generated/<slug>/` and recording model + prompt in `assets/LICENSES.md`. Diagram/explainer scenes may use `manim-video` or `explainer-video-skills` if installed. Never use generated media as evidence of a real result.
6. Render: if `engine/scripts/render-episode.ts` exists (Prompt 04), run `npx tsx engine/scripts/render-episode.ts channels/<channel-handle>/scripts/<slug>/scene-manifest.json`. Otherwise run `npx remotion render engine/remotion/index.ts EpisodeTemplate channels/<channel-handle>/renders/<slug>/raw.mp4 --props=channels/<channel-handle>/scripts/<slug>/scene-manifest.json`, then `bash engine/ffmpeg/loudnorm.sh <raw.mp4> <long.mp4>`.
7. Captions: use the captions from the narration step (step 3) and write `renders/<slug>/long.srt` from them (or from the manifest caption text and timings); burn only if the channel's caption style says so (`bash engine/ffmpeg/subtitles.sh <in> <srt> <out>`).
8. Run `ffprobe -v error -show_entries format=duration:stream=codec_name,width,height -of json <long.mp4>` and save to `renders/<slug>/ffprobe.json`.
9. `--thumbnails`: create `thumb-a.png`, `thumb-b.png`, `thumb-c.png` at 1280x720 from packaging concepts, using `npx remotion still` (original artwork) or the `higgsfield-youtube-thumbnail` skill with approval. Size limit `VERIFY` (believed 2 MB).
10. Write `renders/<slug>/build-notes.md`: commands run, durations, asset list with licences, manual follow-ups. Set the plan item status to `rendered`.

## Outputs

Under `channels/<channel-handle>/renders/<slug>/`: `long.mp4`, `long.srt`, `ffprobe.json`, `build-notes.md`, optional `thumb-a.png`, `thumb-b.png`, `thumb-c.png`. Generated assets in `channels/<channel-handle>/assets/generated/<slug>/`. Scratch output may go to `output/`. Renders are gitignored.

## Engine references

- `engine/remotion/index.ts`, `engine/remotion/Root.tsx`, `engine/remotion/compositions/EpisodeTemplate.tsx`
- `engine/scripts/render-episode.ts` (Prompt 04), `engine/ffmpeg/loudnorm.sh`, `engine/ffmpeg/subtitles.sh`, `engine/ffmpeg/render-1080p.sh`
- `engine/schemas/episode-manifest.schema.json`, `.claude/hooks/pre-render-check.sh`

## Quality checks

- PASS: `npm run check:render` prints OK; render exits 0.
- PASS: ffprobe shows 1920x1080, h264 + aac, duration within the plan's target range.
- PASS: every asset in the manifest exists and has a licence row (own, user-recorded, generated with model noted, or open licence with URL).
- FAIL: any missing asset replaced by a placeholder without telling the user; any unlicensed music, font, footage or image; any paid generation run without approval.
- FAIL: files written outside `channels/<channel-handle>/` or `output/`.
