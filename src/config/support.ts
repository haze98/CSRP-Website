import type { TicketType } from "@/types";
import type { AppField } from "./applications";

/** Support / report / appeal / bug forms — shared by UI and server validation. */
export interface SupportDefinition {
  type: TicketType;
  slug: string;
  label: string;
  description: string;
  icon: "lifebuoy" | "flag" | "scale" | "bug" | "mail";
  /** Extra fields beyond subject + description, stored in the type's detail table. */
  fields: AppField[];
}

export const supportDefinitions: SupportDefinition[] = [
  { type: "SUPPORT", slug: "support", label: "Support Ticket", description: "Questions about your account, the city or the website.", icon: "lifebuoy", fields: [] },
  {
    type: "PLAYER_REPORT",
    slug: "report",
    label: "Player Report",
    description: "Report a rule break with as much detail and evidence as possible.",
    icon: "flag",
    fields: [
      { key: "reportedPlayer", label: "Player name / ID / Discord", kind: "text", required: true, min: 2, max: 120 },
      { key: "incidentAt", label: "When did it happen?", kind: "text", required: true, max: 80, placeholder: "e.g. 12 Oct, ~9:40pm NPT" },
      { key: "evidenceUrl", label: "Evidence link (clip / screenshot)", kind: "url", placeholder: "https://" },
    ],
  },
  {
    type: "BAN_APPEAL",
    slug: "appeal",
    label: "Ban Appeal",
    description: "Request a fair review of a ban. Be honest — appeals are read in full.",
    icon: "scale",
    fields: [
      { key: "banReason", label: "Ban reason (as shown)", kind: "text", required: true, max: 200 },
      { key: "bannedBy", label: "Banned by (if known)", kind: "text", max: 80 },
      { key: "bannedAt", label: "Date of ban", kind: "text", max: 80 },
    ],
  },
  {
    type: "BUG_REPORT",
    slug: "bug",
    label: "Bug Report",
    description: "Found something broken? Tell us how to reproduce it.",
    icon: "bug",
    fields: [
      { key: "steps", label: "Steps to reproduce", kind: "textarea", required: true, min: 10, max: 1500 },
      { key: "severity", label: "Severity", kind: "select", required: true, options: ["Low", "Medium", "High", "Critical"] },
      { key: "evidenceUrl", label: "Clip / screenshot link", kind: "url", placeholder: "https://" },
    ],
  },
  { type: "CONTACT", slug: "contact", label: "Contact Staff", description: "Private message to the staff team.", icon: "mail", fields: [] },
];

export const getSupportDefinition = (slugOrType: string) => supportDefinitions.find((d) => d.slug === slugOrType || d.type === slugOrType);
