"use client";
import { ArrowRight, Clock, Crown, HeartPulse, ListChecks, Lock, Shield, Siren, Video } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { RevealItem, Stagger } from "@/components/ui/Reveal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { allFields, applicationDefinitions, type AppDefinition } from "@/config/applications";
import type { ApiResult, ApplicationStatus, ApplicationType } from "@/types";
import { ApplyModal } from "./ApplyModal";
import { WhitelistFlow } from "./WhitelistFlow";

const ICONS = { shield: Shield, siren: Siren, heart: HeartPulse, crown: Crown, video: Video } as const;
const ACCENT = {
  blue: { ring: "border-royal-400/25 bg-royal-500/10 text-royal-400", line: "from-royal-400" },
  red: { ring: "border-crimson-400/25 bg-crimson-500/10 text-crimson-400", line: "from-crimson-400" },
  silver: { ring: "border-white/15 bg-white/[0.05] text-moon-200", line: "from-moon-200" },
} as const;

type Mine = { id: string; publicId: string; type: ApplicationType; status: ApplicationStatus; createdAt: string };

export function ApplicationsBoard({ openState }: { openState: Record<ApplicationType, boolean> }) {
  const { status } = useSession();
  const [active, setActive] = useState<AppDefinition | null>(null);
  const [open, setOpen] = useState(false);
  const [mine, setMine] = useState<Mine[]>([]);

  const loadMine = useCallback(() => {
    fetch("/api/applications", { cache: "no-store" })
      .then((r) => r.json() as Promise<ApiResult<Mine[]>>)
      .then((j) => j.ok && setMine(j.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadMine();
  }, [status, loadMine]);

  const openApp = useCallback((def: AppDefinition) => {
    setActive(def);
    setOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set("apply", def.type);
    window.history.replaceState(null, "", url);
  }, []);

  const close = () => {
    setOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("apply");
    window.history.replaceState(null, "", url);
  };

  // deep link: /applications?apply=lspd
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("apply");
    const def = applicationDefinitions.find((d) => d.type === t);
    if (def && openState[def.type]) openApp(def);
    else if (def) document.getElementById(`app-${def.type}`)?.scrollIntoView({ block: "center" });
  }, [openApp, openState]);

  const latest = (t: ApplicationType) => mine.filter((a) => a.type === t).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];

  return (
    <>
      <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {applicationDefinitions.map((def, i) => {
          const Icon = ICONS[def.icon];
          const acc = ACCENT[def.accent];
          const isOpen = openState[def.type];
          const qs = allFields(def).length;
          const mineLatest = latest(def.type);
          const quiz = def.flow === "quiz";
          // whitelist can always be opened (it shows the current status); others lock while one is active
          const activeApp = !quiz && mineLatest && ["SUBMITTED", "UNDER_REVIEW", "INFO_REQUESTED", "INTERVIEW"].includes(mineLatest.status);
          return (
            <RevealItem key={def.type} className={i === 0 ? "md:col-span-2 xl:col-span-1 xl:row-span-2" : ""}>
              <article id={`app-${def.type}`} data-glow="" className="card group relative flex h-full scroll-mt-28 flex-col overflow-hidden p-6 sm:p-7">
                <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${acc.line} to-transparent opacity-70`} />
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid h-12 w-12 place-items-center rounded-xl border ${acc.ring}`}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em] ${isOpen ? "border-online/30 bg-online/10 text-online" : "border-white/10 text-silver-500"}`}>
                    <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-online" : "bg-silver-500"}`} />
                    {isOpen ? "Open" : "Closed"}
                  </span>
                </div>
                <p className="tag mt-6">{def.department}</p>
                <h2 className="h-display mt-2 text-3xl text-snow sm:text-[2.4rem]">{def.short}</h2>
                <p className="mt-3 leading-relaxed text-silver-400">{def.description}</p>
                <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-silver-500">
                  <li className="flex items-center gap-1.5"><ListChecks size={14} aria-hidden="true" /> {quiz ? "5-question rule assessment + 1 written answer" : `${def.steps.length + 1} steps · ${qs} questions`}</li>
                  <li className="flex items-center gap-1.5"><Clock size={14} aria-hidden="true" /> ~{quiz ? 6 : Math.max(5, Math.round(qs * 1.6))} min</li>
                </ul>
                {i === 0 && (
                  <ol className="mt-6 space-y-2 border-t border-white/[0.06] pt-5 text-sm text-silver-300">
                    {(quiz ? ["Rule assessment (5 questions)", "Result", "Why CSRP", "Review & submit"] : [...def.steps.map((s) => s.title), "Review & submit"]).map((t, k) => (
                      <li key={t} className="flex items-center gap-3">
                        <span className="font-display text-xs font-semibold text-crimson-400">{String(k + 1).padStart(2, "0")}</span> {t}
                      </li>
                    ))}
                  </ol>
                )}
                <div className="mt-auto pt-7">
                  {mineLatest && (
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.07] bg-void/40 px-3 py-2 text-xs">
                      <span className="font-mono text-silver-300">{mineLatest.publicId}</span>
                      <StatusBadge status={mineLatest.status} />
                    </div>
                  )}
                  {isOpen ? (
                    <button
                      type="button"
                      onClick={() => openApp(def)}
                      disabled={!!activeApp}
                      className="group/btn inline-flex w-full items-center justify-between rounded-lg border border-white/12 bg-white/[0.03] px-4 py-3 font-display text-sm font-semibold uppercase tracking-[0.16em] text-snow transition-colors hover:border-crimson-400/60 hover:bg-crimson-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-white/12 disabled:hover:bg-white/[0.03]"
                    >
                      {activeApp ? "Application in progress" : "Start application"}
                      <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" aria-hidden="true" />
                    </button>
                  ) : (
                    <p className="flex items-center gap-2 rounded-lg border border-white/[0.07] px-4 py-3 text-sm text-silver-500">
                      <Lock size={14} aria-hidden="true" /> Applications closed — watch Discord announcements.
                    </p>
                  )}
                </div>
              </article>
            </RevealItem>
          );
        })}
      </Stagger>
      <ApplyModal def={active?.flow === "quiz" ? null : active} open={open && active?.flow !== "quiz"} onClose={close} onSubmitted={() => loadMine()} />
      <WhitelistFlow open={open && active?.flow === "quiz"} onClose={close} onSubmitted={() => loadMine()} />
    </>
  );
}
