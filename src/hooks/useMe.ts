"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { ApiResult, UserView } from "@/types";

/**
 * Signed-in user with SERVER-VERIFIED roles and guild membership
 * (from /api/me — the browser never decides roles itself).
 */
let cache: { key: string; data: UserView | null } | null = null;

export function useMe() {
  const { data: session, status } = useSession();
  const key = session?.user?.id ?? "";
  const [me, setMe] = useState<UserView | null>(cache && cache.key === key ? cache.data : null);
  const [loading, setLoading] = useState(status === "loading" || (!!key && !(cache && cache.key === key)));

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !key) {
      setMe(null);
      setLoading(false);
      return;
    }
    if (cache && cache.key === key) {
      setMe(cache.data);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json() as Promise<ApiResult<UserView | null>>)
      .then((j) => {
        if (!alive) return;
        const data = j.ok ? j.data : null;
        cache = { key, data };
        setMe(data);
      })
      .catch(() => alive && setMe(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [status, key]);

  return {
    session,
    status,
    me,
    loading: status === "loading" || loading,
    /** Server-verified website admin (manual allowlist). UI hint only — every admin route re-checks on the server. */
    isAdmin: !!me?.admin,
  };
}

export function clearMeCache() {
  cache = null;
}
