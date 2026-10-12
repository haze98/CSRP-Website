import NextAuth, { type DefaultSession } from "next-auth";
import { cache } from "react";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import { devPersonas, type DevPersona } from "@/data/mock";
import { env, integrations } from "@/lib/env";
import { avatarUrl } from "@/lib/ids";
import { LoggingService } from "@/services/logging.service";
import { UserService } from "@/services/user.service";
import type { SessionUser } from "@/types";

declare module "next-auth" {
  interface Session {
    user: SessionUser & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid?: string;
    discordId?: string;
    username?: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    avatar?: string | null;
  }
}

/**
 * AuthService (Auth.js v5). Discord OAuth with the `identify` scope only.
 * Sessions are signed/encrypted JWT cookies (httpOnly, SameSite=Lax,
 * Secure in production). If Discord credentials are missing in
 * development, a clearly-labelled dev login is offered instead.
 */
const providers = [];
if (integrations.discordOAuth) {
  providers.push(
    Discord({
      clientId: env.discordClientId,
      clientSecret: env.discordClientSecret,
      authorization: { params: { scope: "identify" } },
    }),
  );
} else if (env.devLogin) {
  providers.push(
    Credentials({
      id: "dev",
      name: "Development login",
      credentials: { persona: {} },
      authorize: async (creds) => {
        const key = (String(creds?.persona ?? "player") in devPersonas ? String(creds?.persona ?? "player") : "player") as DevPersona;
        const p = devPersonas[key];
        return { id: p.discordId, name: p.displayName };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  trustHost: true,
  // Production requires AUTH_SECRET; development falls back to a fixed local secret.
  secret: env.authSecret || (env.isProd ? undefined : "csrp-development-secret-change-me-0123456789"),
  session: { strategy: "jwt", maxAge: 7 * 24 * 3600 },
  // httpOnly + SameSite=Lax session cookie; Secure (and __Secure- prefixed) in production.
  useSecureCookies: env.isProd,
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account) {
        // first sign-in in this session: resolve the Discord identity
        let discordId: string, username: string, displayName: string | null, avatar: string | null;
        if (account.provider === "discord" && profile) {
          const p = profile as { id: string; username: string; global_name?: string | null; avatar?: string | null };
          discordId = p.id;
          username = p.username;
          displayName = p.global_name ?? null;
          avatar = p.avatar ?? null;
        } else {
          const p = Object.values(devPersonas).find((x) => x.discordId === user?.id) ?? devPersonas.player;
          discordId = p.discordId;
          username = p.username;
          displayName = p.displayName;
          avatar = null;
        }
        token.uid = await UserService.syncLogin({ discordId, username, displayName, avatar });
        token.discordId = discordId;
        token.username = username;
        token.displayName = displayName;
        token.avatarUrl = avatarUrl(discordId, avatar);
        token.avatar = avatar;
        await LoggingService.log({
          category: "AUTH",
          action: "USER_LOGIN",
          actor: { id: token.uid, discordId, username },
          fields: [{ name: "Method", value: account.provider === "discord" ? "Discord OAuth" : "Development login", inline: true }],
        });
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid && token.discordId) {
        session.user = {
          ...session.user,
          id: token.uid,
          discordId: token.discordId,
          username: token.username ?? "player",
          displayName: token.displayName ?? null,
          avatarUrl: token.avatarUrl ?? null,
        };
      }
      return session;
    },
  },
  events: {
    async signOut(msg) {
      const t = "token" in msg ? msg.token : null;
      if (t?.uid) await LoggingService.log({ category: "AUTH", action: "USER_LOGOUT", actor: { id: t.uid, discordId: t.discordId ?? "", username: t.username ?? "" } });
    },
  },
});

/**
 * Current signed-in user (server components / route handlers), or null.
 * The Discord ID comes from the encrypted session cookie; the internal user
 * id is re-resolved from the store on every request (see
 * UserService.resolveSession), so stale or banned sessions never reach a
 * write. Memoised per request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const s = await auth();
  const u = s?.user;
  if (!u?.id || !u.discordId) return null;
  const avatar = u.avatarUrl?.match(/\/avatars\/\d+\/([\w]+)\./)?.[1] ?? null;
  const id = await UserService.resolveSession({ uid: u.id, discordId: u.discordId, username: u.username, displayName: u.displayName, avatar });
  return id ? { id, discordId: u.discordId, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl } : null;
});
