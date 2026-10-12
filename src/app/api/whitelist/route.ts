import { api, json } from "@/lib/api";
import { WhitelistService } from "@/services/whitelist.service";

/** GET /api/whitelist — the signed-in player's whitelist state. */
export const GET = api({ auth: true }, async ({ user }) => json(await WhitelistService.getMyState(user!), { headers: { "Cache-Control": "no-store" } }));
