import { api, fail, json, readJson } from "@/lib/api";
import { requireStore } from "@/lib/store";
import { ApplicationService } from "@/services/application.service";
import { WhitelistService } from "@/services/whitelist.service";
import type { ApplicationType } from "@/types";

const TYPES: ApplicationType[] = ["whitelist", "lspd", "ems", "staff", "creator"];

/** POST /api/applications — { type, answers } (Discord login required). */
export const POST = api({ auth: true, mutating: true, limit: { key: "apply", max: 5, windowMs: 10 * 60_000 } }, async ({ req, user }) => {
  const body = await readJson(req);
  const type = body.type as ApplicationType;
  if (!TYPES.includes(type)) return fail("Unknown application type.", 404);
  // Whitelist requires a passed, server-graded quiz attempt — never a client-supplied score.
  const app = type === "whitelist" ? await WhitelistService.submitApplication(user!, { attemptId: body.attemptId, whyJoin: (body.answers as Record<string, unknown> | undefined)?.whyJoin, agree: body.agree }) : await ApplicationService.submit(user!, type, body.answers ?? {});
  return json({ id: app.id, publicId: app.publicId, status: app.status }, { status: 201 });
});

/** GET /api/applications — the signed-in user's applications. */
export const GET = api({ auth: true }, async ({ user }) => {
  const store = await requireStore();
  const apps = await store.listUserApplications(user!.id);
  return json(apps.map(({ id, publicId, type, status, createdAt, updatedAt }) => ({ id, publicId, type, status, createdAt, updatedAt })));
});
