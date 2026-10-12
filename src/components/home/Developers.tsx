"use client";
import { Check, Copy, UserRound } from "lucide-react";
import { useState } from "react";
import { CsrpCrest } from "@/components/brand/CsrpLogo";
import { Avatar } from "@/components/ui/Avatar";
import { InfiniteCarousel } from "@/components/ui/InfiniteCarousel";
import { Reveal, RevealItem, Stagger } from "@/components/ui/Reveal";
import type { DeveloperView } from "@/types";

const STATUS: Record<DeveloperView["status"], { label: string; cls: string } | null> = {
  online: { label: "Online", cls: "bg-online" },
  idle: { label: "Idle", cls: "bg-warn" },
  dnd: { label: "Do not disturb", cls: "bg-crimson-500" },
  offline: { label: "Offline", cls: "bg-silver-500" },
  unknown: null, // presence not available → show nothing rather than guess
};

/** Real developer — only ever built from manually configured DEVELOPER_DISCORD_IDS. */
function DevCard({ dev }: { dev: DeveloperView }) {
  const [copied, setCopied] = useState(false);
  const s = STATUS[dev.status];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(dev.discordId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <article data-glow="" className="dev-card card group relative flex h-full min-h-[340px] flex-col overflow-hidden p-6 transition-transform duration-300 hover:-translate-y-1">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#a9bdd8]/0 via-[#a9bdd8]/70 to-crimson-500/70" />
      <div className="flex items-center gap-4">
        <div className="relative">
          <span aria-hidden="true" className="absolute inset-[-6px] rounded-2xl bg-[radial-gradient(closest-side,rgba(95,134,255,0.35),transparent)] opacity-0 transition-opacity group-hover:opacity-100" />
          <Avatar name={dev.displayName} src={dev.avatarUrl} size={64} className="relative" />
          {s && <span className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-charcoal ${s.cls}`} title={s.label} />}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-display text-2xl font-semibold uppercase tracking-wide text-snow">{dev.displayName}</h3>
          <p className="truncate text-sm text-silver-500">@{dev.username}</p>
        </div>
      </div>
      <p className="mt-6 font-display text-lg font-semibold uppercase tracking-wide text-crimson-400">{dev.title}</p>
      <p className="text-sm text-silver-300">{dev.role}</p>
      {dev.skills.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {dev.skills.map((sk) => (
            <li key={sk} className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-xs text-silver-300">
              {sk}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/[0.06] pt-4">
        <div className="min-w-0">
          <p className="tag !text-[0.6rem]">Discord ID</p>
          <p className="truncate font-mono text-xs tabular-nums text-silver-300">{dev.discordId}</p>
        </div>
        <button type="button" onClick={copy} aria-label={`Copy Discord ID of ${dev.displayName}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/10 text-silver-400 transition-colors hover:text-snow">
          {copied ? <Check size={14} className="text-online" /> : <Copy size={14} />}
        </button>
      </div>
    </article>
  );
}

/** Neutral empty slot — no names, IDs, skills or status are invented. */
function EmptySlot({ index }: { index: number }) {
  const slot = index % 2 === 0;
  return (
    <article className="dev-empty group relative flex h-full min-h-[340px] flex-col overflow-hidden rounded-[14px] p-6 transition-transform duration-300 hover:-translate-y-1">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-16 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(95,134,255,0.16),transparent)]" />
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#a9bdd8]/0 via-[#a9bdd8]/60 to-crimson-500/60" />
      <div className="relative flex items-start justify-between">
        <span className="grid h-16 w-16 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] text-silver-500">
          <UserRound size={30} strokeWidth={1.4} aria-hidden="true" />
        </span>
        <span className="crest-float opacity-40 transition-opacity group-hover:opacity-70" aria-hidden="true">
          <CsrpCrest size={36} className="h-9 w-9" />
        </span>
      </div>
      <p className="relative mt-6 font-display text-xl font-semibold uppercase tracking-wide text-snow">{slot ? "Developer profile" : "Developer slot"}</p>
      <p className="relative mt-1 text-sm text-silver-400">{slot ? "Discord profile not connected yet." : "Waiting for developer profile."}</p>

      {/* where the Discord profile will appear */}
      <div aria-hidden="true" className="relative mt-5 space-y-2 rounded-xl border border-dashed border-white/[0.09] p-3">
        <div className="skeleton h-2.5 w-2/3 rounded-full" />
        <div className="skeleton h-2.5 w-1/2 rounded-full" />
      </div>

      <dl className="relative mt-auto space-y-3 border-t border-white/[0.06] pt-4 text-xs">
        <div className="flex items-center justify-between gap-3">
          <dt className="tag !text-[0.6rem]">Discord ID</dt>
          <dd className="font-mono text-silver-500">— not configured —</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="tag !text-[0.6rem]">Status</dt>
          <dd className="inline-flex items-center gap-1.5 rounded-full border border-warn/25 bg-warn/[0.07] px-2 py-0.5 font-semibold uppercase tracking-[0.12em] text-warn">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warn" /> Awaiting sync
          </dd>
        </div>
      </dl>
    </article>
  );
}

/** Development team — real profiles from configured Discord IDs, otherwise intentional empty slots. */
export function Developers({ developers }: { developers: DeveloperView[]; mode?: string }) {
  const hasReal = developers.length > 0;
  return (
    <section data-tone="neutral" aria-labelledby="devs-title" className="overflow-hidden py-24 sm:py-32">
      <div className="mx-auto w-full max-w-[1320px] px-5 sm:px-8">
        <Reveal className="grid items-end gap-6 lg:grid-cols-[1.7fr_1fr] lg:gap-12">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-display text-sm font-semibold text-crimson-400">07</span>
              <span className="text-silver-500">/</span>
              <span className="tag">Development team</span>
              <span aria-hidden="true" className="hidden h-px w-16 bg-gradient-to-r from-white/20 to-transparent sm:block" />
            </div>
            <h2 id="devs-title" className="h-display mt-4 text-[2.6rem] text-snow sm:text-6xl lg:text-[4.1rem]">
              Built by the
              <br />
              <span className="bg-[linear-gradient(100deg,#f7f9fc,#a9bdd8)] bg-clip-text text-transparent">CSRP</span>{" "}
              <span className="bg-[linear-gradient(100deg,#f7f9fc_0%,#ef4a5c_55%,#dc143c_100%)] bg-clip-text text-transparent">development team.</span>
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-silver-300 lg:justify-self-end lg:pb-2 lg:text-right">
            The people behind Chandra Surya Roleplay&apos;s systems, scripts, environments and platform.
            {!hasReal && <span className="mt-2 block text-sm text-silver-500">Profiles appear here automatically once their Discord accounts are connected.</span>}
          </p>
        </Reveal>

        <div className="mt-12">
          {!hasReal ? (
            <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <RevealItem key={i} className={i >= 2 ? (i === 3 ? "hidden sm:block lg:hidden xl:block" : "hidden sm:block") : ""}>
                  <EmptySlot index={i} />
                </RevealItem>
              ))}
            </Stagger>
          ) : developers.length > 4 ? (
            <InfiniteCarousel label="CSRP developers" speed={34}>
              {developers.map((d) => (
                <div key={d.discordId} className="w-[300px] sm:w-[320px]">
                  <DevCard dev={d} />
                </div>
              ))}
            </InfiniteCarousel>
          ) : (
            <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {developers.map((d) => (
                <RevealItem key={d.discordId}>
                  <DevCard dev={d} />
                </RevealItem>
              ))}
            </Stagger>
          )}
        </div>
      </div>
    </section>
  );
}
