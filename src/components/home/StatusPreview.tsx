"use client";
import { ArrowRight, RefreshCw } from "lucide-react";
import { LiveTiles, OnlineBadge, syncLabel } from "@/components/status/LiveTiles";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { useStatus } from "@/hooks/useStatus";
import type { StatusHistory, StatusSummary } from "@/types";

export function StatusPreview({ initial, history }: { initial: StatusSummary | null; history: StatusHistory | null }) {
  const { data, loading, error } = useStatus(initial);
  return (
    <section data-tone="neutral" aria-labelledby="network-title" className="relative py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8">
        <Reveal className="card relative overflow-hidden p-5 sm:p-8 lg:p-10">
          <div aria-hidden="true" className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-royal-500/10 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-crimson-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 border-b border-white/[0.06] pb-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-display text-sm font-semibold text-crimson-400">03</span>
                <span className="tag">[ Live city network ]</span>
              </div>
              <h2 id="network-title" className="h-display mt-4 text-5xl text-snow sm:text-7xl">
                CSRP <span className="bg-gradient-to-r from-moon-200 to-crimson-400 bg-clip-text text-transparent">live network</span>
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <OnlineBadge data={data} error={error} />
              <span className="inline-flex items-center gap-1.5 text-xs text-silver-500">
                <RefreshCw size={12} aria-hidden="true" className={loading && !data ? "animate-spin" : ""} /> Last sync{" "}
                <time dateTime={data?.syncedAt} className="tabular-nums text-silver-300">{data ? syncLabel(data.syncedAt) : "waiting…"}</time>
              </span>
            </div>
          </div>
          <div className="relative mt-7">
            <LiveTiles data={data} history={history} loading={loading} error={error} />
          </div>
          <div className="relative mt-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="max-w-lg text-sm text-silver-500">Player counts come straight from the FiveM server and Discord numbers from the CSRP bot. Both refresh automatically every 30 seconds.</p>
            <ButtonLink href="/status" variant="outline">
              View full status <ArrowRight size={16} />
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
