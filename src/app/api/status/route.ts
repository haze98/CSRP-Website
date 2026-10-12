import { json } from "@/lib/api";
import { getStatusSummary } from "@/services/status.service";

export const dynamic = "force-dynamic";

/** GET /api/status — public live summary (cached ~15s server-side). */
export async function GET() {
  const summary = await getStatusSummary();
  return json(summary, { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } });
}
