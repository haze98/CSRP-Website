import { requireAdmin } from "@/lib/guards";
import { TicketList } from "@/components/admin/TicketList";
import { AdminTitle, FilterLink, NoStore } from "@/components/admin/ui";
import { supportDefinitions } from "@/config/support";
import { getStore } from "@/lib/store";
import { ticketPerm } from "@/services/admin.service";
import type { TicketStatus, TicketType } from "@/types";

export const metadata = { title: "Tickets" };

const STATUSES: TicketStatus[] = ["OPEN", "ASSIGNED", "WAITING_FOR_PLAYER", "RESOLVED", "CLOSED"];

export default async function AdminTickets({ searchParams }: { searchParams: Promise<{ type?: string; status?: string }> }) {
  const sp = await searchParams;
  const def = supportDefinitions.find((d) => d.type === sp.type) ?? supportDefinitions[0];
  const type: TicketType = def.type;
  await requireAdmin("/admin/tickets", ticketPerm(type, "view"));
  const status = STATUSES.includes(sp.status as TicketStatus) ? (sp.status as TicketStatus) : undefined;
  const store = await getStore();
  if (!store) return (<><AdminTitle title={def.label} /><NoStore /></>);
  const tickets = await store.listTickets({ type, status, take: 100 });
  const labels = Object.fromEntries(def.fields.map((f) => [f.key, f.label]));
  return (
    <>
      <AdminTitle title={`${def.label}s`} sub={def.description} />
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        <FilterLink href={`/admin/tickets?type=${type}`} active={!status}>Any status</FilterLink>
        {STATUSES.map((s) => (
          <FilterLink key={s} href={`/admin/tickets?type=${type}&status=${s}`} active={status === s}>{s.replace(/_/g, " ").toLowerCase()}</FilterLink>
        ))}
      </div>
      {tickets.length ? <TicketList tickets={tickets} fieldLabels={labels} /> : <p className="card p-10 text-center text-sm text-silver-500">Nothing here — all clear.</p>}
    </>
  );
}
