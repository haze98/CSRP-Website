"use client";
import { BellRing, BellOff, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { ApiResult } from "@/types";

const b64ToUint8 = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

/**
 * Opt-in for browser notifications on this device. With VAPID keys configured
 * this registers a real Web Push subscription (works when the site is closed);
 * otherwise it enables native notifications while a CSRP tab is open.
 */
export function PushToggle() {
  const [state, setState] = useState<"unsupported" | "off" | "on" | "denied" | "busy">("off");

  useEffect(() => {
    if (typeof Notification === "undefined") return setState("unsupported");
    setState(Notification.permission === "granted" ? "on" : Notification.permission === "denied" ? "denied" : "off");
  }, []);

  const enable = async () => {
    setState("busy");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState(perm === "denied" ? "denied" : "off");
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const key = (await (await fetch("/api/push/subscribe")).json()) as ApiResult<{ publicKey: string | null }>;
        if (key.ok && key.data.publicKey) {
          const reg = await navigator.serviceWorker.register("/sw.js");
          await navigator.serviceWorker.ready;
          const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(key.data.publicKey) }));
          await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
        }
      }
      setState("on");
    } catch {
      setState("off");
    }
  };

  if (state === "unsupported") return null;
  return (
    <button
      type="button"
      onClick={state === "off" ? enable : undefined}
      disabled={state !== "off"}
      title={state === "denied" ? "Notifications are blocked in your browser settings" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors ${state === "on" ? "border-online/30 text-online" : state === "denied" ? "border-white/10 text-silver-500" : "border-white/15 text-silver-300 hover:border-white/30 hover:text-snow"}`}
    >
      {state === "busy" ? <LoaderCircle size={13} className="animate-spin" /> : state === "on" ? <BellRing size={13} /> : <BellOff size={13} />}
      {state === "on" ? "Push on" : state === "denied" ? "Push blocked" : "Enable push"}
    </button>
  );
}
