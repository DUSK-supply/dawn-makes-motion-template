export type { Caption } from "@remotion/captions";

export class MissingKeyError extends Error {
  constructor(envVar: string) {
    super(`${envVar} is not set. Add it to .env (see .env.example); this provider is optional.`);
    this.name = "MissingKeyError";
  }
}

export function requireEnv(name: string, env: Record<string, string | undefined> = process.env): string {
  const v = env[name];
  if (!v) throw new MissingKeyError(name);
  return v;
}

// Latin + Latin Extended-A/B, general punctuation, currency, letterlike (e.g. TM) and arrows; anything else is non-English.
const NON_LATIN = /[^\u0000-\u024f\u2000-\u206f\u20a0-\u20cf\u2100-\u214f\u2190-\u21ff]/;

export function assertEnglish(text: string, what: string): void {
  if (NON_LATIN.test(text)) throw new Error(`${what} must be English: found non-Latin characters`);
}
