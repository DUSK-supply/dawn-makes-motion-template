// Adapted from MoneyPrinterTurbo app/services/material.py (MIT, Copyright (c) 2024 Harry). See THIRD_PARTY_NOTICES.md.
import { assertEnglish, requireEnv } from "../types.ts";
import { httpError, keepClip, PEXELS_LICENCE, pickFile, type SearchOpts, type StockClip } from "./types.ts";

interface PexelsVideo {
  id: number;
  url: string;
  duration: number;
  user: { name: string; url: string };
  video_files: { link: string; width: number; height: number; file_type: string }[];
}

export async function searchPexels(o: SearchOpts): Promise<StockClip[]> {
  const key = requireEnv("PEXELS_API_KEY", o.env);
  assertEnglish(o.query, "query");
  // VERIFY: docs list /v1/videos/search; MPT and the public API also serve /videos/search.
  const url = new URL("https://api.pexels.com/videos/search");
  url.search = new URLSearchParams({ query: o.query, per_page: "20", orientation: o.orientation }).toString();
  const res = await (o.fetch ?? fetch)(url, { headers: { Authorization: key } });
  if (!res.ok) throw httpError("pexels", "search", res.status);
  const body = (await res.json()) as { videos?: PexelsVideo[] };
  return (body.videos ?? [])
    .map((v): StockClip | undefined => {
      const f = pickFile(
        v.video_files.filter((x) => x.file_type === "video/mp4").map((x) => ({ url: x.link, width: x.width, height: x.height })),
        o.minWidth,
        o.minHeight,
      );
      return f && {
        provider: "pexels", id: String(v.id), pageUrl: v.url, downloadUrl: f.url, width: f.width, height: f.height,
        durationS: v.duration, author: v.user.name, authorUrl: v.user.url, licence: PEXELS_LICENCE,
      };
    })
    .filter((c) => keepClip(c, o.minDurationS));
}
