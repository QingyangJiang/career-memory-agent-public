import { NextResponse, type NextRequest } from "next/server";
import { sendMessage } from "@/lib/chat/service";
import type { CareerAgentMode } from "@/lib/agent/router/types";
import { applyDemoRequestCookie, guardDemoChatRequest } from "@/lib/demo/guard";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const input = String(body.input ?? "").trim();
    const mode = (body.mode ?? "auto") as CareerAgentMode;

    if (!input) {
      return NextResponse.json({ redirectTo: "/chat/new" });
    }

    const guarded = guardDemoChatRequest(request, input, null);
    if (guarded instanceof NextResponse) return guarded;

    const result = await sendMessage(null, input, mode, { triggerType: "home_quick_start", providerConfig: guarded.providerConfig });
    const response = NextResponse.json({
      redirectTo: `/chat/${result.thread.id}`,
      thread: result.thread,
      userMessage: result.userMessage,
      assistantMessage: result.assistantMessage
    });
    return guarded.isDemoMode ? applyDemoRequestCookie(response, guarded.requestCount) : response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start chat.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
