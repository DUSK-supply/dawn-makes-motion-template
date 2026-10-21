// Adapted from MoneyPrinterTurbo app/services/llm.py and app/models/llm_provider.py (MIT, Copyright (c) 2024 Harry). See THIRD_PARTY_NOTICES.md.
export type LlmProviderId = "openai" | "kimi" | "deepseek" | "gemini" | "ollama";

export interface LlmPreset {
  baseURL: string;
  envKey: string | null;
  defaultModel: string;
}

export const LLM_PRESETS: Record<LlmProviderId, LlmPreset> = {
  openai: { baseURL: "https://api.openai.com/v1", envKey: "OPENAI_API_KEY", defaultModel: "gpt-6-luna" }, // VERIFY https://developers.openai.com/api/docs/models
  kimi: { baseURL: "https://api.moonshot.ai/v1", envKey: "MOONSHOT_API_KEY", defaultModel: "kimi-k3" }, // VERIFY https://platform.kimi.ai/docs/guide/start-using-kimi-api
  deepseek: { baseURL: "https://api.deepseek.com/v1", envKey: "DEEPSEEK_API_KEY", defaultModel: "deepseek-flash" }, // VERIFY https://api-docs.deepseek.com/
  gemini: { baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/", envKey: "GEMINI_API_KEY", defaultModel: "gemini-3.8-flash" }, // VERIFY https://ai.google.dev/gemini-api/docs/openai
  ollama: { baseURL: "http://localhost:11434/v1", envKey: null, defaultModel: "llama3.2" }, // VERIFY https://github.com/ollama/ollama/blob/main/docs/openai.md
};
