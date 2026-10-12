import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { StatusDashboard } from "@/components/status/StatusDashboard";
import { within } from "@/lib/timeout";
import { getStatusHistory, getStatusSummary } from "@/services/status.service";

export const metadata: Metadata = {
  title: "Server Status",
  description: "Live CSRP network status — FiveM players, Discord members, playtime, services and uptime history.",
};

export const revalidate = 30;

export default async function StatusPage() {
  const [summary, history] = await Promise.all([within(getStatusSummary(), 1200, null), within(getStatusHistory(), 1200, null)]);
  return (
    <>
      <PageHero tag="Live city network" title="CSRP network" accent="status." lede="Real-time health of the city: game server, Discord, playtime and the services behind this website. Values refresh automatically every 30 seconds." />
      <div className="container-x pb-16">
        <StatusDashboard initial={summary} initialHistory={history} />
      </div>
    </>
  );
}
