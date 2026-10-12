import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { SupportCenter } from "@/components/support/SupportCenter";

export const metadata: Metadata = {
  title: "Support Center",
  description: "Open a support ticket, report a player, appeal a ban, report a bug or contact CSRP staff.",
};

export default function SupportPage() {
  return (
    <>
      <PageHero tag="Support center" title="Talk to" accent="the staff team." lede="Tickets, reports, appeals and bug reports in one place. Every request gets a reference number, notifies staff in Discord and shows its live status on your dashboard." />
      <div className="container-x pb-16">
        <SupportCenter />
      </div>
    </>
  );
}
