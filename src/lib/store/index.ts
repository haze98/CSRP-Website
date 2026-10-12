import "server-only";
import { integrations, devStoreAllowed } from "@/lib/env";
import type { Store } from "./types";

/**
 * Returns the active persistence layer:
 *  - PostgreSQL via Prisma when DATABASE_URL is set
 *  - in-memory store in development (mock mode) so flows are testable
 *  - null in production without a database (callers return 503)
 */
export async function getStore(): Promise<Store | null> {
  if (integrations.database) return (await import("./prisma")).prismaStore;
  if (devStoreAllowed) return (await import("./memory")).memoryStore;
  return null;
}

export class StoreUnavailableError extends Error {
  constructor() {
    super("The database is not configured yet. Please try again later.");
  }
}

export async function requireStore(): Promise<Store> {
  const s = await getStore();
  if (!s) throw new StoreUnavailableError();
  return s;
}

export type { Store } from "./types";
