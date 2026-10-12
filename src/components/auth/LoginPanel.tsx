"use client";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import type { LoginProvider } from "@/components/providers/Providers";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { Button } from "@/components/ui/Button";

export function LoginPanel({ provider, callbackUrl }: { provider: LoginProvider; callbackUrl: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  if (!provider) {
    return (
      <p className="flex items-start gap-3 rounded-xl border border-warn/25 bg-warn/[0.06] p-4 text-left text-sm text-warn">
        <TriangleAlert size={18} className="mt-0.5 shrink-0" />
        Discord login isn&apos;t configured yet. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET (see .env.example).
      </p>
    );
  }
  if (provider === "dev") {
    // Development only: two local test identities. Admin access still comes ONLY from the allowlist.
    const personas = [
      { key: "player", label: "Dev Player", id: "000000000000000001" },
      { key: "citizen", label: "Test Citizen", id: "000000000000000002" },
    ];
    return (
      <div className="space-y-3">
        {personas.map((p, i) => (
          <Button
            key={p.key}
            variant={i === 0 ? "royal" : "outline"}
            size="lg"
            className="w-full"
            disabled={!!busy}
            onClick={() => {
              setBusy(p.key);
              signIn("dev", { persona: p.key, redirectTo: callbackUrl });
            }}
          >
            {busy === p.key ? <LoaderCircle size={18} className="animate-spin" /> : <BrandIcon name="discord" size={20} />}
            Dev login · {p.label}
          </Button>
        ))}
        <p className="text-left text-xs leading-relaxed text-warn">
          Development mode: Discord OAuth isn&apos;t configured, so these sign you in as local test users (IDs …0001 / …0002). Disabled in production. Admin access is only granted by ADMIN_OWNER_DISCORD_ID / ADMIN_DISCORD_IDS.
        </p>
      </div>
    );
  }
  return (
    <Button
      variant="discord"
      size="lg"
      className="w-full"
      disabled={!!busy}
      onClick={() => {
        setBusy("discord");
        signIn("discord", { redirectTo: callbackUrl });
      }}
    >
      {busy ? <LoaderCircle size={18} className="animate-spin" /> : <BrandIcon name="discord" size={20} />}
      Login with Discord
    </Button>
  );
}
