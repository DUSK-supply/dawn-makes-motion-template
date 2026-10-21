import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { transcribeToCaptions, type EnglishModel } from './whisper.ts';

// Minimal whisper.cpp JSON with token-level timestamps.
const tok = (text: string, from: number, to: number) => ({
  t_dtw: -1, text, timestamps: { from: '', to: '' }, offsets: { from, to }, id: 1, p: 0.9,
});
const json = {
  systeminfo: '', model: {}, params: {}, result: { language: 'en' },
  transcription: [
    { timestamps: { from: '', to: '' }, offsets: { from: 0, to: 400 }, text: ' Hello', tokens: [tok(' Hello', 0, 400)] },
    { timestamps: { from: '', to: '' }, offsets: { from: 500, to: 900 }, text: ' world', tokens: [tok(' world', 500, 900)] },
  ],
};

test('transcribeToCaptions converts whisper output to captions and cleans up the wav', async () => {
  let ran: Record<string, unknown> = {};
  const converted: string[] = [];
  const caps = await transcribeToCaptions({
    audioPath: 'in.mp3',
    whisperDir: '/w',
    convert: async (_i, o) => { converted.push(o); },
    run: (async (o: Record<string, unknown>) => { ran = o; return json; }) as never,
  });
  assert.deepEqual(caps.map((c) => [c.text.trim(), c.startMs, c.endMs]), [['Hello', 0, 400], ['world', 500, 900]]);
  assert.equal(ran.model, 'small.en');
  assert.equal(ran.tokenLevelTimestamps, true);
  assert.equal(ran.splitOnWord, true);
  assert.equal(ran.inputPath, converted[0]);
  assert.equal(existsSync(dirname(converted[0]!)), false);
});

test('rejects non-English models at runtime', async () => {
  await assert.rejects(
    transcribeToCaptions({ audioPath: 'a.mp3', model: 'medium' as unknown as EnglishModel }),
    /English \(\.en\) models only/,
  );
});

// @ts-expect-error non-.en model is a type error
const _typeCheck: EnglishModel = 'medium';
void _typeCheck;
