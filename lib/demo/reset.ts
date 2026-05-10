import { getDemoConfig } from "@/lib/demo/config";

export interface DemoResetResult {
  ok: boolean;
  mode: "demo" | "normal";
  resetPerformed: boolean;
  warnings: string[];
}

export async function resetDemoData(): Promise<DemoResetResult> {
  const demo = getDemoConfig();

  if (!demo.isDemoMode) {
    return {
      ok: false,
      mode: "normal",
      resetPerformed: false,
      warnings: ["Demo reset is disabled outside DEMO_MODE=true."]
    };
  }

  if (!demo.resetEnabled) {
    return {
      ok: false,
      mode: "demo",
      resetPerformed: false,
      warnings: ["DEMO_RESET_ENABLED is not true."]
    };
  }

  return {
    ok: true,
    mode: "demo",
    resetPerformed: false,
    warnings: [
      "Reset endpoint is enabled and protected, but runtime reseeding is intentionally conservative in this version.",
      "For the first public demo deployment, run `npm run seed` manually or through a one-off deployment job against the persistent demo database."
    ]
  };
}
