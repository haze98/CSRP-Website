import { z } from "zod";
import { api, fail, json, readJson } from "@/lib/api";
import { env } from "@/lib/env";
import { getStore } from "@/lib/store";

/** GET /api/push/subscribe — the PUBLIC VAPID key (safe to expose), or null when push isn't configured. */
export const GET = api({}, async () => json({ publicKey: env.vapidPublicKey || null }));

const body = z.object({ endpoint: z.string().url().max(800), keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }) });

/** POST /api/push/subscribe — store this device's push subscription for the signed-in user. */
export const POST = api({ auth: true, mutating: true, limit: { key: "push-sub", max: 10, windowMs: 10 * 60_000 } }, async ({ req, user }) => {
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return fail("Invalid subscription.", 422);
  const store = await getStore();
  await store?.savePushSubscription({ discordId: user!.discordId, endpoint: parsed.data.endpoint, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth });
  return json({ ok: true });
});

/** DELETE /api/push/subscribe — { endpoint } */
export const DELETE = api({ auth: true, mutating: true }, async ({ req }) => {
  const b = await readJson(req);
  const store = await getStore();
  if (typeof b.endpoint === "string") await store?.deletePushSubscription(b.endpoint);
  return json({ ok: true });
});
