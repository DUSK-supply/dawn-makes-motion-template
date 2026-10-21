import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MissingKeyError } from '../types.ts';
import { edgeBoundariesToCaptions, getNarrationProvider } from './index.ts';
import { elevenAlignmentToCaptions } from './elevenlabs.ts';
import { existsSync } from 'node:fs';
import { narrateToFiles, narrationText } from '../../scripts/narrate.ts';

const load = (n: string) => JSON.parse(readFileSync(new URL(`../fixtures/${n}`, import.meta.url), 'utf8'));

test('edgeBoundariesToCaptions converts ticks to ms, WordBoundary only', () => {
  const caps = edgeBoundariesToCaptions(load('edge-metadata.json'));
  assert.deepEqual(
    caps.map((c) => [c.text, c.startMs, c.endMs]),
    [['Hello', 100, 400], ['brave', 500, 900], ['world', 1000, 1500]],
  );
});

test('elevenAlignmentToCaptions groups characters into words', () => {
  const caps = elevenAlignmentToCaptions({ ...load('elevenlabs-alignment.json') });
  assert.deepEqual(
    caps.map((c) => [c.text, c.startMs, c.endMs]),
    [['Hi', 0, 200], ['big', 300, 600], ['world', 700, 1200]],
  );
});

test('edge rejects non-English voice', async () => {
  const p = getNarrationProvider('edge');
  await assert.rejects(
    p.synthesize({ text: 'Hello', voice: 'zh-CN-XiaoxiaoNeural', outFile: join(tmpdir(), 'x.mp3') }),
    /voice must be an en-\* locale/,
  );
});

test('elevenlabs without key throws MissingKeyError and never fetches', async () => {
  let calls = 0;
  const p = getNarrationProvider('elevenlabs', { env: {}, fetch: (async () => { calls++; return new Response(); }) as typeof fetch });
  await assert.rejects(p.synthesize({ text: 'Hi', voice: 'v1', outFile: join(tmpdir(), 'x.mp3') }), MissingKeyError);
  assert.equal(calls, 0);
});

test('elevenlabs writes mp3 and returns captions', async () => {
  const out = join(mkdtempSync(join(tmpdir(), 'narr-')), 'a.mp3');
  let seen: { url: string; init: RequestInit } | undefined;
  const fake = (async (url: string, init: RequestInit) => {
    seen = { url, init };
    return new Response(JSON.stringify({ audio_base64: Buffer.from('MP3').toString('base64'), alignment: load('elevenlabs-alignment.json') }), { status: 200 });
  }) as unknown as typeof fetch;
  const p = getNarrationProvider('elevenlabs', { env: { ELEVENLABS_API_KEY: 'k' }, fetch: fake });
  const r = await p.synthesize({ text: 'Hi big world', voice: 'v1', outFile: out });
  assert.equal(r.captions.length, 3);
  assert.equal(readFileSync(out, 'utf8'), 'MP3');
  assert.equal(seen!.url, 'https://api.elevenlabs.io/v1/text-to-speech/v1/with-timestamps');
  assert.equal((seen!.init.headers as Record<string, string>)['xi-api-key'], 'k');
});

test('elevenlabs non-2xx error includes status and body but not key', async () => {
  const fake = (async () => new Response('quota exceeded', { status: 429 })) as unknown as typeof fetch;
  const p = getNarrationProvider('elevenlabs', { env: { ELEVENLABS_API_KEY: 'secret-k' }, fetch: fake });
  await assert.rejects(p.synthesize({ text: 'Hi', voice: 'v', outFile: join(tmpdir(), 'x.mp3') }), (e: Error) => /429/.test(e.message) && /quota exceeded/.test(e.message) && !e.message.includes('secret-k'));
});

test('narrationText drops Needs verification section, tags and headings', () => {
  const md = '# Title\n\nHello there. [S1] Second line! [DEMO: x]\n\n## Needs Verification\n\nUnchecked claim.\n';
  assert.equal(narrationText(md), 'Hello there. Second line!'); // punctuation is kept, not re-split
});

test('narrationText keeps $2.50, 3:30 p.m., example.com and question marks', () => {
  assert.equal(
    narrationText('It costs $2.50 at 3:30 p.m. on example.com. Why does it work? [S1]'),
    'It costs $2.50 at 3:30 p.m. on example.com. Why does it work?',
  );
});

test('narrateToFiles leaves only final files on success and nothing on failure', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'narr-'));
  const ok = { id: 'edge' as const, async synthesize(r: { outFile: string }) { writeFileSync(r.outFile, 'MP3'); return { audioPath: r.outFile, captions: [] }; } };
  assert.equal(await narrateToFiles(ok, { text: 't', voice: 'v', dir, slug: 's' }), 0);
  assert.deepEqual(readdirSync(dir).sort(), ['s.captions.json', 's.mp3']);
  const dir2 = mkdtempSync(join(tmpdir(), 'narr-'));
  const bad = { id: 'edge' as const, async synthesize(r: { outFile: string }): Promise<never> { writeFileSync(r.outFile, 'half'); throw new Error('boom'); } };
  await assert.rejects(narrateToFiles(bad, { text: 't', voice: 'v', dir: dir2, slug: 's' }), /boom/);
  assert.deepEqual(readdirSync(dir2), []);
  const dir3 = mkdtempSync(join(tmpdir(), 'narr-'));
  const fake = (async () => new Response('quota', { status: 429 })) as unknown as typeof fetch;
  const eleven = getNarrationProvider('elevenlabs', { env: { ELEVENLABS_API_KEY: 'k' }, fetch: fake });
  await assert.rejects(narrateToFiles(eleven, { text: 'Hi', voice: 'v', dir: dir3, slug: 's' }), /429/);
  assert.equal(existsSync(join(dir3, 's.mp3')), false);
  assert.deepEqual(readdirSync(dir3), []);
});
