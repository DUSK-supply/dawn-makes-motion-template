import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { searchStock } from "./index.ts";
import { downloadClip } from "./download.ts";
import { MissingKeyError } from "../types.ts";
import type { StockClip } from "./types.ts";

const fixture = (n: string) => readFileSync(new URL(`../fixtures/${n}`, import.meta.url), "utf8");
const jsonFetch = (body: string, calls: string[] = []): typeof fetch =>
  (async (url: string | URL | Request) => {
    calls.push(String(url));
    return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
const base = { query: "ocean", orientation: "landscape", minWidth: 1920, minHeight: 1080 } as const;

test("pexels: drops clips below size, picks the smallest qualifying mp4, fills licence", async () => {
  const calls: string[] = [];
  const clips = await searchStock({
    ...base, provider: "pexels", env: { PEXELS_API_KEY: "k" }, fetch: jsonFetch(fixture("pexels-videos.json"), calls),
  });
  assert.deepEqual(clips.map((c) => c.id), ["1001", "1003"]);
  assert.equal(clips[0]!.downloadUrl, "https://cdn.example/1001-hd.mp4");
  assert.equal(clips[0]!.licence.url, "https://www.pexels.com/license/");
  assert.equal(clips[0]!.authorUrl, "https://www.pexels.com/@ann");
  assert.match(calls[0]!, /orientation=landscape/);
  const long = await searchStock({
    ...base, provider: "pexels", minDurationS: 10, env: { PEXELS_API_KEY: "k" }, fetch: jsonFetch(fixture("pexels-videos.json")),
  });
  assert.deepEqual(long.map((c) => c.id), ["1001"]);
});

test("pixabay: smallest qualifying size, client-side orientation, author url", async () => {
  const env = { PIXABAY_API_KEY: "k" };
  const pcalls: string[] = [];
  const land = await searchStock({ ...base, provider: "pixabay", env, fetch: jsonFetch(fixture("pixabay-videos.json"), pcalls) });
  assert.match(pcalls[0]!, /safesearch=true/);
  assert.deepEqual(land.map((c) => c.id), ["2001"]);
  assert.equal(land[0]!.downloadUrl, "https://cdn.example/2001-medium.mp4");
  assert.equal(land[0]!.authorUrl, "https://pixabay.com/users/leaf-555/");
  const port = await searchStock({
    ...base, provider: "pixabay", orientation: "portrait", minWidth: 1080, minHeight: 1920, env,
    fetch: jsonFetch(fixture("pixabay-videos.json")),
  });
  assert.deepEqual(port.map((c) => [c.id, c.downloadUrl]), [["2002", "https://cdn.example/2002-medium.mp4"]]);
});

test("missing key or non-English query rejects before any fetch", async () => {
  for (const [provider, env] of [["pixabay", {}], ["pexels", {}]] as const) {
    const calls: string[] = [];
    await assert.rejects(searchStock({ ...base, provider, env, fetch: jsonFetch("{}", calls) }), MissingKeyError);
    assert.equal(calls.length, 0);
  }
  const calls: string[] = [];
  await assert.rejects(
    searchStock({ ...base, query: "\u6d77\u6d6a", provider: "pexels", env: { PEXELS_API_KEY: "k" }, fetch: jsonFetch("{}", calls) }),
    /query must be English/,
  );
  assert.equal(calls.length, 0);
});

test("non-2xx errors name provider and status but never the key", async () => {
  const f = (async () => new Response("no", { status: 429 })) as typeof fetch;
  for (const provider of ["pexels", "pixabay"] as const) {
    await assert.rejects(
      searchStock({ ...base, provider, env: { PEXELS_API_KEY: "SECRETKEY", PIXABAY_API_KEY: "SECRETKEY" }, fetch: f }),
      (e: Error) => e.message.includes(provider) && e.message.includes("429") && !e.message.includes("SECRETKEY"),
    );
  }
});

// ---- download ----
const clip: StockClip = {
  provider: "pexels", id: "1001", pageUrl: "https://www.pexels.com/video/x-1001/", downloadUrl: "https://cdn.example/a.mp4",
  width: 1920, height: 1080, durationS: 12, author: "Ann | Smith", authorUrl: "https://www.pexels.com/@ann",
  licence: { name: "Pexels License", url: "https://www.pexels.com/license/" },
};
const rel = "channels/demo/assets/stock/ocean/pexels-1001.mp4";

async function inTmp(fn: () => Promise<void>): Promise<void> {
  const cwd = process.cwd();
  const dir = mkdtempSync(join(tmpdir(), "stock-"));
  mkdirSync(join(dir, "channels", "demo"), { recursive: true });
  process.chdir(dir);
  try { await fn(); } finally { process.chdir(cwd); rmSync(dir, { recursive: true, force: true }); }
}
const okFetch = (calls: string[] = []): typeof fetch =>
  (async (u: string | URL | Request) => { calls.push(String(u)); return new Response("video-bytes"); }) as typeof fetch;

test("download writes the file, creates LICENSES.md once, escapes pipes, skips refetch", () => inTmp(async () => {
  const calls: string[] = [];
  const r = await downloadClip(clip, { channelDir: "channels/demo", slug: "ocean", fetch: okFetch(calls) });
  assert.deepEqual(r, { path: rel, licenceRowAdded: true });
  assert.equal(readFileSync(rel, "utf8"), "video-bytes");
  const again = await downloadClip(clip, { channelDir: "channels/demo", slug: "ocean", fetch: okFetch(calls) });
  assert.equal(again.licenceRowAdded, false);
  assert.equal(calls.length, 1);
  const md = readFileSync("channels/demo/assets/LICENSES.md", "utf8");
  assert.ok(md.startsWith("# Asset licences\n\n| File | Source | Author | Page | Licence | Added |\n|---|---|---|---|---|---|\n"));
  assert.equal(md.split("\n").filter((l) => l.includes(rel)).length, 1);
  assert.match(md, /Ann \\\| Smith \(https:\/\/www\.pexels\.com\/@ann\)/);
}));

test("existing file without a licence row still gets a row", () => inTmp(async () => {
  await downloadClip(clip, { channelDir: "channels/demo", slug: "ocean", fetch: okFetch() });
  rmSync("channels/demo/assets/LICENSES.md");
  const r = await downloadClip(clip, { channelDir: "channels/demo", slug: "ocean", fetch: okFetch() });
  assert.equal(r.licenceRowAdded, true);
}));

test("mid-stream failure leaves no .mp4, no .part and no LICENSES.md", () => inTmp(async () => {
  const body = new ReadableStream<Uint8Array>({
    start(c) { c.enqueue(new Uint8Array([1, 2, 3])); },
    pull(c) { c.error(new Error("boom")); },
  });
  const f = (async () => new Response(body)) as typeof fetch;
  await assert.rejects(downloadClip(clip, { channelDir: "channels/demo", slug: "ocean", fetch: f }), /boom/);
  assert.deepEqual(readdirSync("channels/demo/assets/stock/ocean"), []);
  assert.equal(existsSync("channels/demo/assets/LICENSES.md"), false);
}));

test("download HTTP error and bad channelDir/slug are rejected", () => inTmp(async () => {
  const f = (async () => new Response("x", { status: 403 })) as typeof fetch;
  await assert.rejects(downloadClip(clip, { channelDir: "channels/demo", slug: "ocean", fetch: f }), /HTTP 403/);
  for (const channelDir of ["../x", "/abs/channels/demo", "channels/Demo", "channels/demo/../x", "other/demo"]) {
    await assert.rejects(downloadClip(clip, { channelDir, slug: "ocean", fetch: okFetch() }), /channelDir/);
  }
  for (const slug of ["Ocean", "a/b", "..", "a_b"]) {
    await assert.rejects(downloadClip(clip, { channelDir: "channels/demo", slug, fetch: okFetch() }), /slug/);
  }
}));
