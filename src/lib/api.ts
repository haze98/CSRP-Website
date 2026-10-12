import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { assertSameOrigin, clientIp, hashIp, rateLimit } from "@/lib/security";
import { StoreUnavailableError } from "@/lib/store";
import { ServiceError } from "@/services/application.service";
import { LoggingService } from "@/services/logging.service";
import { AdminService } from "@/services/admin.service";
import type { AdminAccessView, AdminPermission, SessionUser } from "@/types";

export const json = <T>(data: T, init?: ResponseInit) => NextResponse.json({ ok: true, data }, init);
export const fail = (error: string, status = 400, fieldErrors?: Record<string, string>) => NextResponse.json({ ok: false, error, fieldErrors }, { status });

type Opts = {
  /** Require a signed-in user. */
  auth?: boolean;
  /** Require website admin access (manual allowlist, verified server-side), optionally a permission. */
  admin?: AdminPermission | true;
  /** Requests per window per user (or IP). */
  limit?: { max: number; windowMs: number; key: string };
  /** State-changing request → enforce same-origin (CSRF). */
  mutating?: boolean;
};

/** Wraps a route handler with CSRF, rate limit, auth, authz and error mapping. */
export function api<Ctx>(opts: Opts, handler: (args: { req: Request; user: SessionUser | null; ctx: Ctx; access: AdminAccessView | null }) => Promise<Response>) {
  return async (req: Request, ctx: Ctx) => {
    try {
      if (opts.mutating && !(await assertSameOrigin())) {
        await LoggingService.log({ category: "SECURITY", action: "CSRF_BLOCKED", ip: hashIp(await clientIp()), metadata: { path: new URL(req.url).pathname } });
        return fail("Invalid request origin.", 403);
      }
      const needsUser = opts.auth || opts.admin;
      const user = needsUser ? await getCurrentUser() : null;
      if (needsUser && !user) return fail("Please log in with Discord first.", 401);
      let access: AdminAccessView | null = null;
      if (opts.admin) {
        // every mutating admin request re-reads the allowlist (no cache)
        access = await requireAdmin(user!, opts.admin === true ? undefined : opts.admin, { fresh: !!opts.mutating, path: new URL(req.url).pathname, method: req.method });
      }
      if (opts.limit) {
        const who = user?.id ?? hashIp(await clientIp());
        const rl = rateLimit(`${opts.limit.key}:${who}`, opts.limit.max, opts.limit.windowMs);
        if (!rl.ok) return fail(`Too many requests. Try again in ${rl.retryAfterSec}s.`, 429);
      }
      return await handler({ req, user, ctx, access });
    } catch (e) {
      if (e instanceof ServiceError) return fail(e.message, e.status, e.fieldErrors);
      if (e instanceof StoreUnavailableError) return fail(e.message, 503);
      console.error("[api]", e);
      return fail("Something went wrong. Please try again.", 500);
    }
  };
}

/* ------------------------------------------------------------------ guards
 * Reusable server-side guards for route handlers and server actions. They
 * throw ServiceError(401 | 403), which api() turns into a JSON response.
 * Authorization only ever comes from the encrypted session (verified
 * Discord ID) + the manual admin allowlist — never from anything the
 * client sends (headers, body, query, localStorage, role names).
 */

/** 401 unless signed in. */
export async function requireAuthenticatedUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new ServiceError("Please log in with Discord first.", 401);
  return user;
}

const DENIED = "You don't have permission to do that.";

/** 403 unless the user is on the admin allowlist (and holds `perm`, if given). Unauthorized attempts are audited. */
export async function requireAdmin(user: SessionUser, perm?: AdminPermission, ctx: { fresh?: boolean; path?: string; method?: string } = {}): Promise<AdminAccessView> {
  const access = await AdminService.getAccess(user.discordId, { fresh: ctx.fresh });
  if (!AdminService.can(access, perm)) {
    await LoggingService.log({ category: "SECURITY", action: "UNAUTHORIZED_ADMIN_ACCESS", actor: user, metadata: { path: ctx.path, method: ctx.method, perm: perm ?? "any" } });
    // same message whether the user is not an admin or lacks one permission: nothing to enumerate
    throw new ServiceError(DENIED, 403);
  }
  return access!;
}

/** For a second, action-specific check inside a handler, e.g. await requirePermission(user, "whitelist.approve"). Always fresh. */
export async function requirePermission(user: SessionUser, perm: AdminPermission) {
  return requireAdmin(user, perm, { fresh: true });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const text = await req.text();
  if (text.length > 64_000) throw new ServiceError("Request too large.", 413);
  try {
    const v = JSON.parse(text || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    throw new ServiceError("Invalid JSON.", 400);
  }
}
