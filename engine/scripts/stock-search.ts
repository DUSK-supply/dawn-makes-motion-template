import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { loadDotEnv } from "./env.ts";
import { downloadClip } from "../providers/stock/download.ts";
import { searchStock } from "../providers/stock/index.ts";
import { MissingKeyError } from "../providers/types.ts";

const USAGE =
  'usage: npx tsx engine/scripts/stock-search.ts <handle> <slug> "<query>" --provider pexels|pixabay --orientation landscape|portrait [--min-width N --min-height N] [--download <id>]';

async function main(): Promise<void> {
  loadDotEnv();
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      provider: { type: "string" }, orientation: { type: "string" }, download: { type: "string" },
      "min-width": { type: "string" }, "min-height": { type: "string" },
    },
  });
  const [handle, slug, query] = positionals;
  const { provider, orientation } = values;
  if (positionals.length !== 3 || (provider !== "pexels" && provider !== "pixabay") || (orientation !== "landscape" && orientation !== "portrait")) {
    console.error(USAGE);
    process.exit(1);
  }
  const landscape = orientation === "landscape";
  const minWidth = Number(values["min-width"] ?? (landscape ? 1920 : 1080));
  const minHeight = Number(values["min-height"] ?? (landscape ? 1080 : 1920));
  if (!Number.isFinite(minWidth) || !Number.isFinite(minHeight)) {
    console.error(USAGE);
    process.exit(1);
  }
  try {
    const clips = await searchStock({ provider, query: query!, orientation, minWidth, minHeight });
    console.log("id\tsize\tduration\tauthor\tpage");
    for (const c of clips) console.log(`${c.id}\t${c.width}x${c.height}\t${c.durationS}s\t${c.author}\t${c.pageUrl}`);
    if (values.download !== undefined) {
      const clip = clips.find((c) => c.id === values.download);
      if (!clip) {
        console.error(`clip ${values.download} not in results`);
        process.exit(1);
      }
      const r = await downloadClip(clip, { channelDir: `channels/${handle}`, slug: slug! });
      console.log(`wrote ${r.path}${r.licenceRowAdded ? " (licence recorded)" : " (licence already recorded)"}`);
    }
  } catch (e) {
    // Expected failures get a clean message; anything else keeps its stack.
    if (e instanceof MissingKeyError || (e instanceof Error && /must be English|must match channels|must be kebab-case|invalid clip id|(pexels|pixabay) \w+ failed: HTTP/.test(e.message))) {
      console.error(e.message);
      process.exit(1);
    }
    throw e;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
