"use client";
import { Bug, CheckCircle2, Flag, LifeBuoy, LoaderCircle, Mail, Scale, Send } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { useLogin } from "@/components/providers/Providers";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { EmptyState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AppField } from "@/config/applications";
import { supportDefinitions, type SupportDefinition } from "@/config/support";
import { validateOne } from "@/lib/validation";
import type { ApiResult, TicketView } from "@/types";

const ICONS = { lifebuoy: LifeBuoy, flag: Flag, scale: Scale, bug: Bug, mail: Mail } as const;
const subjectField: AppField = { key: "subject", label: "Subject", kind: "text", required: true, min: 4, max: 120, placeholder: "A short summary" };
const bodyField: AppField = { key: "body", label: "Description", kind: "textarea", required: true, min: 20, max: 4000, placeholder: "Tell us what happened, with as much detail as you can." };

const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", day: "numeric", month: "short", year: "numeric" });

export function SupportCenter() {
  const { status } = useSession();
  const { login } = useLogin();
  const [def, setDef] = useState<SupportDefinition>(supportDefinitions[0]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [tickets, setTickets] = useState<TicketView[] | null>(null);

  const loadTickets = useCallback(() => {
    fetch("/api/support", { cache: "no-store" })
      .then((r) => r.json() as Promise<ApiResult<TicketView[]>>)
      .then((j) => setTickets(j.ok ? j.data : []))
      .catch(() => setTickets([]));
  }, []);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("type");
    const d = supportDefinitions.find((x) => x.type === t || x.slug === t);
    if (d) setDef(d);
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadTickets();
  }, [status, loadTickets]);

  const fields = [subjectField, ...def.fields, bodyField];

  const choose = (d: SupportDefinition) => {
    setDef(d);
    setErrors({});
    setServerError(null);
    setCreated(null);
    const url = new URL(window.location.href);
    url.searchParams.set("type", d.type);
    window.history.replaceState(null, "", url);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    for (const f of fields) {
      const m = validateOne(f, values[f.key] ?? "");
      if (m) errs[f.key] = m;
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      setTimeout(() => document.querySelector<HTMLElement>("#support-form [aria-invalid=true]")?.focus(), 30);
      return;
    }
    setSending(true);
    setServerError(null);
    try {
      const payload: Record<string, string> = { type: def.type };
      for (const f of fields) if (values[f.key]) payload[f.key] = values[f.key];
      const r = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = (await r.json()) as ApiResult<{ publicId: string }>;
      if (!j.ok) {
        setServerError(j.error);
        if (j.fieldErrors) setErrors(j.fieldErrors);
        return;
      }
      setCreated(j.data.publicId);
      setValues({});
      loadTickets();
    } catch {
      setServerError("Network error — please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:gap-12">
      <div role="tablist" aria-label="Request type" aria-orientation="vertical" className="flex flex-col gap-2">
        {supportDefinitions.map((d) => {
          const Icon = ICONS[d.icon];
          const active = d.type === def.type;
          return (
            <button key={d.type} role="tab" type="button" aria-selected={active} onClick={() => choose(d)} className={`group flex items-start gap-4 rounded-xl border p-4 text-left transition-colors ${active ? "border-crimson-400/50 bg-crimson-500/[0.07]" : "border-white/[0.07] bg-charcoal/60 hover:border-white/15"}`}>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${active ? "border-crimson-400/40 text-crimson-400" : "border-white/10 text-silver-400"}`}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <span>
                <span className="block font-display text-lg font-semibold uppercase tracking-wide text-snow">{d.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-silver-500">{d.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-10">
        <section role="tabpanel" aria-label={def.label} className="card p-5 sm:p-8">
          <h2 className="h-display text-3xl text-snow sm:text-4xl">{def.label}</h2>
          <p className="mt-2 text-sm text-silver-400">{def.description}</p>
          {status === "loading" ? (
            <div className="flex justify-center py-12">
              <LoaderCircle className="animate-spin text-royal-400" aria-label="Loading" />
            </div>
          ) : status !== "authenticated" ? (
            <div className="mt-8 flex flex-col items-start gap-4 rounded-xl border border-white/[0.07] bg-void/40 p-6">
              <p className="text-sm text-silver-300">Log in with Discord so staff can reply to you and you can follow the ticket from your dashboard.</p>
              <Button variant="royal" onClick={() => login(`/support?type=${def.type}`)}>
                <BrandIcon name="discord" size={16} /> Login with Discord
              </Button>
            </div>
          ) : created ? (
            <div className="mt-8 flex flex-col items-center rounded-xl border border-online/25 bg-online/[0.05] p-8 text-center">
              <CheckCircle2 size={32} className="text-online" />
              <p className="h-display mt-4 text-2xl text-snow">Request received</p>
              <p className="mt-2 font-mono text-lg text-snow">{created}</p>
              <p className="mt-2 max-w-sm text-sm text-silver-400">Staff have been notified in Discord. You&apos;ll see updates below and on your dashboard.</p>
              <Button variant="outline" className="mt-6" onClick={() => setCreated(null)}>
                Submit another
              </Button>
            </div>
          ) : (
            <form id="support-form" onSubmit={submit} noValidate className="mt-8 space-y-5">
              {fields.map((f) => (
                <FormField
                  key={`${def.type}-${f.key}`}
                  field={f}
                  value={values[f.key] ?? ""}
                  error={errors[f.key]}
                  onChange={(v) => {
                    setValues((s) => ({ ...s, [f.key]: v }));
                    if (errors[f.key]) setErrors((e) => ({ ...e, [f.key]: validateOne(f, v) ?? "" }));
                  }}
                />
              ))}
              {serverError && (
                <p role="alert" className="rounded-lg border border-crimson-500/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-400">
                  {serverError}
                </p>
              )}
              <div className="flex flex-col-reverse items-start justify-between gap-4 pt-2 sm:flex-row sm:items-center">
                <p className="text-xs text-silver-500">Reports are private — only staff can read them. Abuse of the support system is itself a rule break.</p>
                <Button type="submit" variant="crimson" disabled={sending}>
                  {sending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />} {sending ? "Sending…" : "Submit"}
                </Button>
              </div>
            </form>
          )}
        </section>

        {status === "authenticated" && (
          <section aria-labelledby="my-tickets">
            <div className="flex items-end justify-between gap-4">
              <h2 id="my-tickets" className="h-display text-3xl text-snow">Your requests</h2>
              <Link href="/account#tickets" className="text-sm text-royal-400 hover:text-snow">Dashboard →</Link>
            </div>
            <div className="mt-5">
              {tickets === null ? (
                <div className="space-y-2">
                  {[0, 1].map((i) => (
                    <div key={i} className="skeleton h-16 rounded-xl" />
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <EmptyState title="No requests yet" message="Anything you submit appears here with its live status." />
              ) : (
                <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.07]">
                  {tickets.map((t) => (
                    <li key={t.id} className="flex flex-col gap-2 bg-charcoal/70 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-snow">{t.subject}</p>
                        <p className="mt-0.5 text-xs text-silver-500">
                          <span className="font-mono">{t.publicId}</span> · {supportDefinitions.find((d) => d.type === t.type)?.label} · {dateFmt.format(new Date(t.createdAt))}
                        </p>
                      </div>
                      <StatusBadge status={t.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
