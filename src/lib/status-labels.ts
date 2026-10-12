import type { DataMode, StatusSummary } from "@/types";

/**
 * One vocabulary for every live indicator on the site, so nothing ever
 * renders empty:
 *  - CONNECTING              first request still in flight
 *  - ONLINE / OFFLINE        live answer from the integration
 *  - NOT CONFIGURED          integration not set up
 *  - NOT CONNECTED           request failed
 */
export type LiveTone = "online" | "offline" | "pending" | "idle" | "mock";

export function fivemState(data: StatusSummary | null, error = false): { label: string; tone: LiveTone } {
  if (!data) return error ? { label: "Not connected", tone: "idle" } : { label: "Connecting", tone: "pending" };
  if (data.mode.fivem === "unavailable") return { label: "Not configured", tone: "idle" };
  if (data.fivem?.online) return { label: "Online", tone: data.mode.fivem === "mock" ? "mock" : "online" };
  return { label: "Offline", tone: "offline" };
}

export function modeLabel(mode: DataMode | undefined, loading: boolean) {
  if (!mode) return loading ? "Connecting" : "Not connected";
  if (mode === "unavailable") return "Not configured";
  return null;
}

export const toneDot: Record<LiveTone, string> = {
  online: "bg-online",
  mock: "bg-online",
  offline: "bg-crimson-500",
  pending: "bg-warn animate-pulse",
  idle: "bg-silver-500",
};
