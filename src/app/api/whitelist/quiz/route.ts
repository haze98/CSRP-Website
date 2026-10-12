import { api, json } from "@/lib/api";
import { WhitelistService } from "@/services/whitelist.service";

/** POST /api/whitelist/quiz — start an attempt. Returns questions + random option tokens only (never answers). */
export const POST = api({ auth: true, mutating: true, limit: { key: "wl-start", max: 8, windowMs: 10 * 60_000 } }, async ({ user }) => json(await WhitelistService.startQuiz(user!), { status: 201 }));
