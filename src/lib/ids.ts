import type { ApplicationType } from "@/types";

const CODE: Record<ApplicationType, string> = { whitelist: "WL", lspd: "LSPD", ems: "EMS", staff: "STAFF", creator: "CREATOR" };

/** CSRP-LSPD-000127 / CSRP-WL-000124 — display references only; authorization never relies on them. */
export const applicationPublicId = (type: ApplicationType, n: number) => `CSRP-${CODE[type]}-${String(n).padStart(6, "0")}`;

/** CSRP-TICKET-0418 */
export const ticketPublicId = (n: number) => `CSRP-TICKET-${String(n).padStart(4, "0")}`;

export const avatarUrl = (discordId: string, avatar: string | null, size = 128) =>
  avatar ? `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.${avatar.startsWith("a_") ? "gif" : "png"}?size=${size}` : null;
