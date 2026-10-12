import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { PushToggle } from "@/components/notifications/PushToggle";
import { CsrpCrest } from "@/components/brand/CsrpLogo";
import { requireAdmin } from "@/lib/guards";
import { getStore } from "@/lib/store";
import { LEVEL_LABEL } from "@/services/admin.service";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · CSRP Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Every /admin route passes through here first: the session's Discord ID is
 * checked server-side against the manual admin allowlist BEFORE any admin
 * data is loaded. Non-admins get HTTP 403 (forbidden.tsx).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, access } = await requireAdmin("/admin");
  const store = await getStore();
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-16 pt-28 sm:px-8 sm:pt-32">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-4">
          <CsrpCrest size={56} className="h-14 w-14" />
          <div>
            <p className="h-display text-3xl text-snow">CSRP Admin Control</p>
            <p className="tag mt-1 !text-crimson-400">Authorized staff only</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-silver-400">
          {store?.kind === "memory" && <span className="rounded-full border border-warn/30 bg-warn/10 px-2.5 py-1 font-semibold uppercase tracking-wider text-warn">In-memory dev store</span>}
          <PushToggle />
          <span className="rounded-full border border-white/10 px-2.5 py-1">
            <span className="text-snow">@{user.username}</span> · {LEVEL_LABEL[access.level]}
          </span>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Suspense fallback={<div className="skeleton h-10 rounded-lg" />}>
            <AdminNav permissions={access.permissions} />
          </Suspense>
        </aside>
        <div className="admin-page min-w-0">{children}</div>
      </div>
    </div>
  );
}
