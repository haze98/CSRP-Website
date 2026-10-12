import { z } from "zod";
import { api, fail, json, readJson } from "@/lib/api";
import { WhitelistService } from "@/services/whitelist.service";

const body = z.object({
  userIds: z.array(z.string().max(64)).max(5000).optional(),
  allIncomplete: z.boolean().optional(),
  web: z.boolean(),
  push: z.boolean(),
  dm: z.boolean(),
  dryRun: z.boolean().optional(),
});

/** POST /api/admin/whitelist/remind — dryRun returns the recipient count for confirmation. */
export const POST = api({ admin: "notifications.send", mutating: true, limit: { key: "admin-remind", max: 20, windowMs: 10 * 60_000 } }, async ({ req, user, access }) => {
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return fail("Invalid request.", 422);
  return json(await WhitelistService.remind(user!, access!, parsed.data));
});
