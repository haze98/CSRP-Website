"use client";
import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CsrpLogo } from "@/components/brand/CsrpLogo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { ButtonLink } from "@/components/ui/Button";
import { navLinks, serverConfig } from "@/config/server.config";
import { UserMenu } from "./UserMenu";

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));

/**
 * Floating navigation — no container around the links. Each link has its own
 * animated underline (red → blue), hover glow and a soft magnetic pull; the
 * active page keeps a shared-layout underline + dot. Transparent at the top,
 * dark glass after scrolling, and it slides away on fast downward scrolls
 * (returns on scroll up, near the top, or when focused).
 */
export function Navbar() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const last = useRef({ y: 0, t: 0 });

  useEffect(() => {
    const on = () => {
      const y = window.scrollY;
      const now = performance.now();
      const dy = y - last.current.y;
      const speed = Math.abs(dy) / Math.max(16, now - last.current.t);
      setScrolled(y > 12);
      if (y < 140) setHidden(false);
      else if (dy > 0 && speed > 0.6) setHidden(true); // fast scroll down
      else if (dy < -4) setHidden(false); // any scroll up
      last.current = { y, t: now };
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    html.dataset.modal = "drawer";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => mq.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.body.style.overflow = overflow;
      delete html.dataset.modal;
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  const show = !hidden || open;

  return (
    <m.header
      className="fixed inset-x-0 top-0 z-50"
      animate={{ y: show ? 0 : -96 }}
      transition={{ type: "spring", stiffness: 380, damping: 38 }}
      onFocusCapture={() => setHidden(false)}
    >
      <a href="#main" className="sr-only rounded-md bg-snow px-4 py-2 text-sm font-semibold text-void focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50">
        Skip to content
      </a>
      <div
        className={`border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ${
          scrolled || open ? "border-white/[0.07] bg-[#050608]/80 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl backdrop-saturate-150" : "border-transparent bg-gradient-to-b from-[#050608]/70 to-transparent"
        }`}
      >
        <nav aria-label="Main" className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8">
          <Link href="/" aria-label={`${serverConfig.name} — home`} className="shrink-0 rounded-lg" data-cursor="link">
            <CsrpLogo />
          </Link>

          <ul className="hidden items-center gap-1 lg:flex xl:gap-3">
            {navLinks.map((l) => {
              const active = isActive(path, l.href);
              return (
                <li key={l.href}>
                  <Link href={l.href} aria-current={active ? "page" : undefined} data-magnetic="soft" className={`nav-link group relative block px-3 py-3 font-display text-[0.92rem] font-semibold uppercase tracking-[0.14em] ${active ? "text-snow" : "text-silver-400 hover:text-snow"}`}>
                    <span className="relative inline-block transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-px">{l.label}</span>
                    {/* hover underline grows left → right */}
                    {!active && <span aria-hidden="true" className="absolute inset-x-3 bottom-1.5 h-px origin-left scale-x-0 bg-gradient-to-r from-crimson-500 to-royal-400 transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-x-100" />}
                    {active && (
                      <m.span layoutId="nav-underline" aria-hidden="true" transition={{ type: "spring", stiffness: 420, damping: 34 }} className="absolute inset-x-3 bottom-1.5 h-[2px] rounded-full bg-gradient-to-r from-crimson-500 via-snow to-royal-400 shadow-[0_0_12px_rgba(220,20,60,0.55)]">
                        <span className="absolute -top-[5px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-crimson-500 shadow-[0_0_8px_rgba(220,20,60,0.9)]" />
                      </m.span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserMenu />
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="relative grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/[0.03] lg:hidden"
            >
              <span aria-hidden="true" className={`absolute h-[1.5px] w-[18px] bg-snow transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-[5px]"}`} />
              <span aria-hidden="true" className={`absolute h-[1.5px] w-[18px] bg-snow transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
              <span aria-hidden="true" className={`absolute h-[1.5px] w-[18px] bg-snow transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-[5px]"}`} />
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <m.div
            id="mobile-menu"
            key="drawer"
            initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 top-20 overflow-y-auto bg-[#050608]/97 backdrop-blur-xl lg:hidden"
          >
            <div className="container-x flex min-h-full flex-col py-8">
              <p className="tag">[ Navigate ]</p>
              <ul className="mt-4 divide-y divide-white/[0.06] border-y border-white/[0.06]">
                {navLinks.map((l, i) => {
                  const active = isActive(path, l.href);
                  return (
                    <m.li key={l.href} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.04, duration: 0.35 }}>
                      <Link href={l.href} aria-current={active ? "page" : undefined} className="flex items-center gap-4 py-4">
                        <span className={`font-display text-sm font-semibold ${active ? "text-crimson-400" : "text-silver-500"}`}>{String(i + 1).padStart(2, "0")}</span>
                        <span className={`h-display text-4xl ${active ? "text-snow" : "text-silver-300"}`}>{l.label}</span>
                        {active && <span aria-hidden="true" className="ml-auto h-2 w-2 rounded-full bg-crimson-500" />}
                      </Link>
                    </m.li>
                  );
                })}
              </ul>
              <div className="mt-auto pt-8">
                <ButtonLink href={serverConfig.discordInvite} variant="discord" size="lg" className="w-full" magnetic={false}>
                  <BrandIcon name="discord" size={18} /> Join Discord
                </ButtonLink>
                <p className="mt-4 text-center text-xs text-silver-500">{serverConfig.tagline}</p>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.header>
  );
}
