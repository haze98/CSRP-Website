"use client";
import { m } from "motion/react";
import { Activity, Bug, Code2, FileText, Flag, Gauge, Gavel, KeyRound, LifeBuoy, Mail, ScrollText, Settings, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { AdminPermission } from "@/types";

export const adminLinks: { href: string; label: string; icon: typeof Gauge; perm?: AdminPermission }[] = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin/whitelist", label: "Whitelist", icon: ShieldCheck, perm: "whitelist.view" },
  { href: "/admin/applications", label: "Applications", icon: FileText, perm: "applications.view" },
  { href: "/admin/tickets?type=SUPPORT", label: "Support Tickets", icon: LifeBuoy, perm: "support.view" },
  { href: "/admin/tickets?type=PLAYER_REPORT", label: "Player Reports", icon: Flag, perm: "reports.view" },
  { href: "/admin/tickets?type=BAN_APPEAL", label: "Ban Appeals", icon: Gavel, perm: "reports.view" },
  { href: "/admin/tickets?type=BUG_REPORT", label: "Bug Reports", icon: Bug, perm: "support.view" },
  { href: "/admin/tickets?type=CONTACT", label: "Staff Contact", icon: Mail, perm: "support.view" },
  { href: "/admin/users", label: "Users", icon: Users, perm: "users.view" },
  { href: "/admin/developers", label: "Developer Profiles", icon: Code2, perm: "settings.manage" },
  { href: "/admin/status", label: "Status", icon: Activity },
  { href: "/admin/logs", label: "Discord Logs", icon: ScrollText, perm: "audit.view" },
  { href: "/admin/settings", label: "Website Settings", icon: Settings, perm: "settings.view" },
  { href: "/admin/admins", label: "Admin Access", icon: KeyRound, perm: "admins.manage" },
];

/** Sidebar shows only what this admin's level permits (the server enforces it again on every page/API). */
export function AdminNav({ permissions }: { permissions: AdminPermission[] }) {
  const path = usePathname();
  const sp = useSearchParams();
  const isActive = (href: string) => {
    const [p, q] = href.split("?");
    if (q) return path === p && sp.get("type") === new URLSearchParams(q).get("type");
    return p === "/admin" ? path === "/admin" : path.startsWith(p);
  };
  return (
    <nav aria-label="Admin sections" className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
      {adminLinks
        .filter((l) => !l.perm || permissions.includes(l.perm))
        .map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`relative flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${active ? "text-snow" : "text-silver-400 hover:text-snow"}`}>
              {active && <m.span layoutId="admin-nav" aria-hidden="true" transition={{ type: "spring", stiffness: 500, damping: 40 }} className="absolute inset-0 rounded-lg bg-white/[0.07] ring-1 ring-white/[0.08] before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-crimson-500" />}
              <Icon size={16} aria-hidden="true" className={`relative ${active ? "text-crimson-400" : ""}`} />
              <span className="relative">{label}</span>
            </Link>
          );
        })}
    </nav>
  );
}
