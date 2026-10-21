import { serializeSrt } from '@remotion/captions';
import type { Caption } from '../providers/types.ts';

/** One caption per SRT cue. */
export function captionsToSrt(lines: Caption[]): string {
  return serializeSrt({ lines: lines.map((l) => [l]) });
}
