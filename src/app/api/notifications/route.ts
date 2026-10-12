import { api, json, readJson } from "@/lib/api";
import { getStore } from "@/lib/store";

/** GET /api/notifications — the signed-in user's latest notifications. */
export const GET = api({ auth: true, limit: { key: "notif", max: 120, windowMs: 60_000 } }, async ({ user }) => {
  const store = await getStore();
  return json(store ? await store.listNotifications(user!.discordId, 30) : [], { headers: { "Cache-Control": "no-store" } });
});

/** POST /api/notifications — { ids?: string[] } mark as read (all when omitted). */
export const POST = api({ auth: true, mutating: true, limit: { key: "notif-read", max: 60, windowMs: 60_000 } }, async ({ req, user }) => {
  const body = await readJson(req);
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string").slice(0, 100) : undefined;
  const store = await getStore();
  await store?.markNotificationsRead(user!.discordId, ids);
  return json({ ok: true });
});
