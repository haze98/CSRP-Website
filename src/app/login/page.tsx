import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { CsrpCrest } from "@/components/brand/CsrpLogo";
import type { LoginProvider } from "@/components/providers/Providers";
import { env, integrations } from "@/lib/env";

export const metadata: Metadata = { title: "Login", robots: { index: false } };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  AccessDenied: "Access was denied. If you cancelled the Discord prompt, try again.",
  Configuration: "Login is temporarily unavailable. Please try again later.",
  Verification: "That sign-in link is no longer valid.",
};

/** Only allow same-site relative callback paths (no open redirects). */
const safePath = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/account");

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const sp = await searchParams;
  const callbackUrl = safePath(sp.callbackUrl);
  if (await getCurrentUser()) redirect(callbackUrl);
  const provider: LoginProvider = integrations.discordOAuth ? "discord" : env.devLogin ? "dev" : null;
  const error = sp.error ? (ERRORS[sp.error] ?? "Something went wrong while logging in. Please try again.") : null;

  return (
    <section className="grid min-h-[100svh] place-items-center px-5 pb-16 pt-32">
      <div className="card relative w-full max-w-md overflow-hidden p-7 text-center sm:p-10">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-royal-400/0 via-royal-400/70 to-crimson-400/70" />
        <div aria-hidden="true" className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-royal-500/15 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-crimson-500/15 blur-3xl" />
        <div className="relative">
          <div className="mx-auto w-fit">
            <CsrpCrest size={64} animate />
          </div>
          <p className="tag mt-6">[ Citizen access ]</p>
          <h1 className="h-display mt-3 text-4xl text-snow sm:text-5xl">Enter the city</h1>
          <p className="mt-3 text-sm leading-relaxed text-silver-400">Log in with the Discord account you use in the CSRP server to apply, open tickets and track everything from your dashboard.</p>
          {error && (
            <p role="alert" className="mt-6 rounded-lg border border-crimson-500/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-400">
              {error}
            </p>
          )}
          <div className="mt-8">
            <LoginPanel provider={provider} callbackUrl={callbackUrl} />
          </div>
          <p className="mt-6 flex items-start gap-2 text-left text-xs leading-relaxed text-silver-500">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-online" />
            We request only your public Discord profile (identify scope). We never see your password, email or messages, and roles are checked server-side by the CSRP bot.
          </p>
        </div>
      </div>
    </section>
  );
}
