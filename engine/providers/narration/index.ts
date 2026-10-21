import type { Caption } from '../types.ts';
import { edgeProvider } from './edge.ts';
import { makeElevenLabsProvider } from './elevenlabs.ts';

export { edgeBoundariesToCaptions } from './edge.ts';
export { elevenAlignmentToCaptions } from './elevenlabs.ts';

export interface NarrationRequest { text: string; voice: string; outFile: string }
export interface NarrationResult { audioPath: string; captions: Caption[] }
export interface NarrationProvider { id: 'edge' | 'elevenlabs'; synthesize(req: NarrationRequest): Promise<NarrationResult> }

export function getNarrationProvider(id: string, deps?: { fetch?: typeof fetch; env?: NodeJS.ProcessEnv }): NarrationProvider {
  if (id === 'edge') return edgeProvider;
  if (id === 'elevenlabs') return makeElevenLabsProvider(deps);
  throw new Error(`unknown narration provider "${id}" (use edge or elevenlabs)`);
}
