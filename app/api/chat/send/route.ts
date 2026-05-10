import { NextResponse, type NextRequest } from "next/server";
import { sendMessage } from "@/lib/chat/service";
import type { CareerAgentMode } from "@/lib/agent/router/types";
import { applyDemoRequestCookie, guardDemoChatRequest } from "@/lib/demo/guard";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = String(body.input ?? "").trim();
    const threadId = body.threadId ? String(body.threadId) : null;
    const mode = (body.mode ?? "auto") as CareerAgentMode;

    if (!input) {
      return NextResponse.json({ error: "input is required" }, { status: 400 });
    }

    const guarded = guardDemoChatRequest(request, input, body.providerConfig);
    if (guarded instanceof NextResponse) return guarded;

    const result = await sendMessage(threadId, input, mode, { triggerType: "chat", providerConfig: guarded.providerConfig });
    const response = NextResponse.json(result);
    return guarded.isDemoMode ? applyDemoRequestCookie(response, guarded.requestCount) : response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat send failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
