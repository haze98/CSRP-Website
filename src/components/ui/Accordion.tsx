"use client";
import { AnimatePresence, m } from "motion/react";
import { Plus } from "lucide-react";
import { useId, useState } from "react";

/** Accessible accordion with smooth height animation; one item open at a time. */
export function Accordion({ items, defaultOpen = 0 }: { items: { q: string; a: string }[]; defaultOpen?: number }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const base = useId();
  return (
    <ul className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
      {items.map((f, i) => {
        const isOpen = open === i;
        const id = `${base}-${i}`;
        return (
          <li key={f.q}>
            <h3>
              <button
                type="button"
                id={`${id}-b`}
                aria-expanded={isOpen}
                aria-controls={`${id}-p`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full items-center gap-5 py-5 text-left"
              >
                <span className="w-8 shrink-0 font-display text-sm font-semibold text-silver-500 group-aria-expanded:text-crimson-400">{String(i + 1).padStart(2, "0")}</span>
                <span className={`flex-1 font-display text-lg font-semibold uppercase tracking-wide transition-colors sm:text-xl ${isOpen ? "text-snow" : "text-silver-300 group-hover:text-snow"}`}>{f.q}</span>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-all duration-300 ${isOpen ? "rotate-45 border-crimson-500/50 bg-crimson-500/10 text-crimson-400" : "border-white/10 text-silver-400 group-hover:border-white/25"}`}>
                  <Plus size={16} aria-hidden="true" />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <m.div
                  id={`${id}-p`}
                  role="region"
                  aria-labelledby={`${id}-b`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ height: { duration: 0.32, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.22 } }}
                  className="overflow-hidden"
                >
                  <p className="pb-6 pl-[3.25rem] pr-14 text-[0.97rem] leading-relaxed text-silver-300">{f.a}</p>
                </m.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
