"use client";
import { serverConfig } from "@/config/server.config";
import { useStatus } from "@/hooks/useStatus";
import { fivemState, toneDot } from "@/lib/status-labels";
import type { StatusSummary } from "@/types";

/** Live information strip directly under the hero. Every cell has a fallback. */
export function QuickBar({ initial }: { initial: StatusSummary | null }) {
  const { data, error } = useStatus(initial);
  const st = fivemState(data, error);
  const f = data?.fivem;
  const d = data?.discord;
  const items = [
    { k: "Server", v: st.label, dot: toneDot[st.tone] },
    { k: "Players", v: `${f?.online ? f.players : "--"} / ${f?.maxPlayers ?? serverConfig.maxPlayers}` },
    { k: "Discord", v: d ? `${d.members.toLocaleString("en-US")} members` : "-- members" },
    { k: "Whitelist", v: (data?.whitelistOpen ?? serverConfig.applications.whitelist.open) ? "Open" : "Closed", accent: true },
    { k: "Region", v: serverConfig.region },
  ];
  return (
    <section id="live-strip" aria-label="Live community information" className="relative z-10 scroll-mt-24">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] md:grid-cols-5">
          {items.map((it, i) => (
            <div key={it.k} className={`flex flex-col gap-1.5 bg-[#07090c]/95 px-5 py-4 sm:px-6 sm:py-5 ${i === 4 ? "max-md:col-span-2" : ""}`}>
              <span className="tag">{it.k}</span>
              <span className="flex items-center gap-2 font-display text-lg font-semibold uppercase tracking-wide text-snow lg:text-xl">
                {it.dot && <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${it.dot}`} />}
                <span className={`truncate tabular-nums ${it.accent ? "text-online" : ""}`}>{it.v}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
