"use client";
import { AnimatePresence, m } from "motion/react";
import { ArrowRight, Bell, CheckCheck, X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ApiResult, NotificationView } from "@/types";

const SEEN_KEY = "csrp-notif-seen";
const fmt = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
const actionLabel = (n: NotificationView) => (n.href?.startsWith("/admin") ? "Review" : n.kind === "reminder" ? "Continue" : "Open");

function loadSeen(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

/**
 * Bell + live toasts for signed-in users. Polls every 20s while the tab is
 * visible; new unread notifications slide in (top-right) and, if the user
 * granted permission, also raise a native browser notification.
 */
export function NotificationBell() {
  const { status } = useSession();
  const [items, setItems] = useState<NotificationView[]>([]);
  const [toasts, setToasts] = useState<NotificationView[]>([]);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const seen = useRef<Set<string> | null>(null);
  const first = useRef(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      const j = (await r.json()) as ApiResult<NotificationView[]>;
      if (!j.ok) return;
      setItems(j.data);
      seen.current ??= loadSeen();
      const fresh = j.data.filter((n) => !n.readAt && !seen.current!.has(n.id) && (!first.current || Date.now() - +new Date(n.createdAt) < 120_000));
      j.data.forEach((n) => seen.current!.add(n.id));
      first.current = false;
      try {
        sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen.current].slice(-200)));
      } catch {}
      if (fresh.length) {
        setToasts((t) => [...fresh.slice(0, 3), ...t].slice(0, 4));
        if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
          fresh.slice(0, 2).forEach((n) => {
            const native = new Notification(`CSRP — ${n.title}`, { body: n.body, icon: "/brand/csrp-logo-256.webp", tag: n.id });
            native.onclick = () => {
              window.focus();
              if (n.href) window.location.href = n.href;
            };
          });
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    load();
    const t = setInterval(() => !document.hidden && load(), 20_000);
    const onVis = () => !document.hidden && load();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [status, load]);

  // auto-dismiss toasts
  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts((x) => x.slice(0, -1)), 9000);
    return () => clearTimeout(t);
  }, [toasts]);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const markRead = async (ids?: string[]) => {
    setItems((list) => list.map((n) => (!ids || ids.includes(n.id) ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)));
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ids ? { ids } : {}) }).catch(() => {});
  };

  if (status !== "authenticated") return null;
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <div ref={root} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open} className="relative grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-silver-300 transition-colors hover:border-white/25 hover:text-snow">
        <Bell size={18} />
        {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-crimson-500 px-1 text-[0.65rem] font-bold text-white shadow-[0_0_12px_rgba(220,20,60,0.7)]">{unread > 9 ? "9+" : unread}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <m.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }} className="glass absolute right-0 top-[calc(100%+10px)] w-[min(92vw,360px)] overflow-hidden rounded-xl !bg-charcoal/95 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-snow">Notifications</p>
              {unread > 0 && (
                <button type="button" onClick={() => markRead()} className="inline-flex items-center gap-1 text-xs text-royal-400 hover:text-snow">
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-[60vh] overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-silver-500">You&apos;re all caught up.</li>
              ) : (
                items.map((n) => (
                  <li key={n.id} className="border-b border-white/[0.04] last:border-0">
                    <Link href={n.href ?? "#"} onClick={() => { markRead([n.id]); setOpen(false); }} className={`block px-4 py-3 transition-colors hover:bg-white/[0.04] ${n.readAt ? "opacity-70" : ""}`}>
                      <p className="flex items-center gap-2 text-sm font-semibold text-snow">
                        {!n.readAt && <span className="h-1.5 w-1.5 rounded-full bg-crimson-500" />}
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-silver-400">{n.body}</p>
                      <p className="mt-1 text-[0.65rem] text-silver-500">{fmt(n.createdAt)}</p>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </m.div>
        )}
      </AnimatePresence>

      {typeof document !== "undefined" &&
        createPortal(
          <div className="pointer-events-none fixed right-4 top-24 z-[120] flex w-[min(92vw,380px)] flex-col gap-3" role="region" aria-label="Notifications" aria-live="polite">
            <AnimatePresence initial={false}>
              {toasts.map((n) => (
                <m.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, x: 40, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="toast-glow pointer-events-auto relative overflow-hidden rounded-xl border border-crimson-500/30 bg-[#0b0c11]/95 p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
                >
                  <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-royal-400/0 via-crimson-400 to-royal-400/0" />
                  <button type="button" onClick={() => setToasts((t) => t.filter((x) => x.id !== n.id))} aria-label="Dismiss" className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md text-silver-500 hover:text-snow">
                    <X size={14} />
                  </button>
                  <p className="pr-6 font-display text-sm font-semibold uppercase tracking-[0.14em] text-snow">{n.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-silver-300">{n.body}</p>
                  {n.href && (
                    <Link href={n.href} onClick={() => { markRead([n.id]); setToasts((t) => t.filter((x) => x.id !== n.id)); }} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-crimson-500 px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-crimson-400">
                      {actionLabel(n)} <ArrowRight size={13} />
                    </Link>
                  )}
                </m.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </div>
  );
}
