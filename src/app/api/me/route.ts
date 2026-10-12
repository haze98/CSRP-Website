import { getCurrentUser } from "@/auth";
import { json } from "@/lib/api";
import { UserService } from "@/services/user.service";

export const dynamic = "force-dynamic";

/** GET /api/me — current user + server-verified roles (null when signed out). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return json(null, { headers: { "Cache-Control": "no-store" } });
  return json(await UserService.getView(user), { headers: { "Cache-Control": "no-store" } });
}
