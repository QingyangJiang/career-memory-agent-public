import Link from "next/link";
import { getDemoConfig } from "@/lib/demo/config";

export function DemoBanner() {
  const demo = getDemoConfig();
  if (!demo.isDemoMode) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950 lg:ml-64">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <strong>Public Demo Mode:</strong> This demo uses seeded data and limited
          provider paths. Do not enter private personal information. Data may be reset
          periodically.
        </p>
        <Link className="font-semibold text-amber-900 underline-offset-2 hover:underline" href="/demo">
          View demo scenarios
        </Link>
      </div>
    </div>
  );
}
