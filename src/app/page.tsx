import { CityShowcase } from "@/components/home/CityShowcase";
import { Departments } from "@/components/home/Departments";
import { Developers } from "@/components/home/Developers";
import { Faq, faqs } from "@/components/home/Faq";
import { FinalCta } from "@/components/home/FinalCta";
import { Hero } from "@/components/home/Hero";
import { Platform } from "@/components/home/Platform";
import { QuickBar } from "@/components/home/QuickBar";
import { StatusPreview } from "@/components/home/StatusPreview";
import { WhatIsCsrp } from "@/components/home/WhatIsCsrp";
import { SectionTransition } from "@/components/motion/SectionTransition";
import { within } from "@/lib/timeout";
import { resolveMediaMany } from "@/server/media";
import { configuredDevelopers, getDevelopers } from "@/services/developer.service";
import { getStatusHistory, getStatusSummary } from "@/services/status.service";

// Re-render at most every 30s; live values keep refreshing client-side.
export const revalidate = 30;

export default async function Home() {
  // Never block the page on integrations: cap each lookup, fall back to "Connecting…".
  const [status, history, devs] = await Promise.all([
    within(getStatusSummary(), 1200, null),
    within(getStatusHistory(), 1200, null),
    within(getDevelopers(), 1500, { mode: "unavailable" as const, data: configuredDevelopers() }),
  ]);
  const media = resolveMediaMany(["hero", "showcaseStory", "showcaseServe", "showcaseLegacy", "showcaseNight", "cta"]);
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <>
      <Hero initial={status} media={media.hero} />
      <QuickBar initial={status} />
      <CityShowcase media={media} />
      <WhatIsCsrp />
      <StatusPreview initial={status} history={history?.data ?? null} />
      <SectionTransition />
      <Departments />
      <Platform />
      <SectionTransition />
      <Faq />
      <Developers developers={devs.data} mode={devs.mode} />
      <FinalCta />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </>
  );
}
