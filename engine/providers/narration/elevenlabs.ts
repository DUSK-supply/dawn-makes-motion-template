// Adapted from MoneyPrinterTurbo app/services/voice.py (MIT, Copyright (c) 2024 Harry). See THIRD_PARTY_NOTICES.md.
import { writeFileSync } from 'node:fs';
import { assertEnglish, requireEnv, type Caption } from '../types.ts';
import type { NarrationProvider } from './index.ts';

export type ElevenAlignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

/** Group per-character timings into words, splitting on whitespace. */
export function elevenAlignmentToCaptions(a: ElevenAlignment): Caption[] {
  const out: Caption[] = [];
  let word = '';
  let start = 0;
  let end = 0;
  const flush = () => {
    if (word) out.push({ text: word, startMs: start, endMs: end, timestampMs: start, confidence: null });
    word = '';
  };
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) return flush();
    if (!word) start = Math.round(a.character_start_times_seconds[i]! * 1000);
    word += ch;
    end = Math.round(a.character_end_times_seconds[i]! * 1000);
  });
  flush();
  return out;
}

// VERIFY model ids: https://elevenlabs.io/docs/models
const DEFAULT_MODEL = 'eleven_multilingual_v2';

export function makeElevenLabsProvider(deps: { fetch?: typeof fetch; env?: NodeJS.ProcessEnv } = {}): NarrationProvider {
  return {
    id: 'elevenlabs',
    async synthesize({ text, voice, outFile }) {
      const key = requireEnv('ELEVENLABS_API_KEY', deps.env ?? process.env);
      assertEnglish(text, 'narration text');
      const res = await (deps.fetch ?? fetch)(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}/with-timestamps`, {
        method: 'POST',
        headers: { 'xi-api-key': key, 'content-type': 'application/json' },
        body: JSON.stringify({ text, model_id: DEFAULT_MODEL }),
      });
      if (!res.ok) throw new Error(`ElevenLabs request failed: ${res.status} ${await res.text()}`);
      const body = (await res.json()) as { audio_base64: string; alignment: ElevenAlignment };
      writeFileSync(outFile, Buffer.from(body.audio_base64, 'base64'));
      return { audioPath: outFile, captions: elevenAlignmentToCaptions(body.alignment) };
    },
  };
}
