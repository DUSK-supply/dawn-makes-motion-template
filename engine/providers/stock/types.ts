export type StockProvider = "pexels" | "pixabay";

export interface StockClip {
  provider: StockProvider;
  id: string;
  pageUrl: string;
  downloadUrl: string;
  width: number;
  height: number;
  durationS: number;
  author: string;
  authorUrl: string;
  licence: { name: string; url: string };
}

export interface SearchOpts {
  provider: StockProvider;
  query: string;
  orientation: "landscape" | "portrait";
  minWidth: number;
  minHeight: number;
  minDurationS?: number;
  env?: NodeJS.ProcessEnv;
  fetch?: typeof fetch;
}

// VERIFY: licence names/URLs against https://www.pexels.com/license/ and https://pixabay.com/service/license-summary/ before publishing.
export const PEXELS_LICENCE = { name: "Pexels License", url: "https://www.pexels.com/license/" };
export const PIXABAY_LICENCE = { name: "Pixabay Content License", url: "https://pixabay.com/service/license-summary/" };
// VERIFY: https://www.pexels.com/api/documentation/#guidelines asks API users to show a prominent link to Pexels and credit the creator, linking to the Pexels page.
export const PEXELS_ATTRIBUTION_GUIDELINE =
  "Show a prominent link to Pexels and credit the creator, linking to the clip's Pexels page.";

export interface Candidate { url: string; width: number; height: number }

/** Smallest file (by pixel area) that is at least minWidth x minHeight, or undefined. */
export function pickFile(files: Candidate[], minWidth: number, minHeight: number): Candidate | undefined {
  return files
    .filter((f) => f.url && f.width >= minWidth && f.height >= minHeight)
    .sort((a, b) => a.width * a.height - b.width * b.height)[0];
}

export function keepClip(c: StockClip | undefined, minDurationS?: number): c is StockClip {
  return !!c && (minDurationS === undefined || c.durationS >= minDurationS);
}

/** Error text for a failed API call: provider and status only (Pixabay's key is in the URL, so never the URL). */
export function httpError(provider: StockProvider, what: string, status: number): Error {
  return new Error(`${provider} ${what} failed: HTTP ${status}`);
}
