import { CircleAlert, Inbox, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

export function Spinner({ label = "Loading…", className = "" }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={`flex items-center justify-center gap-3 py-10 text-sm text-silver-400 ${className}`}>
      <LoaderCircle size={18} className="animate-spin text-royal-400" aria-hidden="true" />
      {label}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton rounded-lg ${className}`} />;
}

export function ErrorState({ title = "Something went wrong", message, action }: { title?: string; message?: string; action?: ReactNode }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-crimson-500/25 bg-crimson-500/[0.05] px-6 py-8 text-center">
      <CircleAlert size={22} className="text-crimson-400" aria-hidden="true" />
      <p className="font-display text-lg font-semibold uppercase tracking-wide text-snow">{title}</p>
      {message && <p className="max-w-md text-sm text-silver-300">{message}</p>}
      {action}
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-6 py-10 text-center">
      <Inbox size={22} className="text-silver-500" aria-hidden="true" />
      <p className="font-display text-lg font-semibold uppercase tracking-wide text-snow">{title}</p>
      {message && <p className="max-w-md text-sm text-silver-400">{message}</p>}
      {action}
    </div>
  );
}

/** Small badge: integration not configured, or demo values (development opt-in only). */
export function ModeBadge({ mode }: { mode: "live" | "mock" | "unavailable" }) {
  if (mode === "live") return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] ${mode === "mock" ? "border-warn/30 bg-warn/10 text-warn" : "border-white/10 text-silver-500"}`}>
      {mode === "mock" ? "Demo values" : "Not configured"}
    </span>
  );
}
