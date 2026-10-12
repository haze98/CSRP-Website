"use client";
import { AnimatePresence, m } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog: portal, focus trap, Escape / backdrop / X call
 * `onRequestClose` (callers guard unsaved changes), scroll lock, and focus
 * returned to the trigger on close.
 */
export function Modal({
  open,
  onRequestClose,
  title,
  subtitle,
  children,
  size = "md",
}: {
  open: boolean;
  onRequestClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onRequestClose);
  closeRef.current = onRequestClose;

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.dataset.modal = "open"; // tells Lenis to stop
    const t = setTimeout(() => (panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE))?.focus(), 40);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (!panel.current.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      delete document.documentElement.dataset.modal;
      prev?.focus?.();
    };
  }, [open]);

  if (typeof document === "undefined") return null;
  const width = size === "xl" ? "max-w-4xl" : size === "lg" ? "max-w-2xl" : "max-w-lg";

  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div key="modal" className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <div aria-hidden="true" className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => closeRef.current()} />
          <m.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={`card relative flex max-h-[100dvh] w-full ${width} flex-col overflow-hidden rounded-b-none bg-charcoal shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] sm:max-h-[min(880px,calc(100dvh-48px))] sm:rounded-b-[14px]`}
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            <div aria-hidden="true" className="h-px bg-gradient-to-r from-royal-500/0 via-royal-400/60 to-crimson-500/60" />
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-6">
              <div>
                <h2 id={titleId} className="h-display text-2xl text-snow">
                  {title}
                </h2>
                {subtitle && <p className="mt-1 text-sm text-silver-400">{subtitle}</p>}
              </div>
              <button type="button" onClick={() => closeRef.current()} aria-label="Close dialog" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 text-silver-300 transition-colors hover:border-white/25 hover:text-snow">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
