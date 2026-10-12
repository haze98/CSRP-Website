import { NextResponse } from "next/server";
import { recordSnapshot } from "@/services/status.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/snapshot — record a ServerStatistic row for status graphs.
 * Call every ~5 minutes from your scheduler with: Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json(await recordSnapshot());
}
