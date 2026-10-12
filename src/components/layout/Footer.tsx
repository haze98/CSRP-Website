import Link from "next/link";
import { CsrpCrest } from "@/components/brand/CsrpLogo";
import { BrandIcon, type Brand } from "@/components/ui/BrandIcon";
import { ButtonLink } from "@/components/ui/Button";
import { serverConfig } from "@/config/server.config";

const columns = [
  {
    title: "Community",
    links: [
      { href: "/discord", label: "Discord" },
      { href: "/rules", label: "Rules" },
      { href: "/applications", label: "Applications" },
      { href: "/status", label: "Server Status" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/support", label: "Support Center" },
      { href: "/support?type=BAN_APPEAL", label: "Ban Appeal" },
      { href: "/support?type=BUG_REPORT", label: "Bug Report" },
      { href: "/support?type=PLAYER_REPORT", label: "Player Report" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/refunds", label: "Refund Policy" },
    ],
  },
];

export function Footer() {
  const credit = serverConfig.credit;
  const socials = (Object.entries(serverConfig.socials) as [Brand, string][]).filter(([, url]) => url);
  return (
    <footer className="relative border-t border-white/[0.06] bg-void/80">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-royal-500/0 via-royal-400/40 to-crimson-500/40" />
      <div className="container-x grid gap-12 py-16 lg:grid-cols-[1.4fr_2fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <CsrpCrest size={72} className="h-[72px] w-[72px]" />
            <div>
              <p className="font-display text-2xl font-bold tracking-[0.08em] text-snow">CSRP</p>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.26em] text-silver-400">Chandra Surya Roleplay</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-silver-400">{serverConfig.description}</p>
          <p className="mt-4 text-[0.7rem] leading-relaxed text-silver-500">
            Chandra Surya Roleplay is an independent roleplay community and is not affiliated with, endorsed by, or sponsored by Rockstar Games, Take-Two Interactive, Cfx.re, or their affiliates.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ButtonLink href={serverConfig.discordInvite} variant="crimson" size="sm">
              <BrandIcon name="discord" size={16} /> Join Discord
            </ButtonLink>
            {socials.map(([name, url]) => (
              <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name} className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-silver-400 transition-colors hover:border-white/25 hover:text-snow">
                <BrandIcon name={name} size={16} />
              </a>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {columns.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className="tag !text-snow">{c.title}</p>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-silver-400 transition-colors hover:text-snow">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      {/* bottom bar: copyright + credit, centred */}
      <div className="border-t border-white/[0.05]">
        <p className="container-x flex flex-col items-center justify-center gap-1 py-5 text-center text-xs text-silver-500 sm:flex-row sm:gap-3">
          <span>
            © {new Date().getFullYear()} {serverConfig.name}.<span className="hidden sm:inline"> All rights reserved.</span>
          </span>
          <span aria-hidden="true" className="hidden text-silver-500/60 sm:inline">•</span>
          <span>
            By{" "}
            {credit.url ? (
              <a href={credit.url} target="_blank" rel="noopener noreferrer" className="credit-link relative z-10 cursor-pointer" data-cursor="link">{credit.name}</a>
            ) : (
              <span className="credit-link">{credit.name}</span>
            )}
          </span>
        </p>
      </div>
    </footer>
  );
}
