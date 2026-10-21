// Adapted from MoneyPrinterTurbo app/services/material.py (MIT, Copyright (c) 2024 Harry). See THIRD_PARTY_NOTICES.md.
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, appendFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { StockClip } from "./types.ts";

const CHANNEL_DIR = /^channels\/[a-z0-9][a-z0-9-]*$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ID = /^[A-Za-z0-9_-]+$/;
const HEADER = "# Asset licences\n\n| File | Source | Author | Page | Licence | Added |\n|---|---|---|---|---|---|\n";

const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");

export async function downloadClip(
  clip: StockClip,
  opts: { channelDir: string; slug: string; fetch?: typeof fetch },
): Promise<{ path: string; licenceRowAdded: boolean }> {
  if (!CHANNEL_DIR.test(opts.channelDir)) throw new Error(`channelDir must match channels/<handle>: ${opts.channelDir}`);
  if (!SLUG.test(opts.slug)) throw new Error(`slug must be kebab-case: ${opts.slug}`);
  if (!ID.test(clip.id)) throw new Error(`invalid clip id: ${clip.id}`);

  const path = join(opts.channelDir, "assets", "stock", opts.slug, `${clip.provider}-${clip.id}.mp4`);
  if (!existsSync(path)) {
    mkdirSync(dirname(path), { recursive: true });
    const part = `${path}.part`;
    try {
      const res = await (opts.fetch ?? fetch)(clip.downloadUrl);
      if (!res.ok || !res.body) throw new Error(`${clip.provider} download failed: HTTP ${res.status}`);
      await pipeline(Readable.fromWeb(res.body as never), createWriteStream(part));
      renameSync(part, path);
    } catch (e) {
      rmSync(part, { force: true });
      throw e;
    }
  }

  const licences = join(opts.channelDir, "assets", "LICENSES.md");
  const existing = existsSync(licences) ? readFileSync(licences, "utf8") : undefined;
  if (existing?.includes(`| ${cell(path)} |`)) return { path, licenceRowAdded: false };
  const row = [
    path,
    clip.provider,
    `${clip.author} (${clip.authorUrl})`,
    clip.pageUrl,
    `${clip.licence.name} (${clip.licence.url})`,
    new Date().toISOString(),
  ].map(cell);
  if (existing === undefined) writeFileSync(licences, HEADER);
  else if (!existing.endsWith("\n")) appendFileSync(licences, "\n");
  appendFileSync(licences, `| ${row.join(" | ")} |\n`);
  return { path, licenceRowAdded: true };
}
