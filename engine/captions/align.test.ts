import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Caption } from '../providers/types.ts';
import { alignToScript, splitScriptLines } from './align.ts';
import { captionsToSrt } from './srt.ts';

const cap = (text: string, startMs: number, endMs: number): Caption => ({
  text,
  startMs,
  endMs,
  timestampMs: null,
  confidence: null,
});

test('exact match keeps timings (case and trailing punctuation ignored)', () => {
  const r = alignToScript([cap('Hello world.', 0, 1000), cap('Bye now', 1000, 2000)], 'Hello world. Bye now.');
  assert.deepEqual(r.lines.map((l) => [l.text, l.startMs, l.endMs]), [
    ['Hello world.', 0, 1000],
    ['Bye now', 1000, 2000],
  ]);
  assert.equal(r.mismatches.length, 0);
});

test('one script line split into two captions is merged', () => {
  const r = alignToScript([cap('The quick brown', 0, 800), cap('fox jumps', 800, 1500)], 'The quick brown fox jumps.');
  assert.equal(r.lines.length, 1);
  assert.equal(r.lines[0]!.text, 'The quick brown fox jumps');
  assert.equal(r.lines[0]!.startMs, 0);
  assert.equal(r.lines[0]!.endMs, 1500);
  assert.equal(r.mismatches.length, 0);
});

test('ad-libbed line keeps heard text and is reported', () => {
  const r = alignToScript([cap('completely different words here', 0, 2000)], 'Totally unrelated script sentence.');
  assert.equal(r.lines[0]!.text, 'completely different words here');
  assert.equal(r.lines[0]!.endMs, 2000);
  assert.equal(r.mismatches.length, 1);
  assert.ok(r.mismatches[0]!.score < 0.8);
});

test('splitScriptLines strips headings, source tags, demo markers', () => {
  assert.deepEqual(splitScriptLines('# Title\nAI saves time [S1]. Really? Yes!'), ['AI saves time', 'Really', 'Yes']);
  assert.deepEqual(splitScriptLines('Look [DEMO: show the app]. Done.'), ['Look', 'Done']);
});

test('splitScriptLines keeps $2.50, 3:30 and example.com intact', () => {
  assert.deepEqual(splitScriptLines('It costs $2.50 at 3:30 today on example.com. Why? Done'), ['It costs $2.50 at 3:30 today on example.com', 'Why', 'Done']);
});

test('real whisper tokens (leading space, attached punctuation) align without mismatch', () => {
  const toks = [' Here', ' is', ' the', ' fix.'].map((t, i) => cap(t, i * 400, i * 400 + 400));
  const r = alignToScript(toks, 'Here is the fix.');
  assert.equal(r.mismatches.length, 0);
  assert.equal(r.lines.length, 1);
  assert.equal(r.lines[0]!.text, 'Here is the fix.'.replace(/\.$/, ''));
  const off = alignToScript(toks, 'Totally other words entirely.');
  assert.equal(off.mismatches.length, 1);
  assert.ok(off.lines[0]!.text.startsWith('Here is'));
});

test('captionsToSrt formats cues', () => {
  const srt = captionsToSrt([cap('Hello', 0, 1500), cap('World', 1500, 3000)]);
  assert.ok(srt.startsWith('1\n00:00:00,000 --> 00:00:01,500\n'), srt);
  assert.ok(srt.includes('2\n00:00:01,500 --> 00:00:03,000\nWorld'), srt);
});

test('empty captions or script does not throw', () => {
  assert.deepEqual(alignToScript([], 'Hello.'), { lines: [], mismatches: [{ script: 'Hello', heard: '', score: 0 }] });
  const c = [cap('Hi', 0, 1)];
  assert.deepEqual(alignToScript(c, ''), { lines: c, mismatches: [] });
});

test('ad-lib followed by a matching line still aligns', () => {
  const r = alignToScript(
    [cap('zzz qqq xxx www vvv', 0, 500), cap('Hello there friend', 500, 1500), cap('Second line here', 1500, 2500)],
    'Hello there friend. Second line here.',
  );
  assert.deepEqual(r.lines.map((l) => [l.text, l.startMs, l.endMs]), [
    ['zzz qqq xxx www vvv', 0, 500],
    ['Hello there friend', 500, 1500],
    ['Second line here', 1500, 2500],
  ]);
  assert.equal(r.mismatches.length, 1);
  assert.equal(r.mismatches[0]!.script, '');
});

test('skipped script line is reported and next line aligns', () => {
  const r = alignToScript(
    [cap('Alpha beta gamma', 0, 1000), cap('Closing words here', 1000, 2000)],
    'Alpha beta gamma. Never narrated sentence. Closing words here.',
  );
  assert.deepEqual(r.lines.map((l) => [l.text, l.startMs, l.endMs]), [
    ['Alpha beta gamma', 0, 1000],
    ['Closing words here', 1000, 2000],
  ]);
  assert.deepEqual(r.mismatches, [{ script: 'Never narrated sentence', heard: '', score: 0 }]);
});

test('captions left over after the script are kept as-is', () => {
  const extra = cap('Outro chatter', 1000, 2000);
  const r = alignToScript([cap('Hello world', 0, 1000), extra], 'Hello world.');
  assert.equal(r.lines.length, 2);
  assert.equal(r.lines[1], extra);
  assert.equal(r.mismatches.length, 0);
});

test('script lines left over after captions run out are reported', () => {
  const r = alignToScript([cap('Hello world', 0, 1000)], 'Hello world. Missing one. Missing two.');
  assert.equal(r.lines.length, 1);
  assert.deepEqual(r.mismatches, [
    { script: 'Missing one', heard: '', score: 0 },
    { script: 'Missing two', heard: '', score: 0 },
  ]);
});

test('custom threshold changes accept/reject', () => {
  const c = [cap('Hello wurld', 0, 1000)];
  assert.equal(alignToScript(c, 'Hello world.', 0.8).lines[0]!.text, 'Hello world');
  assert.equal(alignToScript(c, 'Hello world.', 0.95).mismatches.length, 1);
});

test('merged captions drop timestampMs and confidence', () => {
  const a = { ...cap('The quick', 0, 500), timestampMs: 250, confidence: 0.9 };
  const r = alignToScript([a, cap('brown fox', 500, 1000)], 'The quick brown fox.');
  assert.equal(r.lines[0]!.timestampMs, null);
  assert.equal(r.lines[0]!.confidence, null);
});
