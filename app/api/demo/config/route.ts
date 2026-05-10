import { NextResponse } from "next/server";
import { getPublicDemoConfig } from "@/lib/demo/config";
import { isDeepSeekConfigured } from "@/lib/llm/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const demo = getPublicDemoConfig();

  return NextResponse.json({
    deepseekConfigured: demo.isDemoMode && !demo.allowDeepSeek ? false : isDeepSeekConfigured(),
    demo
  });
}
