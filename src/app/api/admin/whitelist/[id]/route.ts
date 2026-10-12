import { z } from "zod";
import { api, fail, json, readJson } from "@/lib/api";
import { WhitelistService } from "@/services/whitelist.service";

const body = z.object({
  action: z.enum(["approve", "reject", "request_info", "reply", "note", "retry_sync"]),
  message: z.string().max(1500).optional(),
  dm: z.boolean().optional(),
  push: z.boolean().optional(),
});

/**
 * POST /api/admin/whitelist/:id — review actions. Requires whitelist.view to
 * reach the handler; WhitelistService.review then requires the action's own
 * permission (whitelist.approve / whitelist.reject) against fresh access.
 */
export const POST = api<{ params: Promise<{ id: string }> }>({ admin: "whitelist.view", mutating: true, limit: { key: "admin", max: 120, windowMs: 60_000 } }, async ({ req, user, ctx, access }) => {
  const { id } = await ctx.params;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return fail("Invalid request.", 422);
  const app = await WhitelistService.review(user!, access!, id, parsed.data.action, parsed.data);
  return json({ id: app?.id, status: app?.status, roleSyncError: app?.roleSyncError ?? null });
});
