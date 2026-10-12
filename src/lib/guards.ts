import "server-only";
import { forbidden, redirect } from "next/navigation";
import { getCurrentUser } from "@/auth";
import { AdminService } from "@/services/admin.service";
import { LoggingService } from "@/services/logging.service";
import type { AdminPermission } from "@/types";

/** Server components: signed-in user or redirect to /login. */
export async function requireAuthenticatedUser(callbackUrl: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}

/**
 * Server components: website admins only (manual Discord-ID allowlist).
 * Runs before any admin data is fetched or rendered. Unauthorized users get
 * a real HTTP 403 (forbidden.tsx), which then sends them back to the site.
 */
export async function requireAdmin(path: string, perm?: AdminPermission) {
  const user = await requireAuthenticatedUser(path);
  const access = await AdminService.getAccess(user.discordId);
  if (!AdminService.can(access, perm)) {
    await LoggingService.log({ category: "SECURITY", action: "UNAUTHORIZED_ADMIN_ACCESS", actor: user, metadata: { path, perm: perm ?? "any" } });
    forbidden();
  }
  return { user, access: access! };
}

/** Server components: a specific admin permission, e.g. await requirePermission("/admin/logs", "audit.view"). */
export const requirePermission = (path: string, perm: AdminPermission) => requireAdmin(path, perm);
