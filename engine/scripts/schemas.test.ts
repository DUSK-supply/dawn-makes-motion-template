import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import YAML from "yaml";
import { compileSchema } from "./ajv.ts";

test("every schema compiles", () => {
  for (const f of fs.readdirSync("engine/schemas").filter((n) => n.endsWith(".json"))) compileSchema(`engine/schemas/${f}`);
});

test("sample episode manifest is valid", () => {
  const validate = compileSchema("engine/schemas/episode-manifest.schema.json");
  assert.ok(validate(JSON.parse(fs.readFileSync("engine/schemas/fixtures/episode.sample.json", "utf8"))));
});

test("episode manifest accepts stock-licensed scenes and captionsPath, rejects unknown type", () => {
  const validate = compileSchema("engine/schemas/episode-manifest.schema.json");
  const base = { slug: "s", title: "t", channel: "c", format: "longform", captionsPath: "a.captions.json" };
  const scene = { id: "s1", durationFrames: 30, type: "stock-licensed", licenceRef: "pexels-1", stockClipId: "1" };
  assert.ok(validate({ ...base, scenes: [scene] }), JSON.stringify(validate.errors));
  assert.equal(validate({ ...base, scenes: [{ ...scene, type: "stock" }] }), false);
});

test("channel configs are valid and a bad handle is rejected", () => {
  const validate = compileSchema("engine/schemas/channel-profile.schema.json");
  const files = ["engine/schemas/fixtures/channel.config.yml"];
  for (const ch of fs.readdirSync("channels", { withFileTypes: true })) {
    const f = `channels/${ch.name}/channel.config.yml`;
    if (ch.isDirectory() && fs.existsSync(f)) files.push(f);
  }
  for (const f of files) {
    const cfg: Record<string, unknown> = YAML.parse(fs.readFileSync(f, "utf8"));
    assert.ok(validate(cfg), `${f}: ${JSON.stringify(validate.errors)}`);
  }
  const fixture = YAML.parse(fs.readFileSync(files[0], "utf8"));
  assert.equal(validate({ ...fixture, handle: "Bad Handle" }), false);
});
