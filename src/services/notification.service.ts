import "server-only";
import webpush from "web-push";
import { env } from "@/lib/env";
import { getStore } from "@/lib/store";

/**
 * NotificationService — website notifications (stored per Discord ID, shown
 * as toasts + bell list) and optional browser push (Web Push / VAPID).
 * Push is used only for users who opted in on a device; if VAPID keys are
 * not configured, open tabs still raise native notifications from polling.
 */
let vapidReady = false;
function initPush() {
  if (vapidReady || !env.vapidPublicKey || !env.vapidPrivateKey) return vapidReady;
  try {
    webpush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);
    vapidReady = true;
  } catch (e) {
    console.error("[push] invalid VAPID configuration", e);
  }
  return vapidReady;
}

export interface NotifyInput {
  discordIds: string[];
  kind: "whitelist" | "application" | "support" | "reminder" | "info";
  title: string;
  body: string;
  href?: string | null;
  /** Also send a browser push to opted-in devices. */
  push?: boolean;
}

export const NotificationService = {
  pushConfigured: () => Boolean(env.vapidPublicKey && env.vapidPrivateKey),

  async notify(n: NotifyInput) {
    const ids = [...new Set(n.discordIds)].filter(Boolean);
    if (!ids.length) return { web: 0, push: 0 };
    const store = await getStore();
    if (!store) return { web: 0, push: 0 };
    await store.createNotifications(ids.map((discordId) => ({ discordId, kind: n.kind, title: n.title, body: n.body, href: n.href ?? null })));
    let pushed = 0;
    if (n.push && initPush()) {
      const subs = await store.listPushSubscriptions(ids);
      const payload = JSON.stringify({ title: n.title, body: n.body, url: n.href ?? "/", tag: n.kind });
      await Promise.all(
        subs.map(async (s) => {
          try {
            await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600 });
            pushed++;
          } catch (e) {
            const code = (e as { statusCode?: number }).statusCode;
            if (code === 404 || code === 410) await store.deletePushSubscription(s.endpoint); // expired subscription
          }
        }),
      );
    }
    return { web: ids.length, push: pushed };
  },
};
