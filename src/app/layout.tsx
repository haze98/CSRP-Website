import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Background } from "@/components/effects/Background";
import { LoadingScreen, introScript } from "@/components/effects/LoadingScreen";
import { PointerLayer } from "@/components/effects/PointerLayer";
import { SmoothScroll } from "@/components/effects/SmoothScroll";
import { revealScript } from "@/components/ui/Reveal";
import { CustomCursor } from "@/components/motion/CustomCursor";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { ToneObserver } from "@/components/motion/ToneObserver";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Providers, type LoginProvider } from "@/components/providers/Providers";
import { serverConfig } from "@/config/server.config";
import { env, integrations } from "@/lib/env";
import "./globals.css";

const saira = localFont({
  src: [
    { path: "../fonts/saira-condensed-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/saira-condensed-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-saira",
  display: "swap",
  fallback: ["Arial Narrow", "sans-serif"],
});
const inter = localFont({ src: "../fonts/inter.woff2", weight: "400 700", variable: "--font-inter", display: "swap" });
const deva = localFont({ src: "../fonts/noto-deva.woff2", variable: "--font-noto-deva", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(serverConfig.siteUrl),
  title: { default: `${serverConfig.name} — ${serverConfig.tagline}`, template: `%s · ${serverConfig.shortName}` },
  description: serverConfig.description,
  applicationName: serverConfig.name,
  keywords: ["FiveM", "GTA V roleplay", "Nepal roleplay", "CSRP", "Chandra Surya Roleplay", "serious RP", "whitelist"],
  openGraph: { type: "website", siteName: serverConfig.name, title: serverConfig.name, description: serverConfig.tagline, locale: "en_US" },
  twitter: { card: "summary_large_image", title: serverConfig.name, description: serverConfig.tagline },
};

export const viewport: Viewport = { themeColor: "#030304", colorScheme: "dark", width: "device-width", initialScale: 1 };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: serverConfig.name,
  alternateName: serverConfig.shortName,
  url: serverConfig.siteUrl,
  logo: `${serverConfig.siteUrl}/brand/csrp-logo-512.png`,
  sameAs: [serverConfig.discordInvite, ...Object.values(serverConfig.socials).filter(Boolean)],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const provider: LoginProvider = integrations.discordOAuth ? "discord" : env.devLogin ? "dev" : null;
  return (
    <html lang="en" className={`${saira.variable} ${inter.variable} ${deva.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <script dangerouslySetInnerHTML={{ __html: revealScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="min-h-dvh">
        <LoadingScreen />
        <Background />
        <Providers provider={provider}>
          <Navbar />
          <main id="main" className="relative">
            {children}
          </main>
          <Footer />
          <PointerLayer />
          <SmoothScroll />
          <ScrollProgress />
          <ToneObserver />
          <CustomCursor />
        </Providers>
      </body>
    </html>
  );
}
