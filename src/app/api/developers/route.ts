import { json } from "@/lib/api";
import { getDevelopers } from "@/services/developer.service";

export const dynamic = "force-dynamic";

/** GET /api/developers — cards built from manually configured Discord IDs. */
export async function GET() {
  return json(await getDevelopers(), { headers: { "Cache-Control": "public, s-maxage=300" } });
}
