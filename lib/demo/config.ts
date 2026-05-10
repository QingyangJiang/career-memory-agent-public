import type { LLMProviderConfig } from "@/lib/llm/config";

export interface DemoConfig {
  isDemoMode: boolean;
  provider: "mock" | "deepseek";
  allowDeepSeek: boolean;
  resetEnabled: boolean;
  resetToken?: string;
  maxInputChars: number;
  requestLimitPerSession: number;
}

function booleanEnv(name: string, fallback = false) {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value);
}

function numberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

export function getDemoConfig(): DemoConfig {
  const isDemoMode = booleanEnv("DEMO_MODE");
  const allowDeepSeek = booleanEnv("DEMO_ALLOW_DEEPSEEK");
  const requestedProvider = process.env.DEMO_PROVIDER?.trim().toLowerCase();
  const provider = requestedProvider === "deepseek" && allowDeepSeek ? "deepseek" : "mock";

  return {
    isDemoMode,
    provider,
    allowDeepSeek,
    resetEnabled: booleanEnv("DEMO_RESET_ENABLED"),
    resetToken: process.env.DEMO_RESET_TOKEN?.trim() || undefined,
    maxInputChars: numberEnv("DEMO_MAX_INPUT_CHARS", 4000),
    requestLimitPerSession: numberEnv("DEMO_REQUEST_LIMIT_PER_SESSION", 20)
  };
}

export function getDemoProviderConfig(config = getDemoConfig()): LLMProviderConfig {
  if (!config.isDemoMode || config.provider !== "deepseek") {
    return {
      provider: "mock",
      model: "MockLLMProvider",
      providerLabel: "MockLLMProvider",
      thinking: "disabled",
      reasoningEffort: "none"
    };
  }

  return {
    provider: "deepseek",
    providerLabel: "DeepSeek",
    thinking: "disabled",
    reasoningEffort: "none"
  };
}

export function getPublicDemoConfig(config = getDemoConfig()) {
  return {
    isDemoMode: config.isDemoMode,
    provider: config.provider,
    allowDeepSeek: config.allowDeepSeek,
    resetEnabled: config.resetEnabled,
    maxInputChars: config.maxInputChars,
    requestLimitPerSession: config.requestLimitPerSession
  };
}
