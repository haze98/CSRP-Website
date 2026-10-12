import { z } from "zod";
import { api, fail, json, readJson } from "@/lib/api";
import { AdminService } from "@/services/admin.service";
import { LoggingService } from "@/services/logging.service";
import { ADMIN_LEVELS, ADMIN_PERMISSIONS } from "@/types";

/** GET /api/admin/admins — list website admins (OWNER only). */
export const GET = api({ admin: "admins.manage" }, async () => json(await AdminService.list()));

const body = z.object({
  discordId: z.string().trim().max(32),
  level: z.enum(ADMIN_LEVELS),
  active: z.boolean(),
  permissions: z.array(z.enum(ADMIN_PERMISSIONS)).optional(),
});

/** POST /api/admin/admins — grant / change / revoke website admin access (OWNER only, audited). */
export const POST = api({ admin: "admins.manage", mutating: true, limit: { key: "admin-admins", max: 30, windowMs: 10 * 60_000 } }, async ({ req, user, access }) => {
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return fail("Invalid request.", 422);
  try {
    const { previous, rec } = await AdminService.setAccess(access!, parsed.data);
    const state = (r: typeof rec | null) => (r ? { level: r.accessLevel, active: r.active, permissions: r.permissions } : null);
    await LoggingService.log({
      category: "SECURITY",
      action: !parsed.data.active ? "ADMIN_ACCESS_REMOVED" : previous?.active ? "ADMIN_ACCESS_CHANGED" : "ADMIN_ACCESS_ADDED",
      actor: user,
      targetId: rec.discordId,
      previous: state(previous),
      next: state(rec),
      fields: [{ name: "Level", value: rec.accessLevel, inline: true }],
    });
    return json(rec);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not update admin access.", 400);
  }
});
