import { json } from "@/lib/api";
import { getStatusHistory } from "@/services/status.service";

export const dynamic = "force-dynamic";

/** GET /api/status/history — graph series (24h / 7d / playtime / uptime). */
export async function GET() {
  return json(await getStatusHistory(), { headers: { "Cache-Control": "public, s-maxage=60" } });
}
