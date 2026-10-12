import { api, fail, json, readJson } from "@/lib/api";
import { WhitelistService } from "@/services/whitelist.service";

/** POST /api/whitelist/quiz/submit — { attemptId, answers: { [questionId]: optionToken } }. Graded server-side. */
export const POST = api({ auth: true, mutating: true, limit: { key: "wl-submit", max: 10, windowMs: 10 * 60_000 } }, async ({ req, user }) => {
  const body = await readJson(req);
  if (typeof body.attemptId !== "string" || !body.answers || typeof body.answers !== "object") return fail("Invalid request.", 422);
  return json(await WhitelistService.submitQuiz(user!, body.attemptId, body.answers as Record<string, string>));
});
