import { api, json, readJson } from "@/lib/api";
import { requireStore } from "@/lib/store";
import { SupportService } from "@/services/support.service";

/** POST /api/support — { type, subject, body, ...details } (Discord login required). */
export const POST = api({ auth: true, mutating: true, limit: { key: "support", max: 6, windowMs: 10 * 60_000 } }, async ({ req, user }) => {
  const { type, ...rest } = await readJson(req);
  const ticket = await SupportService.create(user!, String(type ?? ""), rest);
  return json({ id: ticket.id, publicId: ticket.publicId, status: ticket.status }, { status: 201 });
});

/** GET /api/support — the signed-in user's tickets. */
export const GET = api({ auth: true }, async ({ user }) => {
  const store = await requireStore();
  return json(await store.listUserTickets(user!.id));
});
