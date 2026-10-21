// Adapted from MoneyPrinterTurbo app/services/voice.py (MIT, Copyright (c) 2024 Harry). See THIRD_PARTY_NOTICES.md.
// Uses Microsoft's Edge Read Aloud service; terms of use VERIFY before commercial use.
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { assertEnglish, type Caption } from '../types.ts';
import type { NarrationProvider } from './index.ts';

export type EdgeBoundary = { Type: string; Data: { Offset: number; Duration: number; text: { Text: string } } };

/** Edge reports 100ns ticks; 10_000 ticks = 1 ms. Only WordBoundary entries become captions. */
export function edgeBoundariesToCaptions(meta: EdgeBoundary[]): Caption[] {
  return meta
    .filter((m) => m.Type === 'WordBoundary')
    .map((m) => {
      const startMs = Math.round(m.Data.Offset / 10_000);
      return { text: m.Data.text.Text, startMs, endMs: startMs + Math.round(m.Data.Duration / 10_000), timestampMs: startMs, confidence: null };
    });
}

export const edgeProvider: NarrationProvider = {
  id: 'edge',
  async synthesize({ text, voice, outFile }) {
    if (!/^en-[A-Z]{2}-/.test(voice)) throw new Error(`voice must be an en-* locale (got "${voice}")`);
    assertEnglish(text, 'narration text');
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, { wordBoundaryEnabled: true });
    try {
      const { audioStream, metadataStream } = tts.toStream(text);
      const boundaries: EdgeBoundary[] = [];
      // Each metadata chunk is a JSON object { Metadata: [...] }.
      metadataStream?.on('data', (c: Buffer) => boundaries.push(...JSON.parse(c.toString()).Metadata));
      await pipeline(audioStream, createWriteStream(outFile));
      return { audioPath: outFile, captions: edgeBoundariesToCaptions(boundaries) };
    } finally {
      tts.close();
    }
  },
};
