import { AdminTitle } from "@/components/admin/ui";
import { AdminAccessManager } from "@/components/admin/AdminAccessManager";
import { requireAdmin } from "@/lib/guards";
import { AdminService, LEVEL_DEFAULTS, LEVEL_LABEL } from "@/services/admin.service";

export const metadata = { title: "Admin Access" };

/** OWNER-only: manually assign website admin access by Discord ID. */
export default async function AdminAccessPage() {
  await requireAdmin("/admin/admins", "admins.manage");
  const admins = await AdminService.list();
  return (
    <>
      <AdminTitle title="Admin access" sub="Website admin access is assigned manually by Discord ID. Discord roles never grant access." />
      <AdminAccessManager admins={admins} levels={LEVEL_LABEL} defaults={LEVEL_DEFAULTS} />
    </>
  );
}
