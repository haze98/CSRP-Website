"use client";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { ArrowRight, BookOpen, CheckCircle2, Clock, LoaderCircle, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLogin } from "@/components/providers/Providers";
import { Avatar } from "@/components/ui/Avatar";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { serverConfig } from "@/config/server.config";
import type { ApiResult, ApplicationView, PublicQuiz, WhitelistState } from "@/types";

type Passed = { attemptId: string; score: number; total: number };
type MyState = {
  state: WhitelistState;
  application: ApplicationView | null;
  attempts: number;
  retryAt: string | null;
  serverTime: string;
  passed: Passed | null;
  lastFailed: { score: number; total: number } | null;
  open: boolean;
};
type Result = { score: number; total: number; passed: boolean; retryAt: string | null; serverTime: string };
type Step = "loading" | "intro" | "quiz" | "result" | "why" | "review" | "done" | "error";

const { passScore: PASS, questionsPerAttempt: SIZE, whyMin: MIN, whyMax: MAX } = serverConfig.whitelist;
const LETTERS = ["A", "B", "C", "D"];
const EASE = [0.22, 1, 0.36, 1] as const;
const SUBMIT_FAILED = "We couldn't submit your application. Please try again.";
const npt = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

type Called<T> = ApiResult<T> & { status: number };
async function call<T>(url: string, init?: RequestInit): Promise<Called<T>> {
  try {
    const r = await fetch(url, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
    const body = (await r.json().catch(() => null)) as ApiResult<T> | null;
    return body ? { ...body, status: r.status } : { ok: false, error: "Unexpected response from the server.", status: r.status };
  } catch {
    return { ok: false, error: "Network error. Check your connection and try again.", status: 0 };
  }
}

/**
 * Cooldown deadline on a monotonic clock. The server sends retryAt and its
 * own time; we only keep the remaining duration, so changing the browser
 * clock can't change the countdown (the server enforces it regardless).
 */
const deadline = (retryAt: string | null, serverTime: string) => (retryAt ? performance.now() + Math.max(0, +new Date(retryAt) - +new Date(serverTime)) : null);

function useRemaining(until: number | null) {
  const [left, setLeft] = useState(() => (until ? Math.max(0, until - performance.now()) : 0));
  useEffect(() => {
    if (!until) return setLeft(0);
    const tick = () => setLeft(Math.max(0, until - performance.now()));
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [until]);
  return left;
}
const mmss = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/**
 * Whitelist flow: RULE QUIZ → RESULT → WRITTEN ANSWER → REVIEW → SUBMITTED.
 * The browser only ever holds question text and random option tokens; the
 * server picks the questions, grades them, enforces the retry cooldown and
 * accepts the application only for a passed, unused attempt it issued.
 */
export function WhitelistFlow({ open, onClose, onSubmitted }: { open: boolean; onClose: () => void; onSubmitted: () => void }) {
  const { data: session, status } = useSession();
  const { login } = useLogin();
  const [step, setStep] = useState<Step>("loading");
  const [me, setMe] = useState<MyState | null>(null);
  const [quiz, setQuiz] = useState<PublicQuiz | null>(null);
  const [qi, setQi] = useState(0);
  const [dir, setDir] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [why, setWhy] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passed, setPassed] = useState<Passed | null>(null);
  const [until, setUntil] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<{ publicId: string } | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const submitting = useRef(false);

  const refresh = useCallback(async () => {
    setStep("loading");
    setError(null);
    const j = await call<MyState>("/api/whitelist");
    if (!j.ok) {
      setError(j.error);
      return setStep("error");
    }
    setMe(j.data);
    setUntil(deadline(j.data.retryAt, j.data.serverTime));
    if (j.data.passed) {
      // server-side record of a passed, unused attempt → resume the written step
      setPassed(j.data.passed);
      setStep("why");
    } else if (j.data.lastFailed && j.data.retryAt) {
      setResult({ ...j.data.lastFailed, passed: false, retryAt: j.data.retryAt, serverTime: j.data.serverTime });
      setStep("result");
    } else setStep("intro");
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuiz(null);
    setQi(0);
    setAnswers({});
    setResult(null);
    setAgree(false);
    setSubmitted(null);
    setConfirmClose(false);
    setPassed(null);
    if (status === "authenticated") refresh();
  }, [open, status, refresh]);

  const start = async () => {
    setBusy(true);
    setError(null);
    const j = await call<PublicQuiz>("/api/whitelist/quiz", { method: "POST", body: "{}" });
    setBusy(false);
    if (!j.ok) {
      if (j.status === 429 || j.status === 409) return refresh(); // cooldown / state changed — show the server's view
      return setError(j.error);
    }
    setQuiz(j.data);
    setQi(0);
    setDir(1);
    setAnswers({});
    setResult(null);
    setStep("quiz");
  };

  const go = (to: number) => {
    setDir(to > qi ? 1 : -1);
    setQi(to);
  };

  const finish = async () => {
    if (!quiz) return;
    setBusy(true);
    setError(null);
    const j = await call<Result>("/api/whitelist/quiz/submit", { method: "POST", body: JSON.stringify({ attemptId: quiz.attemptId, answers }) });
    setBusy(false);
    if (!j.ok) return setError(j.error);
    setResult(j.data);
    setUntil(deadline(j.data.retryAt, j.data.serverTime));
    if (j.data.passed) setPassed({ attemptId: quiz.attemptId, score: j.data.score, total: j.data.total });
    setStep("result");
  };

  const whyLen = why.trim().length;
  const pendingApp = me?.state === "PENDING_REVIEW";
  const canSubmit = !!passed && whyLen >= MIN && why.length <= MAX && agree && status === "authenticated" && !pendingApp && !busy;

  const submit = async () => {
    if (submitting.current) return; // double-click guard (state updates are async)
    if (!passed) {
      setError("Your assessment result couldn't be found. Please reopen the application.");
      return;
    }
    if (!canSubmit) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    const j = await call<{ publicId: string }>("/api/applications", { method: "POST", body: JSON.stringify({ type: "whitelist", attemptId: passed.attemptId, agree, answers: { whyJoin: why } }) });
    setBusy(false);
    submitting.current = false;
    if (!j.ok) {
      if (j.status === 401) return setError("Your session expired. Please log in with Discord again.");
      // 4xx messages are written for players; anything else gets the generic message
      return setError(j.status >= 400 && j.status < 500 && j.status !== 404 ? j.error : SUBMIT_FAILED);
    }
    setSubmitted({ publicId: j.data.publicId });
    setStep("done");
    onSubmitted();
  };

  const midway = (step === "quiz" && Object.keys(answers).length > 0) || ((step === "why" || step === "review") && why.trim().length > 0);
  const requestClose = () => (busy ? undefined : midway && !confirmClose ? setConfirmClose(true) : onClose());

  const q = quiz?.questions[qi];
  const user = session?.user;

  return (
    <Modal open={open} onRequestClose={requestClose} title="Whitelist assessment" subtitle={`${SIZE} questions • ${PASS} required to pass`} size="lg">
      {status === "loading" ? (
        <Center><LoaderCircle className="animate-spin text-royal-400" aria-label="Loading" /></Center>
      ) : !user ? (
        <div className="flex flex-col items-center py-8 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#5865F2]/15 text-[#8b95ff]"><BrandIcon name="discord" size={26} /></span>
          <h3 className="h-display mt-5 text-3xl text-snow">Log in with Discord to start</h3>
          <p className="mt-3 max-w-sm text-sm text-silver-400">Your whitelist is linked to your Discord account, so staff can review it and grant your whitelist role.</p>
          <Button variant="discord" className="mt-7" onClick={() => login("/applications?apply=whitelist")}>
            <BrandIcon name="discord" size={16} /> Login with Discord
          </Button>
        </div>
      ) : confirmClose ? (
        <div className="py-8 text-center">
          <h3 className="h-display text-3xl text-snow">Leave the assessment?</h3>
          <p className="mx-auto mt-3 max-w-sm text-sm text-silver-400">{step === "quiz" ? "Your answers won't be saved. You'll get a new set of questions next time." : "Your written answer won't be saved. Your passed assessment stays valid for 24 hours."}</p>
          <div className="mt-7 flex justify-center gap-3">
            <Button variant="outline" onClick={() => setConfirmClose(false)} data-autofocus="">Keep going</Button>
            <Button variant="crimson" onClick={onClose}>Leave</Button>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.26, ease: EASE }}>
            {step === "loading" && <Center><LoaderCircle className="animate-spin text-royal-400" aria-label="Loading" /></Center>}

            {step === "error" && (
              <div className="py-8 text-center">
                <p className="text-sm text-crimson-400">{error}</p>
                <Button variant="outline" className="mt-5" onClick={refresh}>Try again</Button>
              </div>
            )}

            {step === "intro" && me && <Intro me={me} busy={busy} error={error} onStart={start} />}

            {step === "quiz" && quiz && q && (
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-snow">
                    Question <span className="tabular-nums">{qi + 1}</span> / {quiz.questions.length}
                  </span>
                  <span className="text-silver-500">{Object.keys(answers).length} answered</span>
                </div>
                <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                  <m.div className="h-full rounded-full bg-gradient-to-r from-royal-400 to-crimson-500" initial={false} animate={{ width: `${(Object.keys(answers).length / quiz.questions.length) * 100}%` }} transition={{ duration: 0.5, ease: EASE }} />
                </div>
                {/* question-to-question: old slides out left, new slides in from the right (reversed when going back) */}
                <div className="relative overflow-hidden">
                  <AnimatePresence mode="wait" initial={false} custom={dir}>
                    <m.div
                      key={q.id}
                      custom={dir}
                      variants={{ enter: (d: number) => ({ opacity: 0, x: 36 * d }), center: { opacity: 1, x: 0 }, exit: (d: number) => ({ opacity: 0, x: -36 * d }) }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.28, ease: EASE }}
                    >
                      <h3 className="mt-7 text-xl font-semibold leading-snug text-snow sm:text-2xl">{q.text}</h3>
                      <div role="radiogroup" aria-label={q.text} className="mt-6 grid gap-3">
                        {q.options.map((o, i) => {
                          const selected = answers[q.id] === o.id;
                          return (
                            <m.button
                              key={o.id}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              data-glow=""
                              onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0, scale: selected ? 1.012 : 1 }}
                              whileTap={{ scale: 0.985 }}
                              transition={{ duration: 0.25, delay: 0.04 * i, ease: EASE }}
                              className={`quiz-option group flex items-start gap-4 rounded-xl border p-4 text-left transition-[border-color,background-color,box-shadow] duration-200 ${selected ? "border-crimson-400/70 bg-[linear-gradient(110deg,rgba(220,20,60,0.12),rgba(95,134,255,0.08))] shadow-[0_0_0_1px_rgba(95,134,255,0.25),0_10px_40px_-14px_rgba(220,20,60,0.55)]" : "border-white/[0.09] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"}`}
                            >
                              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-display text-sm font-bold transition-colors ${selected ? "bg-crimson-500 text-white" : "border border-white/15 text-silver-300"}`}>{LETTERS[i]}</span>
                              <span className="pt-1 text-[0.95rem] leading-relaxed text-snow/90">{o.text}</span>
                            </m.button>
                          );
                        })}
                      </div>
                    </m.div>
                  </AnimatePresence>
                </div>
                {error && <ErrorBox>{error}</ErrorBox>}
                <div className="mt-7 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-5">
                  <Button variant="ghost" className="!px-2" disabled={qi === 0 || busy} onClick={() => go(qi - 1)}>Back</Button>
                  {qi < quiz.questions.length - 1 ? (
                    <Button variant="royal" disabled={!answers[q.id]} onClick={() => go(qi + 1)}>
                      Next question <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  ) : (
                    <Button variant="crimson" disabled={!answers[q.id] || busy || Object.keys(answers).length < quiz.questions.length} onClick={finish}>
                      {busy ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Finish assessment
                    </Button>
                  )}
                </div>
              </div>
            )}

            {step === "result" && result && (result.passed ? (
              <ResultShell tone="pass">
                <m.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="grid h-16 w-16 place-items-center rounded-full bg-online/15 text-online shadow-[0_0_40px_-6px_rgba(47,214,138,0.6)]">
                  <ShieldCheck size={32} />
                </m.span>
                <p className="tag mt-6 !text-online">Assessment passed</p>
                <Score score={result.score} total={result.total} />
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-silver-300">You&apos;ve shown you understand CSRP&apos;s core roleplay expectations. One written question left.</p>
                <Button variant="crimson" className="mt-8" onClick={() => setStep("why")}>Continue application <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></Button>
              </ResultShell>
            ) : (
              <Failed result={result} until={until} busy={busy} error={error} onRetry={start} />
            ))}

            {step === "why" && (
              <div>
                <p className="tag">Step 3 of 4 · Written answer</p>
                <label htmlFor="wl-why" className="h-display mt-2 block text-3xl text-snow sm:text-4xl">Why do you want to join CSRP?</label>
                <p className="mt-3 text-sm leading-relaxed text-silver-400">Tell us what you&apos;re looking for in CSRP, the type of character or stories you want to create, and what you can bring to the community.</p>
                <textarea
                  id="wl-why"
                  data-autofocus=""
                  value={why}
                  maxLength={MAX}
                  onChange={(e) => setWhy(e.target.value.slice(0, MAX))}
                  rows={8}
                  className="mt-5 w-full resize-y rounded-xl border border-white/10 bg-void/70 px-4 py-3 text-[0.97rem] leading-relaxed text-snow outline-none transition-[border-color,box-shadow] focus:border-royal-400/70 focus:shadow-[0_0_0_3px_rgba(95,134,255,0.16)]"
                  placeholder="I'm looking for…"
                  aria-describedby="wl-why-count"
                />
                <div id="wl-why-count" className="mt-2 flex items-center justify-between gap-3 text-xs">
                  <span className={whyLen >= MIN ? "text-online" : "text-silver-500"}>{whyLen >= MIN ? "Looks good" : `Minimum ${MIN} characters (${MIN - whyLen} to go)`}</span>
                  <span className="tabular-nums text-silver-500">{why.length} / {MAX}</span>
                </div>
                <div className="mt-2 h-[2px] overflow-hidden rounded-full bg-white/[0.05]">
                  <m.div className={`h-full rounded-full ${whyLen >= MIN ? "bg-online/70" : "bg-royal-400/70"}`} initial={false} animate={{ width: `${Math.min(100, (whyLen / MIN) * 100)}%` }} transition={{ duration: 0.3, ease: EASE }} />
                </div>
                <Agreement agree={agree} setAgree={setAgree} />
                <div className="mt-7 flex justify-end border-t border-white/[0.06] pt-5">
                  <Button variant="royal" disabled={whyLen < MIN || !agree} onClick={() => setStep("review")}>Review application <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></Button>
                </div>
              </div>
            )}

            {step === "review" && user && (
              <div>
                <p className="tag">Step 4 of 4 · Review</p>
                <h3 className="h-display mt-2 text-3xl text-snow">Whitelist application</h3>
                <dl className="mt-5 divide-y divide-white/[0.06] rounded-xl border border-white/[0.08]">
                  <Row k="Discord user"><span className="flex items-center gap-2"><Avatar name={user.displayName || user.username} src={user.avatarUrl} size={24} className="!rounded-md" /> @{user.username}</span></Row>
                  <Row k="Quiz score">{passed ? `${passed.score} / ${passed.total}` : "Passed"}</Row>
                  <Row k="Quiz passed"><span className="inline-flex items-center gap-1.5 font-semibold text-online"><CheckCircle2 size={14} /> Yes</span></Row>
                  <div className="px-4 py-3">
                    <dt className="text-xs uppercase tracking-wider text-silver-500">Why do you want to join CSRP?</dt>
                    <dd className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-snow">{why}</dd>
                  </div>
                  <Row k="Submission date">{npt(new Date().toISOString())}</Row>
                </dl>
                <Agreement agree={agree} setAgree={setAgree} />
                {pendingApp && <ErrorBox>You already have a whitelist application waiting for review.</ErrorBox>}
                {error && <ErrorBox>{error}</ErrorBox>}
                <div className="mt-7 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center">
                  <Button variant="ghost" className="!px-2" disabled={busy} onClick={() => setStep("why")}>Edit answer</Button>
                  <Button type="button" variant="crimson" disabled={!canSubmit} aria-busy={busy} onClick={submit}>
                    {busy ? (
                      <><LoaderCircle size={16} className="animate-spin" /> Submitting…</>
                    ) : (
                      <><ShieldCheck size={16} /> Submit whitelist application</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {step === "done" && submitted && (
              <ResultShell tone="info">
                <m.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="grid h-16 w-16 place-items-center rounded-full bg-royal-500/15 text-royal-400 shadow-[0_0_40px_-8px_rgba(95,134,255,0.65)]">
                  <Clock size={30} />
                </m.span>
                <p className="tag mt-6">Whitelist · Pending review</p>
                <h3 className="h-display mt-2 text-4xl text-snow">Application submitted</h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-silver-300">Your whitelist application is now waiting for staff review.</p>
                <p className="mt-5 text-[0.65rem] uppercase tracking-[0.2em] text-silver-500">Application ID</p>
                <m.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4, ease: EASE }} className="mt-1.5 rounded-lg border border-white/10 bg-void/60 px-4 py-2 font-mono text-base tracking-wider text-snow">
                  {submitted.publicId}
                </m.p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href="/account#whitelist" variant="crimson" magnetic={false}>View application <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></ButtonLink>
                  <Button variant="outline" onClick={onClose}>Close</Button>
                </div>
              </ResultShell>
            )}
          </m.div>
        </AnimatePresence>
      )}
    </Modal>
  );
}

const Center = ({ children }: { children: React.ReactNode }) => <div className="flex justify-center py-16">{children}</div>;

const ErrorBox = ({ children }: { children: React.ReactNode }) => (
  <m.p role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-lg border border-crimson-500/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-400">
    {children}
  </m.p>
);

const Row = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4 px-4 py-3">
    <dt className="text-xs uppercase tracking-wider text-silver-500">{k}</dt>
    <dd className="text-sm text-snow">{children}</dd>
  </div>
);

function Agreement({ agree, setAgree }: { agree: boolean; setAgree: (v: boolean) => void }) {
  return (
    <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-3 text-sm text-silver-300 transition-colors hover:border-white/15">
      <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-crimson-500" />
      <span>
        I confirm that I have read and agree to follow the{" "}
        <Link href="/rules" target="_blank" className="text-royal-400 underline-offset-2 hover:underline">CSRP rules</Link>.
      </span>
    </label>
  );
}

/** Result card with a soft success (green/blue) or failure (red) glow behind it. */
function ResultShell({ tone, children }: { tone: "pass" | "fail" | "info"; children: React.ReactNode }) {
  const glow = tone === "pass" ? "rgba(47,214,138,0.16),rgba(95,134,255,0.10)" : tone === "fail" ? "rgba(220,20,60,0.20),rgba(220,20,60,0.04)" : "rgba(95,134,255,0.16),rgba(95,134,255,0.04)";
  return (
    <div className="relative flex flex-col items-center py-4 text-center">
      <m.div aria-hidden="true" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: EASE }} className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-72 -translate-x-1/2 rounded-full blur-2xl" style={{ background: `radial-gradient(closest-side,${glow},transparent)` }} />
      {children}
    </div>
  );
}

function Score({ score, total }: { score: number; total: number }) {
  return (
    <p className="h-display mt-2 text-6xl text-snow">
      <CountUp value={score} /> <span className="text-silver-500">/ {total}</span>
    </p>
  );
}

function Failed({ result, until, busy, error, onRetry }: { result: Result; until: number | null; busy: boolean; error: string | null; onRetry: () => void }) {
  const left = useRemaining(until);
  const reduced = useReducedMotion();
  const waiting = left > 0;
  return (
    <ResultShell tone="fail">
      <m.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="grid h-16 w-16 place-items-center rounded-full bg-crimson-500/15 text-crimson-400 shadow-[0_0_40px_-8px_rgba(220,20,60,0.6)]">
        <XCircle size={32} />
      </m.span>
      <p className="tag mt-6 !text-crimson-400">Assessment not passed</p>
      <Score score={result.score} total={result.total} />
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-silver-300">You need at least {PASS} correct answers. Review the rules — your next attempt uses a new set of questions.</p>
      <AnimatePresence mode="wait" initial={false}>
        {waiting ? (
          <m.div key="wait" exit={{ opacity: 0, y: -6 }} className="mt-6 rounded-xl border border-white/[0.08] bg-void/50 px-6 py-4">
            <p className="text-[0.65rem] uppercase tracking-[0.22em] text-silver-500">Next attempt available in</p>
            <p className="mt-1 font-display text-4xl font-bold tabular-nums text-snow" aria-live="off">{mmss(left)}</p>
            {!reduced && until && (
              <div className="mt-3 h-[2px] w-48 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-crimson-500/70 transition-[width] duration-300" style={{ width: `${Math.max(0, 100 - (left / (serverConfig.whitelist.retryCooldownMinutes * 60_000)) * 100)}%` }} />
              </div>
            )}
          </m.div>
        ) : (
          <m.p key="ready" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-sm text-online">You can take the assessment again now.</m.p>
        )}
      </AnimatePresence>
      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/rules" variant="outline" magnetic={false} target="_blank"><BookOpen size={16} /> Review CSRP rules</ButtonLink>
        <Button variant="crimson" disabled={waiting || busy} onClick={onRetry} title={waiting ? "Available when the cooldown ends" : undefined}>
          {busy ? <LoaderCircle size={16} className="animate-spin" /> : <RotateCcw size={16} />} Try again
        </Button>
      </div>
    </ResultShell>
  );
}

function Intro({ me, busy, error, onStart }: { me: MyState; busy: boolean; error: string | null; onStart: () => void }) {
  if (me.state === "PENDING_REVIEW" || me.state === "APPROVED" || me.state === "SYNC_ERROR") {
    const a = me.application;
    return (
      <div className="py-6 text-center">
        <p className="tag">Your whitelist</p>
        <div className="mt-3 flex justify-center">{a && <StatusBadge status={a.status} />}</div>
        <h3 className="h-display mt-4 text-4xl text-snow">{me.state === "PENDING_REVIEW" ? "Pending review" : "Whitelist approved"}</h3>
        {a?.quiz && <p className="mt-2 text-sm text-silver-400">Quiz: passed • {a.quiz.score}/{a.quiz.total} · {a.publicId}</p>}
        <p className="mx-auto mt-4 max-w-sm text-sm text-silver-300">{me.state === "PENDING_REVIEW" ? "Your application is waiting for staff review." : "Welcome to Chandra Surya Roleplay."}</p>
        <ButtonLink href="/account#whitelist" variant="outline" className="mt-6" magnetic={false}>View application</ButtonLink>
      </div>
    );
  }
  if (!me.open) return <p className="py-10 text-center text-sm text-silver-400">Whitelist applications are currently closed. Watch Discord for the next wave.</p>;
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { k: "Questions", v: String(SIZE), d: "Random from our rule pool" },
          { k: "To pass", v: `${PASS} / ${SIZE}`, d: "Results shown at the end" },
          { k: "Then", v: "1 question", d: "Why you want to join" },
        ].map((x, i) => (
          <m.div key={x.k} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i, duration: 0.35, ease: EASE }} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="tag !text-[0.6rem]">{x.k}</p>
            <p className="mt-1 font-display text-2xl font-bold text-snow">{x.v}</p>
            <p className="text-xs text-silver-500">{x.d}</p>
          </m.div>
        ))}
      </div>
      <ul className="mt-6 space-y-2 text-sm text-silver-300">
        <li className="flex gap-2"><span className="text-crimson-400">—</span> Questions cover RDM, VDM, metagaming, powergaming, FearRP, NLR and combat logging.</li>
        <li className="flex gap-2"><span className="text-crimson-400">—</span> You won&apos;t see which answers were right — read each question carefully.</li>
        <li className="flex gap-2"><span className="text-crimson-400">—</span> Fail and you&apos;ll wait {serverConfig.whitelist.retryCooldownMinutes} minutes before your next attempt.</li>
        <li className="flex gap-2"><span className="text-crimson-400">—</span> Passing doesn&apos;t whitelist you automatically: staff review every application.</li>
      </ul>
      {me.state === "REJECTED" && me.application && <p className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-silver-300">Your previous application ({me.application.publicId}) wasn&apos;t approved. You can apply again.</p>}
      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="mt-7 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-5">
        <Link href="/rules" target="_blank" className="text-sm text-royal-400 hover:text-snow">Read the rulebook first →</Link>
        <Button variant="crimson" onClick={onStart} disabled={busy}>
          {busy ? <LoaderCircle size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Start assessment
        </Button>
      </div>
    </div>
  );
}
