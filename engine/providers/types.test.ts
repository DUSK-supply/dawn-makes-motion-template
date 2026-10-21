import { test } from "node:test";
import assert from "node:assert/strict";
import { MissingKeyError, assertEnglish, requireEnv } from "./types.ts";

test("requireEnv throws MissingKeyError when unset", () => {
  assert.throws(() => requireEnv("X", {}), (e) => e instanceof MissingKeyError && /X is not set/.test(e.message));
});

test("requireEnv returns the value when set", () => {
  assert.equal(requireEnv("X", { X: "k" }), "k");
});

test("assertEnglish accepts English text", () => {
  assert.doesNotThrow(() => assertEnglish("Hello, world.", "script"));
});

test("assertEnglish rejects non-Latin text", () => {
  assert.throws(() => assertEnglish("\u4f60\u597d", "script"), /must be English/);
});

test("assertEnglish accepts accents, currency, dashes, TM, arrows", () => {
  for (const t of ["\u20ac5", "caf\u00e9", "a \u2014 b", "Brand\u2122", "a \u2192 b"]) assert.doesNotThrow(() => assertEnglish(t, "script"), t);
});

test("assertEnglish still rejects CJK", () => {
  assert.throws(() => assertEnglish("\u4f60\u597d \u20ac5", "script"), /must be English/);
});
