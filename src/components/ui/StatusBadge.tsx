import type { ApplicationStatus, TicketStatus } from "@/types";

const MAP: Record<ApplicationStatus | TicketStatus, { label: string; cls: string }> = {
  SUBMITTED: { label: "Pending review", cls: "border-royal-400/30 bg-royal-500/10 text-royal-400" },
  INFO_REQUESTED: { label: "Info requested", cls: "border-solar/30 bg-solar/10 text-solar" },
  UNDER_REVIEW: { label: "Under review", cls: "border-warn/30 bg-warn/10 text-warn" },
  INTERVIEW: { label: "Interview", cls: "border-[#b48cff]/30 bg-[#b48cff]/10 text-[#c8aaff]" },
  ACCEPTED: { label: "Accepted", cls: "border-online/30 bg-online/10 text-online" },
  REJECTED: { label: "Rejected", cls: "border-crimson-500/35 bg-crimson-500/10 text-crimson-400" },
  CLOSED: { label: "Closed", cls: "border-white/10 bg-white/[0.03] text-silver-400" },
  OPEN: { label: "Open", cls: "border-royal-400/30 bg-royal-500/10 text-royal-400" },
  ASSIGNED: { label: "Assigned", cls: "border-warn/30 bg-warn/10 text-warn" },
  WAITING_FOR_PLAYER: { label: "Waiting for you", cls: "border-[#b48cff]/30 bg-[#b48cff]/10 text-[#c8aaff]" },
  RESOLVED: { label: "Resolved", cls: "border-online/30 bg-online/10 text-online" },
};

/** Status pill — always text + colour, never colour alone. */
export function StatusBadge({ status }: { status: ApplicationStatus | TicketStatus }) {
  const s = MAP[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${s.cls}`}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

export const statusLabel = (s: ApplicationStatus | TicketStatus) => MAP[s].label;
