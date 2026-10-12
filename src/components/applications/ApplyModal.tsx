"use client";
import { AnimatePresence, m } from "motion/react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, LoaderCircle, Pencil } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLogin } from "@/components/providers/Providers";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import type { AppDefinition } from "@/config/applications";
import { validateOne } from "@/lib/validation";
import type { ApiResult } from "@/types";
import { useSession } from "next-auth/react";

type Answers = Record<string, string>;
const draftKey = (t: string) => `csrp-draft-${t}`;

/**
 * Step-by-step application: configured steps → Review & Submit. Validates
 * each step before moving on (same rules as the server), keeps a local
 * draft, asks before discarding, and maps server field errors back to the
 * right step. Requires Discord login (the account is attached server-side).
 */
export function ApplyModal({ def, open, onClose, onSubmitted }: { def: AppDefinition | null; open: boolean; onClose: () => void; onSubmitted: (publicId: string) => void }) {
  const { data: session, status } = useSession();
  const { login } = useLogin();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const body = useRef<HTMLDivElement>(null);

  const steps = useMemo(() => (def ? [...def.steps, { title: "Review & submit", fields: [] }] : []), [def]);
  const isReview = step === steps.length - 1;
  const dirty = Object.values(answers).some((v) => v.trim());

  // reset + restore draft when a different application opens
  useEffect(() => {
    if (!open || !def) return;
    setStep(0);
    setErrors({});
    setServerError(null);
    setDone(null);
    setConfirmClose(false);
    try {
      const raw = localStorage.getItem(draftKey(def.type));
      setAnswers(raw ? JSON.parse(raw) : {});
    } catch {
      setAnswers({});
    }
  }, [open, def]);

  // persist draft (per-browser convenience only)
  useEffect(() => {
    if (!def || done) return;
    try {
      if (dirty) localStorage.setItem(draftKey(def.type), JSON.stringify(answers));
    } catch {}
  }, [answers, def, dirty, done]);

  useEffect(() => {
    body.current?.closest(".overflow-y-auto")?.scrollTo({ top: 0 });
  }, [step]);

  if (!def) return null;

  const requestClose = () => {
    if (dirty && !done && !confirmClose) return setConfirmClose(true);
    onClose();
  };

  const validateStep = (i: number) => {
    const errs: Record<string, string> = {};
    for (const f of steps[i].fields) {
      const e = validateOne(f, answers[f.key] ?? "");
      if (e) errs[f.key] = e;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) {
      setTimeout(() => body.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus(), 30);
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const submit = async () => {
    for (let i = 0; i < steps.length - 1; i++) {
      if (!validateStep(i)) return setStep(i);
    }
    setSubmitting(true);
    setServerError(null);
    try {
      const r = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: def.type, answers }) });
      const j = (await r.json()) as ApiResult<{ publicId: string }>;
      if (!j.ok) {
        setServerError(j.error);
        if (j.fieldErrors) {
          setErrors(j.fieldErrors);
          const bad = steps.findIndex((s) => s.fields.some((f) => j.fieldErrors?.[f.key]));
          if (bad >= 0) setStep(bad);
        }
        return;
      }
      try {
        localStorage.removeItem(draftKey(def.type));
      } catch {}
      setDone(j.data.publicId);
      onSubmitted(j.data.publicId);
    } catch {
      setServerError("Network error — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const user = session?.user;

  return (
    <Modal open={open} onRequestClose={requestClose} title={def.label} subtitle={`${def.department} · ${def.short}`} size="lg">
      <div ref={body}>
        {status === "loading" ? (
          <div className="flex justify-center py-16">
            <LoaderCircle className="animate-spin text-royal-400" aria-label="Loading" />
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-royal-500/15 text-royal-400">
              <BrandIcon name="discord" size={26} />
            </span>
            <h3 className="h-display mt-5 text-3xl text-snow">Log in with Discord to apply</h3>
            <p className="mt-3 max-w-sm text-sm text-silver-400">Your application is linked to your Discord account so staff can contact you and you can follow its status from your dashboard. We only request your basic profile (identify scope).</p>
            <Button variant="royal" className="mt-7" onClick={() => login(`/applications?apply=${def.type}`)}>
              <BrandIcon name="discord" size={16} /> Login with Discord
            </Button>
          </div>
        ) : done ? (
          <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-6 text-center">
            <m.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="grid h-16 w-16 place-items-center rounded-full bg-online/15 text-online">
              <CheckCircle2 size={32} />
            </m.span>
            <h3 className="h-display mt-5 text-3xl text-snow">Application submitted</h3>
            <p className="mt-2 text-sm text-silver-400">Your reference number</p>
            <p className="mt-1 rounded-lg border border-white/10 bg-void/60 px-4 py-2 font-mono text-lg tracking-wider text-snow">{done}</p>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-silver-300">{def.nextSteps}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/account#applications" variant="crimson" magnetic={false}>
                Track in dashboard
              </ButtonLink>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </m.div>
        ) : confirmClose ? (
          <div className="py-8 text-center">
            <h3 className="h-display text-3xl text-snow">Leave this application?</h3>
            <p className="mx-auto mt-3 max-w-sm text-sm text-silver-400">Your answers are saved as a draft on this device, so you can pick up where you left off.</p>
            <div className="mt-7 flex justify-center gap-3">
              <Button variant="outline" onClick={() => setConfirmClose(false)} data-autofocus="">
                Keep editing
              </Button>
              <Button variant="crimson" onClick={onClose}>
                Leave
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* applicant (from Discord, not editable) */}
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-void/40 px-3 py-2.5">
              <Avatar name={user.displayName || user.username} src={user.avatarUrl} size={34} className="!rounded-lg" />
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium text-snow">{user.displayName || user.username}</p>
                <p className="truncate text-xs text-silver-500">Discord @{user.username} · ID {user.discordId}</p>
              </div>
              <span className="ml-auto text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-online">Linked</span>
            </div>

            {/* progress */}
            <ol className="mb-6 flex gap-1.5" aria-label="Progress">
              {steps.map((s, i) => (
                <li key={s.title} className="flex-1" aria-current={i === step ? "step" : undefined}>
                  <span className={`block h-1 rounded-full transition-colors duration-300 ${i < step ? "bg-online/70" : i === step ? "bg-gradient-to-r from-royal-400 to-crimson-400" : "bg-white/10"}`} />
                  <span className={`mt-2 hidden text-[0.62rem] font-semibold uppercase tracking-[0.14em] sm:block ${i === step ? "text-snow" : "text-silver-500"}`}>
                    {String(i + 1).padStart(2, "0")} {s.title}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mb-5 text-xs text-silver-500 sm:hidden">
              Step {step + 1} of {steps.length} — <span className="text-snow">{steps[step].title}</span>
            </p>

            <AnimatePresence mode="wait" initial={false}>
              <m.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                {isReview ? (
                  <div className="space-y-6">
                    {def.steps.map((s, i) => (
                      <section key={s.title} className="rounded-xl border border-white/[0.07]">
                        <header className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
                          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-snow">{s.title}</h3>
                          <button type="button" onClick={() => setStep(i)} className="inline-flex items-center gap-1 text-xs text-royal-400 hover:text-snow">
                            <Pencil size={12} aria-hidden="true" /> Edit
                          </button>
                        </header>
                        <dl className="divide-y divide-white/[0.05]">
                          {s.fields.map((f) => (
                            <div key={f.key} className="px-4 py-3">
                              <dt className="text-xs text-silver-500">{f.label}</dt>
                              <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-snow">{answers[f.key]?.trim() || <span className="text-silver-500">—</span>}</dd>
                            </div>
                          ))}
                        </dl>
                      </section>
                    ))}
                    <p className="text-xs leading-relaxed text-silver-500">By submitting you confirm the answers are your own and that you have read the CSRP rulebook. Plagiarised or AI-generated answers are rejected.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {steps[step].fields.map((f, i) => (
                      <FormField
                        key={f.key}
                        field={f}
                        value={answers[f.key] ?? ""}
                        error={errors[f.key]}
                        autoFocus={i === 0}
                        onChange={(v) => {
                          setAnswers((a) => ({ ...a, [f.key]: v }));
                          if (errors[f.key]) setErrors((e) => ({ ...e, [f.key]: validateOne(f, v) ?? "" }));
                        }}
                        onBlur={() => {
                          const v = answers[f.key] ?? "";
                          if (v) setErrors((e) => ({ ...e, [f.key]: validateOne(f, v) ?? "" }));
                        }}
                      />
                    ))}
                  </div>
                )}
              </m.div>
            </AnimatePresence>

            {serverError && (
              <p role="alert" className="mt-5 rounded-lg border border-crimson-500/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-400">
                {serverError}
              </p>
            )}

            <div className="sticky bottom-0 -mx-5 -mb-5 mt-7 flex items-center justify-between gap-3 border-t border-white/[0.06] bg-charcoal px-5 pb-5 pt-4 sm:-mx-6 sm:px-6">
              <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || submitting} className="!px-2">
                <ArrowLeft size={16} /> Back
              </Button>
              {isReview ? (
                <Button variant="crimson" onClick={submit} disabled={submitting}>
                  {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />} {submitting ? "Submitting…" : "Submit application"}
                </Button>
              ) : (
                <Button variant="royal" onClick={next}>
                  Continue <ArrowRight size={16} />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
      {!user && status !== "loading" && (
        <p className="mt-2 text-center text-xs text-silver-500">
          New here? Read the <Link href="/rules" className="text-royal-400 hover:text-snow">rulebook</Link> first.
        </p>
      )}
    </Modal>
  );
}
