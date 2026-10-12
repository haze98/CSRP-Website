import { z } from "zod";
import { api, fail, json, readJson } from "@/lib/api";
import { ApplicationService } from "@/services/application.service";

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), status: z.enum(["SUBMITTED", "UNDER_REVIEW", "INFO_REQUESTED", "INTERVIEW", "ACCEPTED", "REJECTED", "CLOSED"]), note: z.string().max(1000).optional(), notify: z.boolean().optional() }),
  z.object({ action: z.literal("note"), note: z.string().trim().min(1).max(1000) }),
  z.object({ action: z.literal("assign"), reviewerId: z.string().nullable() }),
]);

/** PATCH /api/admin/applications/:id — staff only (role verified server-side). */
export const PATCH = api<{ params: Promise<{ id: string }> }>({ admin: "applications.review", mutating: true, limit: { key: "admin", max: 120, windowMs: 60_000 } }, async ({ req, user, ctx }) => {
  const { id } = await ctx.params;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return fail("Invalid request.", 422);
  const b = parsed.data;
  const app =
    b.action === "status"
      ? await ApplicationService.setStatus(user!, id, b.status, b.note?.trim() || null, b.notify ?? false)
      : b.action === "note"
        ? await ApplicationService.addNote(user!, id, b.note)
        : await ApplicationService.assign(user!, id, b.reviewerId === "me" ? user!.id : b.reviewerId);
  return json(app);
});
