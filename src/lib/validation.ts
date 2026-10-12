import { z } from "zod";
import { allFields, type AppDefinition, type AppField } from "@/config/applications";
import type { SupportDefinition } from "@/config/support";

/** Builds a Zod schema for one configured field (also used client-side for instant feedback). */
export function fieldSchema(f: AppField) {
  if (f.kind === "number") {
    let n = z.coerce.number({ error: "Enter a number." }).int("Enter a whole number.");
    if (f.min !== undefined) n = n.min(f.min, `Must be at least ${f.min}.`);
    if (f.max !== undefined) n = n.max(f.max, `Must be ${f.max} or less.`);
    return f.required ? n : z.union([z.literal(""), n]).optional();
  }
  let s = z.string().trim();
  if (f.kind === "url") {
    const url = s.refine((v) => {
      try {
        return /^https?:$/.test(new URL(v).protocol);
      } catch {
        return false;
      }
    }, "Enter a full link starting with https://");
    return f.required ? url : z.union([z.literal(""), url]).optional();
  }
  if (f.kind === "select" && f.options) {
    const sel = z.enum(f.options as [string, ...string[]], { error: "Choose an option." });
    return f.required ? sel : z.union([z.literal(""), sel]).optional();
  }
  if (f.max) s = s.max(f.max, `Please keep this under ${f.max} characters.`);
  if (f.required) return s.min(Math.max(1, f.min ?? 1), f.min ? `Please write at least ${f.min} characters.` : "This field is required.");
  return s.optional();
}

export function applicationSchema(def: AppDefinition) {
  return z.object(Object.fromEntries(allFields(def).map((f) => [f.key, fieldSchema(f)]))).strict();
}

export const supportSchema = (def: SupportDefinition) =>
  z
    .object({
      subject: z.string().trim().min(4, "Add a short subject (4+ characters).").max(120),
      body: z.string().trim().min(20, "Describe the issue (20+ characters).").max(4000),
      ...Object.fromEntries(def.fields.map((f) => [f.key, fieldSchema(f)])),
    })
    .strict();

/** Flattens Zod issues into { field: message } for the form UI. */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "_");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

/** Validates a single value on the client for live feedback. */
export function validateOne(f: AppField, value: string): string | null {
  const r = fieldSchema(f).safeParse(value);
  return r.success ? null : (r.error.issues[0]?.message ?? "Invalid value.");
}
