// Adapted from MoneyPrinterTurbo app/services/subtitle.py (MIT, Copyright (c) 2024 Harry). See THIRD_PARTY_NOTICES.md.
import type { Caption } from '../providers/types.ts';

export type Mismatch = { script: string; heard: string; score: number };

/** Split a script into spoken sentences (. ! ? ; : followed by whitespace/end, and newlines), dropping markdown headings, [S1] tags and [DEMO: ...] markers. */
export function splitScriptLines(script: string): string[] {
  return script
    .replace(/^#+.*$/gm, '')
    .replace(/\[DEMO:[^\]]*\]/g, '')
    .replace(/\[S\d+\]/g, '')
    .split(/[.!?;:]+(?=\s|$)|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length]!;
}

/** Lowercase, punctuation stripped, whitespace collapsed. */
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();

export function similarity(a: string, b: string): number {
  const x = norm(a);
  const y = norm(b);
  const max = Math.max(x.length, y.length);
  return max === 0 ? 1 : 1 - levenshtein(x, y) / max;
}

export function alignToScript(
  captions: Caption[],
  script: string,
  threshold = 0.8,
): { lines: Caption[]; mismatches: Mismatch[] } {
  const scriptLines = splitScriptLines(script);
  const lines: Caption[] = [];
  const mismatches: Mismatch[] = [];
  let si = 0;
  let ci = 0;
  while (si < scriptLines.length && ci < captions.length) {
    const line = scriptLines[si]!;
    const cur = captions[ci]!;
    if (norm(line) === norm(cur.text)) {
      lines.push(cur);
      si++;
      ci++;
      continue;
    }
    let combined = cur.text.trim();
    let endMs = cur.endMs;
    let next = ci + 1;
    while (next < captions.length && similarity(line, `${combined} ${captions[next]!.text.trim()}`) > similarity(line, combined)) {
      combined += ` ${captions[next]!.text.trim()}`;
      endMs = captions[next]!.endMs;
      next++;
    }
    const score = similarity(line, combined);
    if (score > threshold) {
      const merged = next > ci + 1; // merged captions have no single token timestamp or confidence
      lines.push({ ...cur, text: line, endMs, ...(merged && { timestampMs: null, confidence: null }) });
      si++;
      ci = next;
      continue;
    }
    // One-step lookahead: resync after a skipped script line or an ad-libbed caption.
    const nextLine = scriptLines[si + 1];
    if (nextLine !== undefined && similarity(nextLine, cur.text) > threshold) {
      mismatches.push({ script: line, heard: '', score: 0 });
      si++;
      continue;
    }
    const following = captions[ci + 1];
    if (following && similarity(line, following.text) > threshold) {
      lines.push(cur);
      mismatches.push({ script: '', heard: cur.text, score: similarity(line, cur.text) });
      ci++;
      continue;
    }
    lines.push({ ...cur, text: combined, endMs, ...(next > ci + 1 && { timestampMs: null, confidence: null }) });
    mismatches.push({ script: line, heard: combined, score });
    si++;
    ci = next;
  }
  for (; si < scriptLines.length; si++) mismatches.push({ script: scriptLines[si]!, heard: '', score: 0 });
  lines.push(...captions.slice(ci));
  return { lines, mismatches };
}
