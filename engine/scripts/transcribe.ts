import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { alignToScript } from '../captions/align.ts';
import { captionsToSrt } from '../captions/srt.ts';
import { installWhisper, transcribeToCaptions, WhisperMissingError, type EnglishModel } from '../providers/transcribe/whisper.ts';
import { loadDotEnv } from './env.ts';
import { narrationText } from './narrate.ts';

const USAGE = [
  'usage: npx tsx engine/scripts/transcribe.ts --install [base.en|small.en|medium.en]',
  '       npx tsx engine/scripts/transcribe.ts channels/<handle>/assets/audio/<file> channels/<handle>/scripts/<slug>/script.md',
].join('\n');
const AUDIO_PATH = /^channels\/[a-z0-9]+(?:-[a-z0-9]+)*\/assets\/audio\/[^/]+$/;

async function main(): Promise<void> {
  loadDotEnv();
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { install: { type: 'boolean' } } });
  try {
    if (values.install) {
      if (positionals.length > 1) throw new Error(USAGE);
      await installWhisper((positionals[0] ?? 'small.en') as EnglishModel);
      console.log('whisper.cpp and model installed in .whisper/');
      return;
    }
    const [audio, script] = positionals;
    if (!audio || !script || positionals.length !== 2 || !AUDIO_PATH.test(audio)) throw new Error(USAGE);
    const heard = await transcribeToCaptions({ audioPath: audio });
    const { lines, mismatches } = alignToScript(heard, narrationText(readFileSync(script, 'utf8')));
    const stem = join(dirname(audio), basename(audio).replace(/\.[^.]+$/, ''));
    writeFileSync(`${stem}.captions.json`, JSON.stringify(lines, null, 2) + '\n');
    writeFileSync(`${stem}.srt`, captionsToSrt(lines));
    for (const m of mismatches) console.log(`mismatch (${m.score.toFixed(2)}): script "${m.script}" / heard "${m.heard}"`);
    console.log(`wrote ${stem}.captions.json and ${stem}.srt (${lines.length} lines, ${mismatches.length} mismatches)`);
  } catch (e) {
    // Expected failures get a clean message; anything else keeps its stack.
    if (e instanceof WhisperMissingError || (e instanceof Error && /^usage:|English \(\.en\) models only/.test(e.message))) {
      console.error(e.message);
      process.exit(1);
    }
    throw e;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
