"use client";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import { SessionProvider, signIn } from "next-auth/react";
import { createContext, useCallback, useContext, type ReactNode } from "react";

export type LoginProvider = "discord" | "dev" | null;

const AuthCtx = createContext<{ provider: LoginProvider; login: (callbackUrl?: string) => void }>({ provider: null, login: () => {} });

/** Login helper: Discord OAuth, or the dev login when Discord isn't configured (development only). */
export const useLogin = () => useContext(AuthCtx);

export function Providers({ children, provider }: { children: ReactNode; provider: LoginProvider }) {
  const login = useCallback(
    (callbackUrl?: string) => {
      const cb = callbackUrl ?? window.location.pathname + window.location.search;
      // Discord: straight to OAuth. Dev login: /login lets you pick a local test identity.
      if (provider === "discord") signIn("discord", { redirectTo: cb });
      else window.location.href = `/login?callbackUrl=${encodeURIComponent(cb)}`;
    },
    [provider],
  );
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <AuthCtx.Provider value={{ provider, login }}>
        <LazyMotion features={domAnimation} strict>
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </LazyMotion>
      </AuthCtx.Provider>
    </SessionProvider>
  );
}
