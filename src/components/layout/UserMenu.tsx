"use client";
import { AnimatePresence, m } from "motion/react";
import { ChevronDown, FileText, LifeBuoy, LogOut, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useLogin } from "@/components/providers/Providers";
import { Avatar } from "@/components/ui/Avatar";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { btn } from "@/components/ui/Button";
import { clearMeCache, useMe } from "@/hooks/useMe";

/** LOGIN WITH DISCORD, or the Discord avatar + name with a profile dropdown. */
export function UserMenu() {
  const { session, status, isAdmin } = useMe();
  const { login } = useLogin();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        root.current?.querySelector<HTMLElement>("[data-trigger]")?.focus();
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const items = [...(root.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
        if (!items.length) return;
        e.preventDefault();
        const i = items.indexOf(document.activeElement as HTMLElement);
        items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Signed out OR still checking: always show a real, working login link
  // (falls back to /login without JavaScript) — never an empty placeholder.
  if (!session?.user) {
    return (
      <a
        href="/login"
        onClick={(e) => {
          e.preventDefault();
          login();
        }}
        aria-busy={status === "loading" || undefined}
        className={btn("royal", "sm", "!h-11 !px-5 !tracking-[0.12em] hover:-translate-y-px")}
        data-magnetic=""
      >
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.25)_50%,transparent_70%)] transition-transform duration-700 group-hover:translate-x-full" />
        <span className="relative inline-flex items-center gap-2">
          <BrandIcon name="discord" size={18} />
          <span className="hidden sm:inline">Login with Discord</span>
          <span className="sm:hidden">Login</span>
        </span>
      </a>
    );
  }

  const u = session.user;
  const name = u.displayName || u.username;
  const items = [
    { href: "/account", label: "Profile", icon: User },
    { href: "/account#applications", label: "My Applications", icon: FileText },
    { href: "/support", label: "Support", icon: LifeBuoy },
    ...(isAdmin ? [{ href: "/admin", label: "Admin Panel", icon: ShieldCheck }] : []),
  ];

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        data-trigger=""
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${name}`}
        className="flex h-10 items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] pl-1 pr-2.5 transition-colors hover:border-white/25"
      >
        <Avatar name={name} src={u.avatarUrl} size={32} className="!rounded-md" />
        <span className="hidden max-w-[120px] truncate text-sm font-medium text-snow sm:block">{name}</span>
        <ChevronDown size={15} className={`text-silver-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <m.div
            role="menu"
            aria-label="Account"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="glass absolute right-0 top-[calc(100%+10px)] w-64 origin-top-right overflow-hidden rounded-xl !bg-charcoal/95 p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]"
          >
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-3 pb-3 pt-2">
              <Avatar name={name} src={u.avatarUrl} size={38} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-snow">{name}</p>
                <p className="truncate text-xs text-silver-500">@{u.username}</p>
              </div>
            </div>
            <div className="py-1">
              {items.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-silver-300 outline-none transition-colors hover:bg-white/[0.05] hover:text-snow focus-visible:bg-white/[0.06] focus-visible:text-snow">
                  <Icon size={16} aria-hidden="true" className="text-silver-500" /> {label}
                </Link>
              ))}
            </div>
            <div className="border-t border-white/[0.06] pt-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  clearMeCache();
                  signOut({ redirectTo: "/" });
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-crimson-400 outline-none transition-colors hover:bg-crimson-500/10 focus-visible:bg-crimson-500/10"
              >
                <LogOut size={16} aria-hidden="true" /> Logout
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
