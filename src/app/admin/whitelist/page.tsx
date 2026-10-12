import { NoStore } from "@/components/admin/ui";
import { WhitelistTable, type WhitelistRow } from "@/components/admin/WhitelistTable";
import { requireAdmin } from "@/lib/guards";
import { avatarUrl } from "@/lib/ids";
import { getStore } from "@/lib/store";
import { NotificationService } from "@/services/notification.service";
import { WhitelistService } from "@/services/whitelist.service";
import { integrations } from "@/lib/env";

export const metadata = { title: "Whitelist" };

export default async function AdminWhitelist({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const { access } = await requireAdmin("/admin/whitelist", "whitelist.view");
  const sp = await searchParams;
  if (!(await getStore())) return <NoStore />;
  const rows: WhitelistRow[] = (await WhitelistService.listStates()).map((r) => ({
    userId: r.user.id,
    discordId: r.user.discordId,
    username: r.user.username,
    displayName: r.user.displayName,
    avatarUrl: avatarUrl(r.user.discordId, r.user.avatar),
    state: r.state,
    appId: r.application?.id ?? null,
    publicId: r.application?.publicId ?? null,
    quiz: r.application?.quiz ?? null,
    attempts: r.attempts,
    submittedAt: r.application?.createdAt ?? null,
    lastActivity: r.lastActivity,
  }));
  return (
    <WhitelistTable
      rows={rows}
      initialTab={sp.tab ?? "PENDING_REVIEW"}
      initialQuery={sp.q ?? ""}
      canRemind={access.permissions.includes("notifications.send")}
      channels={{ push: NotificationService.pushConfigured(), dm: integrations.discordBot }}
    />
  );
}
