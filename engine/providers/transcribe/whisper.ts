// Adapted from MoneyPrinterTurbo app/services/subtitle.py (MIT, Copyright (c) 2024 Harry). See THIRD_PARTY_NOTICES.md.
import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
} from '@remotion/install-whisper-cpp';
import type { Caption } from '../types.ts';

export type EnglishModel = 'base.en' | 'small.en' | 'medium.en';

// VERIFY: whisper.cpp release to build, see https://www.remotion.dev/docs/install-whisper-cpp
export const WHISPER_CPP_VERSION = '1.5.5';
export const DEFAULT_WHISPER_DIR = '.whisper';

export class WhisperMissingError extends Error {
  constructor() {
    super('whisper.cpp or the model is missing; run: npx tsx engine/scripts/transcribe.ts --install');
    this.name = 'WhisperMissingError';
  }
}

const execFileP = promisify(execFile);

function assertModel(model: string): void {
  if (!/^(base|small|medium)\.en$/.test(model)) throw new Error(`Use English (.en) models only; got "${model}"`);
}

/** Convert any audio to 16 kHz mono wav (what whisper.cpp reads). No shell. */
async function ffmpegConvert(input: string, output: string): Promise<void> {
  await execFileP('ffmpeg', ['-y', '-i', input, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', output]);
}

/** Download whisper.cpp and the model into whisperDir (idempotent). */
export async function installWhisper(model: EnglishModel = 'small.en', whisperDir = DEFAULT_WHISPER_DIR): Promise<void> {
  assertModel(model);
  await installWhisperCpp({ to: whisperDir, version: WHISPER_CPP_VERSION });
  await downloadWhisperModel({ model, folder: whisperDir });
}

export async function transcribeToCaptions(opts: {
  audioPath: string;
  model?: EnglishModel;
  whisperDir?: string;
  run?: typeof transcribe;
  convert?: (input: string, output: string) => Promise<void>;
}): Promise<Caption[]> {
  const model = opts.model ?? 'small.en';
  const whisperDir = opts.whisperDir ?? DEFAULT_WHISPER_DIR;
  assertModel(model);
  if (!opts.run && !existsSync(join(whisperDir, `ggml-${model}.bin`))) throw new WhisperMissingError();
  const run = opts.run ?? transcribe;
  const tmp = mkdtempSync(join(tmpdir(), 'whisper-'));
  try {
    const wav = join(tmp, 'audio.wav');
    await (opts.convert ?? ffmpegConvert)(opts.audioPath, wav);
    const out = await run({
      inputPath: wav,
      whisperPath: whisperDir,
      whisperCppVersion: WHISPER_CPP_VERSION,
      model,
      modelFolder: whisperDir,
      tokenLevelTimestamps: true,
      language: 'en',
      splitOnWord: true,
    });
    return toCaptions({ whisperCppOutput: out }).captions;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
