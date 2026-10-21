// Adapted from MoneyPrinterTurbo app/services/material.py (MIT, Copyright (c) 2024 Harry). See THIRD_PARTY_NOTICES.md.
import { assertEnglish, requireEnv } from "../types.ts";
import { httpError, keepClip, PIXABAY_LICENCE, pickFile, type SearchOpts, type StockClip } from "./types.ts";

interface PixabayHit {
  id: number;
  pageURL: string;
  duration: number;
  user: string;
  user_id: number;
  videos: Record<string, { url: string; width: number; height: number } | undefined>;
}

export async function searchPixabay(o: SearchOpts): Promise<StockClip[]> {
  const key = requireEnv("PIXABAY_API_KEY", o.env);
  assertEnglish(o.query, "query");
  const url = new URL("https://pixabay.com/api/videos/");
  url.search = new URLSearchParams({ key, q: o.query, per_page: "50", safesearch: "true" }).toString();
  const res = await (o.fetch ?? fetch)(url);
  if (!res.ok) throw httpError("pixabay", "search", res.status);
  const body = (await res.json()) as { hits?: PixabayHit[] };
  return (body.hits ?? [])
    .map((h): StockClip | undefined => {
      const f = pickFile(Object.values(h.videos).filter((x) => !!x), o.minWidth, o.minHeight);
      // Pixabay has no orientation parameter for videos: filter client-side (landscape = width >= height).
      if (!f || (f.width >= f.height) !== (o.orientation === "landscape")) return undefined;
      return {
        provider: "pixabay", id: String(h.id), pageUrl: h.pageURL, downloadUrl: f.url, width: f.width, height: f.height,
        durationS: h.duration, author: h.user, authorUrl: `https://pixabay.com/users/${h.user}-${h.user_id}/`, licence: PIXABAY_LICENCE,
      };
    })
    .filter((c) => keepClip(c, o.minDurationS));
}
