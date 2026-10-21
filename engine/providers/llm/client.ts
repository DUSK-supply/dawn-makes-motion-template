// Adapted from MoneyPrinterTurbo app/services/llm.py and app/models/llm_provider.py (MIT, Copyright (c) 2024 Harry). See THIRD_PARTY_NOTICES.md.
import OpenAI from "openai";
import { requireEnv } from "../types.ts";
import { LLM_PRESETS, type LlmProviderId } from "./presets.ts";

export interface CompleteOptions {
  provider?: LlmProviderId;
  model?: string;
  system: string;
  prompt: string;
  env?: NodeJS.ProcessEnv;
  fetch?: typeof fetch;
}

export async function complete(opts: CompleteOptions): Promise<string> {
  const env = opts.env ?? process.env;
  const id = opts.provider ?? env.FYE_LLM_PROVIDER;
  if (!id) throw new Error("FYE_LLM_PROVIDER is not set; pass a provider or set it in .env");
  if (!Object.hasOwn(LLM_PRESETS, id)) throw new Error(`unknown LLM provider: ${id}`);
  const preset = LLM_PRESETS[id as LlmProviderId];
  const apiKey = preset.envKey ? requireEnv(preset.envKey, env) : "ollama";
  const client = new OpenAI({ apiKey, baseURL: preset.baseURL, fetch: opts.fetch, maxRetries: 0 });
  const res = await client.chat.completions.create({
    model: opts.model ?? preset.defaultModel,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.prompt },
    ],
  });
  const text = res.choices[0]?.message?.content;
  if (!text) throw new Error(`LLM provider ${id} returned an empty response`);
  return text;
}
