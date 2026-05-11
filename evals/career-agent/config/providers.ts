import type { LLMProviderConfig } from "../../../lib/llm/config";

export const EVAL_CONFIG = {
  provider: "deepseek" as const,
  model: "deepseek-v4-flash",
  thinking: "disabled" as const,
  reasoningEffort: "none" as const,
  temperature: 0.2,
  maxTokens: 2000,
  timeoutMs: 60000,
  stream: false
};

export type EvalProviderConfig = LLMProviderConfig & { model: string };

export function providerConfigFor(provider: "deepseek-flash" | "mock-smoke"): EvalProviderConfig {
  return provider === "mock-smoke"
    ? { provider: "mock", model: "MockLLMProvider", providerLabel: "MockLLMProvider", thinking: "disabled", reasoningEffort: "none", timeoutMs: 60000 }
    : { ...EVAL_CONFIG, providerLabel: "DeepSeek Flash" };
}
