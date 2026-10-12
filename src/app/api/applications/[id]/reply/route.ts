import { api, json, readJson } from "@/lib/api";
import { WhitelistService } from "@/services/whitelist.service";

/** POST /api/applications/:id/reply — applicant answers a staff information request. */
export const POST = api<{ params: Promise<{ id: string }> }>({ auth: true, mutating: true, limit: { key: "app-reply", max: 6, windowMs: 10 * 60_000 } }, async ({ req, user, ctx }) => {
  const { id } = await ctx.params;
  const body = await readJson(req);
  const app = await WhitelistService.applicantReply(user!, id, String(body.message ?? ""));
  return json({ status: app?.status });
});
