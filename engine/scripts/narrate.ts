import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { loadDotEnv } from './env.ts';
import { getNarrationProvider, type NarrationProvider } from '../providers/narration/index.ts';
import { MissingKeyError } from '../providers/types.ts';

const USAGE =
  'usage: npx tsx engine/scripts/narrate.ts channels/<handle>/scripts/<slug>/script.md --provider edge|elevenlabs --voice <id>';
const SCRIPT_PATH = /^channels\/([a-z0-9]+(?:-[a-z0-9]+)*)\/scripts\/([a-z0-9]+(?:-[a-z0-9]+)*)\/script\.md$/;

/** Spoken text of a script: everything before a "Needs verification" heading, minus headings/tags/markers, whitespace collapsed, punctuation kept. */
export function narrationText(scriptMd: string): string {
  const cut = scriptMd.search(/^#+[ \t]*needs verification[ \t]*$/im);
  const body = cut === -1 ? scriptMd : scriptMd.slice(0, cut);
  return body
    .replace(/^#+.*$/gm, '')
    .replace(/\[DEMO:[^\]]*\]/g, '')
    .replace(/\[S\d+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Synthesize to <slug>.mp3 and <slug>.captions.json via .part files, renamed only on success. */
export async function narrateToFiles(provider: NarrationProvider, o: { text: string; voice: string; dir: string; slug: string }): Promise<number> {
  const mp3 = join(o.dir, `${o.slug}.mp3`);
  const caps = join(o.dir, `${o.slug}.captions.json`);
  try {
    const { captions } = await provider.synthesize({ text: o.text, voice: o.voice, outFile: `${mp3}.part` });
    writeFileSync(`${caps}.part`, JSON.stringify(captions, null, 2) + '\n');
    renameSync(`${mp3}.part`, mp3);
    renameSync(`${caps}.part`, caps);
    return captions.length;
  } catch (e) {
    rmSync(`${mp3}.part`, { force: true });
    rmSync(`${caps}.part`, { force: true });
    throw e;
  }
}

async function main(): Promise<void> {
  loadDotEnv();
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { provider: { type: 'string' }, voice: { type: 'string' } },
  });
  const m = SCRIPT_PATH.exec(positionals[0] ?? '');
  if (!m || positionals.length !== 1 || !values.provider || !values.voice) {
    console.error(USAGE);
    process.exit(1);
  }
  const [, handle, slug] = m;
  const dir = join('channels', handle!, 'assets', 'audio');
  try {
    const provider = getNarrationProvider(values.provider);
    mkdirSync(dir, { recursive: true });
    const n = await narrateToFiles(provider, { text: narrationText(readFileSync(positionals[0]!, 'utf8')), voice: values.voice, dir, slug: slug! });
    console.log(`wrote ${join(dir, slug!)}.mp3 and .captions.json (${n} words)`);
  } catch (e) {
    // Expected failures get a clean message; anything else keeps its stack.
    if (e instanceof MissingKeyError || (e instanceof Error && /must be (an en-\* locale|English)|unknown narration provider/.test(e.message))) {
      console.error(e.message);
      process.exit(1);
    }
    throw e;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
