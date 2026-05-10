import { NextResponse, type NextRequest } from "next/server";
import { getDemoConfig, getDemoProviderConfig } from "@/lib/demo/config";
import { normalizeProviderConfig, type LLMProviderConfig } from "@/lib/llm/config";

const DEMO_REQUEST_COOKIE = "career-demo-request-count";

export interface DemoGuardResult {
  providerConfig: LLMProviderConfig;
  requestCount: number;
  isDemoMode: boolean;
}

function demoError(message: string, status: number) {
  return NextResponse.json({ error: message, demoMode: true }, { status });
}

function requestCount(request: NextRequest) {
  const raw = request.cookies.get(DEMO_REQUEST_COOKIE)?.value;
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

export function applyDemoRequestCookie(response: NextResponse, requestCountValue: number) {
  response.cookies.set(DEMO_REQUEST_COOKIE, String(requestCountValue), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}

export function guardDemoChatRequest(
  request: NextRequest,
  input: string,
  requestedProviderConfig: Partial<LLMProviderConfig> | null | undefined
): DemoGuardResult | NextResponse {
  const demo = getDemoConfig();
  const normalized = normalizeProviderConfig(requestedProviderConfig);

  if (!demo.isDemoMode) {
    return {
      providerConfig: normalized,
      requestCount: requestCount(request),
      isDemoMode: false
    };
  }

  if (input.length > demo.maxInputChars) {
    return demoError(`Demo input too long. Please keep requests under ${demo.maxInputChars} characters.`, 413);
  }

  const currentCount = requestCount(request);
  if (currentCount >= demo.requestLimitPerSession) {
    return demoError("Demo request limit reached for this browser session. Please reset the session later.", 429);
  }

  if (normalized.provider === "deepseek" && !demo.allowDeepSeek) {
    return demoError("DeepSeek disabled in public demo. Demo mode only supports mock provider.", 403);
  }

  return {
    providerConfig: getDemoProviderConfig(demo),
    requestCount: currentCount + 1,
    isDemoMode: true
  };
}
