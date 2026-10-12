"use client";
import { CheckCircle2 } from "lucide-react";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { ButtonLink } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import { ModeBadge } from "@/components/ui/States";
import { serverConfig } from "@/config/server.config";
import { useMe } from "@/hooks/useMe";
import { useStatus } from "@/hooks/useStatus";
import type { StatusSummary } from "@/types";

/**
 * Large join panel. Shows CONNECTED only when the bot has confirmed the
 * signed-in user is a guild member (server-side check via /api/me).
 */
export function DiscordJoin({ initial }: { initial: StatusSummary | null }) {
  const { data } = useStatus(initial);
  const { me } = useMe();
  const d = data?.discord;
  const connected = me?.inGuild === true;

  return (
    <div className="card relative overflow-hidden p-6 sm:p-10">
      <div aria-hidden="true" className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#5865F2]/20 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-crimson-500/10 blur-3xl" />
      <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#5865F2] text-white shadow-[0_12px_40px_-10px_rgba(88,101,242,0.8)]">
            <BrandIcon name="discord" size={28} />
          </span>
          <h2 className="h-display mt-6 text-4xl text-snow sm:text-6xl">
            {connected ? "You're in the" : "Join the"}
            <br />
            CSRP community
          </h2>
          <p className="mt-4 max-w-lg leading-relaxed text-silver-300">Announcements, whitelist results, department channels, events and support all live in our Discord. It&apos;s where the city talks when it isn&apos;t in the city.</p>
          <div className="mt-8">
            {connected ? (
              <div className="inline-flex items-center gap-3 rounded-xl border border-online/30 bg-online/10 px-5 py-3.5">
                <CheckCircle2 className="text-online" size={22} />
                <div>
                  <p className="font-display text-xl font-bold uppercase tracking-[0.16em] text-online">Connected</p>
                  <p className="text-xs text-silver-400">Verified member as @{me?.username}</p>
                </div>
              </div>
            ) : (
              <ButtonLink href={serverConfig.discordInvite} size="lg" variant="royal" className="!h-16 !px-9 !text-lg">
                <BrandIcon name="discord" size={22} /> Join CSRP Discord
              </ButtonLink>
            )}
          </div>
          {me && me.inGuild === false && <p className="mt-3 text-xs text-silver-500">Logged in as @{me.username} — not in the server yet.</p>}
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <div className="col-span-2 rounded-xl border border-white/[0.07] bg-void/50 p-5">
            <dt className="flex items-center justify-between">
              <span className="tag">Members</span>
              {data && <ModeBadge mode={data.mode.discord} />}
            </dt>
            <dd className="mt-2 font-display text-5xl font-bold text-snow">
              <CountUp value={d?.members ?? null} />
            </dd>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-void/50 p-5">
            <dt className="tag flex items-center gap-2">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-online" /> Online
            </dt>
            <dd className="mt-2 font-display text-3xl font-bold text-snow">
              <CountUp value={d?.online ?? null} />
            </dd>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-void/50 p-5">
            <dt className="tag">Whitelisted</dt>
            <dd className="mt-2 font-display text-3xl font-bold text-snow">
              <CountUp value={d?.whitelisted ?? null} />
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
