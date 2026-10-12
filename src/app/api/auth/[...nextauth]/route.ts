import { NextResponse, type NextRequest } from "next/server";
import { handlers } from "@/auth";
import { clientIp, hashIp, rateLimit } from "@/lib/security";

/**
 * Auth.js routes, with an IP rate limit on sign-in and OAuth callbacks so
 * the login flow can't be hammered. Session reads (/session, /csrf) are not
 * limited — the site polls them.
 */
const LIMITED = /\/api\/auth\/(signin|callback)(\/|$)/;

function limited(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    if (LIMITED.test(req.nextUrl.pathname)) {
      const rl = rateLimit(`auth:${hashIp(await clientIp())}`, 20, 10 * 60_000);
      if (!rl.ok) return NextResponse.json({ ok: false, error: `Too many login attempts. Try again in ${rl.retryAfterSec}s.` }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
    }
    return handler(req);
  };
}

export const GET = limited(handlers.GET);
export const POST = limited(handlers.POST);
