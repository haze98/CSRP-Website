"use client";
import { Check, Link2, Search, X } from "lucide-react";
import { Fragment, useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import { allRules, punishmentLevels, ruleCategories, type NumberedRule, type PunishmentLevel } from "@/data/rules";

const norm = (s: string) => s.toLowerCase().normalize("NFKD");

function highlight(text: string, q: string): ReactNode {
  if (!q) return text;
  const i = norm(text).indexOf(norm(q));
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="hl">{text.slice(i, i + q.length)}</mark>
      {highlight(text.slice(i + q.length), q)}
    </>
  );
}

function Level({ level }: { level: PunishmentLevel }) {
  const l = punishmentLevels[level];
  const tone = level >= 4 ? "bg-crimson-500" : level === 3 ? "bg-solar" : level === 2 ? "bg-warn" : "bg-royal-400";
  return (
    <span className="inline-flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-silver-400" title={`Punishment level ${level} of 4: ${l.label}`}>
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={`h-2.5 w-1.5 rounded-[1px] ${n <= level ? tone : "bg-white/10"}`} />
        ))}
      </span>
      <span>
        <span className="sr-only">Punishment level {level} of 4: </span>
        {l.label}
      </span>
    </span>
  );
}

function RuleCard({ rule, q, flash }: { rule: NumberedRule; q: string; flash: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const url = `${window.location.origin}/rules#${rule.anchor}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link", url);
    }
    window.history.replaceState(null, "", `#${rule.anchor}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <article id={rule.anchor} className={`group scroll-mt-32 rounded-xl border bg-charcoal/80 p-5 transition-[border-color,box-shadow] duration-500 sm:p-6 ${flash ? "border-royal-400/60 shadow-[0_0_0_4px_rgba(95,134,255,0.12)]" : "border-white/[0.07] hover:border-white/[0.14]"}`}>
      <header className="flex items-start gap-4">
        <span className="mt-0.5 min-w-[2.6rem] font-display text-lg font-semibold tabular-nums text-crimson-400">{rule.number}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl font-semibold uppercase tracking-wide text-snow">{highlight(rule.title, q)}</h3>
            {rule.term && <span className="rounded-md border border-royal-400/25 bg-royal-500/10 px-2 py-0.5 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-royal-400">{rule.term}</span>}
          </div>
          {rule.level && (
            <div className="mt-1.5">
              <Level level={rule.level} />
            </div>
          )}
        </div>
        <button type="button" onClick={copy} aria-label={`Copy link to rule ${rule.number}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-silver-400 opacity-100 transition-[opacity,color] hover:text-snow sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100">
          {copied ? <Check size={15} className="text-online" /> : <Link2 size={15} />}
        </button>
      </header>
      <p className="mt-3 leading-relaxed text-silver-300 sm:pl-[3.6rem]">{highlight(rule.text, q)}</p>
      {rule.example && (
        <p className="mt-3 rounded-lg border-l-2 border-crimson-500/60 bg-white/[0.025] px-4 py-2.5 text-sm text-silver-400 sm:ml-[3.6rem]">
          <span className="mr-2 font-semibold uppercase tracking-[0.12em] text-[0.66rem] text-silver-500">Example</span>
          {highlight(rule.example, q)}
        </p>
      )}
      <span role="status" className="sr-only">{copied ? "Link copied" : ""}</span>
    </article>
  );
}

const TERMS = allRules.filter((r) => r.term);

export function RulesCenter() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [flash, setFlash] = useState<string | null>(null);
  const q = useDeferredValue(query.trim());

  const visible = useMemo(() => {
    return allRules.filter((r) => (cat === "all" || r.category === cat) && (!q || norm(`${r.number} ${r.title} ${r.term ?? ""} ${r.text} ${r.example ?? ""}`).includes(norm(q))));
  }, [q, cat]);

  // anchor deep links (#rule-3-2): reveal, scroll and flash
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id.startsWith("rule-")) return;
      setQuery("");
      setCat("all");
      setFlash(id);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      setTimeout(() => setFlash(null), 2400);
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);

  const jumpTerm = (anchor: string) => {
    window.history.replaceState(null, "", `#${anchor}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[250px_1fr] lg:gap-14">
      {/* sidebar */}
      <aside className="hidden lg:block">
        <nav aria-label="Rule categories" className="sticky top-28">
          <p className="tag mb-3">Categories</p>
          <ul className="space-y-0.5">
            {[{ slug: "all", title: "All rules", count: allRules.length }, ...ruleCategories.map((c) => ({ slug: c.slug, title: c.title, count: c.rules.length }))].map((c, i) => (
              <li key={c.slug}>
                <button type="button" onClick={() => setCat(c.slug)} aria-pressed={cat === c.slug} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${cat === c.slug ? "bg-white/[0.06] text-snow" : "text-silver-400 hover:text-snow"}`}>
                  <span className="w-5 font-display text-xs font-semibold text-silver-500">{i === 0 ? "—" : String(i).padStart(2, "0")}</span>
                  <span className="flex-1">{c.title}</span>
                  <span className="text-xs tabular-nums text-silver-500">{c.count}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-xl border border-white/[0.07] p-4">
            <p className="tag mb-3">Punishment levels</p>
            <ul className="space-y-2.5">
              {([1, 2, 3, 4] as PunishmentLevel[]).map((l) => (
                <li key={l}>
                  <Level level={l} />
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </aside>

      <div className="min-w-0">
        {/* search + mobile filter */}
        <div className="sticky top-20 z-20 -mx-5 border-b border-white/[0.06] bg-ink/90 px-5 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:mx-0 lg:rounded-xl lg:border lg:px-4">
          <label className="relative block">
            <span className="sr-only">Search rules</span>
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-silver-500" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rules..."
              className="h-12 w-full rounded-lg border border-white/10 bg-void/70 pl-11 pr-11 text-snow placeholder:text-silver-500 outline-none focus:border-royal-400/70 focus:shadow-[0_0_0_3px_rgba(95,134,255,0.16)]"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-silver-400 hover:text-snow">
                <X size={16} />
              </button>
            )}
          </label>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {[{ slug: "all", title: "All" }, ...ruleCategories].map((c) => (
              <button key={c.slug} type="button" onClick={() => setCat(c.slug)} aria-pressed={cat === c.slug} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${cat === c.slug ? "border-crimson-400/60 bg-crimson-500/15 text-snow" : "border-white/10 text-silver-400"}`}>
                {c.title}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-silver-500" aria-live="polite">
            {visible.length} {visible.length === 1 ? "rule" : "rules"}
            {q ? ` matching “${q}”` : ""}
          </p>
        </div>

        {/* terminology */}
        {!q && cat === "all" && (
          <section aria-labelledby="terms-title" className="mt-8 rounded-2xl border border-white/[0.07] bg-[linear-gradient(135deg,rgba(47,91,255,0.06),transparent_50%,rgba(212,22,60,0.06))] p-5 sm:p-6">
            <h2 id="terms-title" className="font-display text-lg font-semibold uppercase tracking-[0.14em] text-snow">
              RP terminology
            </h2>
            <p className="mt-1 text-sm text-silver-400">The terms you&apos;ll hear in tickets and Discord — tap one to jump to its rule.</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {TERMS.map((r) => (
                <li key={r.anchor}>
                  <button type="button" onClick={() => jumpTerm(r.anchor)} className="rounded-lg border border-white/10 bg-void/50 px-3 py-1.5 text-sm text-silver-300 transition-colors hover:border-royal-400/50 hover:text-snow">
                    {r.term}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {visible.length === 0 ? (
          <div className="mt-10 rounded-xl border border-white/[0.07] p-10 text-center">
            <p className="font-display text-xl font-semibold uppercase text-snow">No rules found</p>
            <p className="mt-2 text-sm text-silver-400">Try a different word, or ask staff through the Support Center.</p>
          </div>
        ) : (
          ruleCategories.map((c, ci) => {
            const rules = visible.filter((r) => r.category === c.slug);
            if (!rules.length) return null;
            return (
              <Fragment key={c.slug}>
                <section aria-labelledby={`cat-${c.slug}`} className="mt-12 first-of-type:mt-8">
                  <header className="mb-5 flex items-end gap-4 border-b border-white/[0.06] pb-4">
                    <span className="font-display text-4xl font-bold leading-none text-white/10">{String(ci + 1).padStart(2, "0")}</span>
                    <div>
                      <h2 id={`cat-${c.slug}`} className="h-display text-3xl text-snow sm:text-4xl">
                        {c.title}
                      </h2>
                      <p className="mt-1 text-sm text-silver-500">{c.summary}</p>
                    </div>
                  </header>
                  <div className="space-y-3">
                    {rules.map((r) => (
                      <RuleCard key={r.anchor} rule={r} q={q} flash={flash === r.anchor} />
                    ))}
                  </div>
                </section>
              </Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}
