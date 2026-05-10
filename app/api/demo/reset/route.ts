import { NextResponse } from "next/server";
import { getDemoConfig } from "@/lib/demo/config";
import { resetDemoData } from "@/lib/demo/reset";

export const dynamic = "force-dynamic";

function readToken(request: Request, body: Record<string, unknown>) {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice("bearer ".length).trim();
  return request.headers.get("x-demo-reset-token")?.trim() || (typeof body.token === "string" ? body.token.trim() : "");
}

export async function POST(request: Request) {
  const demo = getDemoConfig();
  const body = await request.json().catch(() => ({}));

  if (!demo.isDemoMode || !demo.resetEnabled) {
    return NextResponse.json(
      {
        ok: false,
        mode: demo.isDemoMode ? "demo" : "normal",
        resetPerformed: false,
        warnings: ["Demo reset is not enabled."]
      },
      { status: 404 }
    );
  }

  if (demo.resetToken && readToken(request, body) !== demo.resetToken) {
    return NextResponse.json(
      {
        ok: false,
        mode: "demo",
        resetPerformed: false,
        warnings: ["Invalid or missing demo reset token."]
      },
      { status: 403 }
    );
  }

  const result = await resetDemoData();
  return NextResponse.json(result);
}
