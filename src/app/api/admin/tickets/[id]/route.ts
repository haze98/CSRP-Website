import { z } from "zod";
import { api, fail, json, readJson, requirePermission } from "@/lib/api";
import { getStore } from "@/lib/store";
import { ticketPerm } from "@/services/admin.service";
import { SupportService } from "@/services/support.service";

const body = z.object({ status: z.enum(["OPEN", "ASSIGNED", "WAITING_FOR_PLAYER", "RESOLVED", "CLOSED"]), assignToSelf: z.boolean().optional() });

/** PATCH /api/admin/tickets/:id — admins with support.reply (or reports.manage for reports/appeals). */
export const PATCH = api<{ params: Promise<{ id: string }> }>({ admin: true, mutating: true, limit: { key: "admin", max: 120, windowMs: 60_000 } }, async ({ req, user, ctx }) => {
  const { id } = await ctx.params;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return fail("Invalid request.", 422);
  const ticket = await (await getStore())?.getTicket(id);
  if (!ticket) return fail("Ticket not found.", 404);
  await requirePermission(user!, ticketPerm(ticket.type, "manage"));
  return json(await SupportService.setStatus(user!, id, parsed.data.status, parsed.data.assignToSelf ?? false));
});
