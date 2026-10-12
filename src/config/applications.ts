import type { ApplicationType } from "@/types";

/**
 * Application definitions — used by BOTH the step-by-step modal (UI) and
 * the server-side Zod schema (lib/validation.ts), so they can't drift.
 * The applicant's Discord account is attached automatically from login.
 */
export type FieldKind = "text" | "textarea" | "number" | "url" | "select";

export interface AppField {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  min?: number; // min length (text) or min value (number)
  max?: number; // max length (text) or max value (number)
  options?: string[];
  placeholder?: string;
  help?: string;
}

export interface AppStep {
  title: string;
  fields: AppField[];
}

export interface AppDefinition {
  type: ApplicationType;
  label: string;
  short: string;
  department: string;
  description: string;
  icon: "shield" | "siren" | "heart" | "crown" | "video";
  accent: "blue" | "red" | "silver";
  /** Field whose answer is stored as the application's character name. */
  characterField?: string;
  /** "quiz" = whitelist rule assessment flow (server-graded) instead of the plain step form. */
  flow?: "quiz";
  steps: AppStep[]; // a Review & Submit step is added automatically
  nextSteps: string;
}

const tz: AppField = { key: "timezone", label: "Timezone", kind: "text", required: true, max: 40, placeholder: "e.g. NPT (UTC+5:45)" };
const age: AppField = { key: "age", label: "Age", kind: "number", required: true, min: 13, max: 99 };
const extra: AppField = { key: "additional", label: "Additional information", kind: "textarea", max: 1000, placeholder: "Anything else we should know (optional)" };
const character: AppField = { key: "characterName", label: "Character name", kind: "text", required: true, min: 3, max: 60, placeholder: "First and last name" };
const fivemExp: AppField = { key: "fivemExperience", label: "FiveM experience", kind: "textarea", required: true, min: 20, max: 800, placeholder: "Servers you've played on and for how long" };
/** Final written whitelist question (after the rule quiz). */
export const whyJoin: AppField = {
  key: "whyJoin",
  label: "Why do you want to join Chandra Surya Roleplay?",
  kind: "textarea",
  required: true,
  min: 50,
  max: 1000,
  placeholder: "Tell us what you’re looking for in CSRP, the type of character or stories you want to create, and what you can bring to the community.",
};
const WFS = "Staff will review it and may ask you to join the WFS (Waiting for Support) voice channel in Discord for an interview. Keep your Discord DMs open.";

export const applicationDefinitions: AppDefinition[] = [
  {
    type: "whitelist",
    label: "Whitelist Application",
    short: "Whitelist",
    department: "City Access",
    description: "Required for every new citizen. Pass a short rule assessment, tell us why you want to join, and staff review your application.",
    icon: "shield",
    accent: "silver",
    flow: "quiz",
    // Quiz (5 random questions, server-graded) → this written question → review.
    steps: [{ title: "Why CSRP", fields: [whyJoin] }],
    nextSteps: "Your whitelist application is waiting for staff review. You'll be notified here and on Discord when it's decided.",
  },
  {
    type: "lspd",
    label: "LSPD Application",
    short: "LSPD",
    department: "Los Santos Police Department",
    description: "Patrol, investigate and uphold the law with structured ranks, training and procedure.",
    icon: "siren",
    accent: "blue",
    characterField: "characterName",
    steps: [
      { title: "Personal information", fields: [character, age, tz] },
      {
        title: "Experience",
        fields: [fivemExp, { key: "policeExperience", label: "Previous police RP experience", kind: "textarea", required: true, min: 20, max: 800 }],
      },
      {
        title: "Roleplay questions",
        fields: [
          { key: "whyLspd", label: "Why do you want to join LSPD?", kind: "textarea", required: true, min: 30, max: 1000 },
          { key: "bring", label: "What can you bring to LSPD?", kind: "textarea", required: true, min: 30, max: 1000 },
          {
            key: "scenario",
            label: "Scenario: during a traffic stop the driver flees on foot into a crowded market. Walk us through your response.",
            kind: "textarea",
            required: true,
            min: 60,
            max: 1500,
          },
          extra,
        ],
      },
    ],
    nextSteps: `Your LSPD application has been received. ${WFS}`,
  },
  {
    type: "ems",
    label: "EMS Application",
    short: "EMS",
    department: "Emergency Medical Services",
    description: "Respond, stabilise and save lives — from mountain roads to downtown emergencies.",
    icon: "heart",
    accent: "red",
    characterField: "characterName",
    steps: [
      { title: "Personal information", fields: [character, age, tz] },
      {
        title: "Experience",
        fields: [
          { key: "rpExperience", label: "RP experience", kind: "textarea", required: true, min: 20, max: 800 },
          { key: "medicalExperience", label: "Medical RP experience", kind: "textarea", required: true, min: 10, max: 800 },
          { key: "availability", label: "Availability", kind: "text", required: true, max: 120, placeholder: "e.g. Weekdays 7–11pm NPT" },
        ],
      },
      {
        title: "Roleplay questions",
        fields: [
          { key: "whyEms", label: "Why EMS?", kind: "textarea", required: true, min: 30, max: 1000 },
          { key: "unconscious", label: "How would you handle an injured, unconscious player?", kind: "textarea", required: true, min: 60, max: 1500 },
          { key: "bring", label: "What can you bring to EMS?", kind: "textarea", required: true, min: 30, max: 1000 },
          extra,
        ],
      },
    ],
    nextSteps: `Your EMS application has been received. ${WFS}`,
  },
  {
    type: "staff",
    label: "Staff Application",
    short: "Staff",
    department: "Staff Team",
    description: "Support players, moderate fairly and help keep the city a great place to roleplay.",
    icon: "crown",
    accent: "silver",
    steps: [
      { title: "Personal information", fields: [{ key: "name", label: "Name", kind: "text", required: true, min: 2, max: 60 }, age, tz] },
      {
        title: "Experience",
        fields: [
          fivemExp,
          { key: "moderationExperience", label: "Moderation experience", kind: "textarea", required: true, min: 20, max: 800 },
          { key: "weeklyAvailability", label: "Weekly availability", kind: "text", required: true, max: 120, placeholder: "e.g. ~12 hours, evenings NPT" },
        ],
      },
      {
        title: "Scenarios",
        fields: [
          { key: "whyStaff", label: "Why do you want to become CSRP staff?", kind: "textarea", required: true, min: 30, max: 1000 },
          { key: "argument", label: "How would you handle a heated argument between two players?", kind: "textarea", required: true, min: 40, max: 1200 },
          { key: "abuse", label: "How would you deal with an accusation of staff abuse?", kind: "textarea", required: true, min: 40, max: 1200 },
          { key: "contribute", label: "What can you contribute?", kind: "textarea", required: true, min: 30, max: 1000 },
          extra,
        ],
      },
    ],
    nextSteps: `Your staff application has been received. ${WFS}`,
  },
  {
    type: "creator",
    label: "Content Creator Application",
    short: "Creator",
    department: "Content Creator Program",
    description: "Stream or create CSRP content, get the creator role and be featured by the community.",
    icon: "video",
    accent: "blue",
    steps: [
      {
        title: "Your channel",
        fields: [
          { key: "creatorName", label: "Creator name", kind: "text", required: true, min: 2, max: 60 },
          { key: "platform", label: "Platform", kind: "select", required: true, options: ["YouTube", "TikTok", "Kick", "Twitch", "Other"] },
          { key: "channelUrl", label: "Channel URL", kind: "url", required: true, placeholder: "https://" },
        ],
      },
      {
        title: "Audience",
        fields: [
          { key: "followers", label: "Follower / subscriber count", kind: "number", required: true, min: 0, max: 100000000 },
          { key: "averageViews", label: "Average views", kind: "number", required: true, min: 0, max: 100000000 },
          { key: "contentType", label: "Content type", kind: "text", required: true, max: 120, placeholder: "e.g. Live streams, shorts, cinematic edits" },
          { key: "frequency", label: "Streaming / posting frequency", kind: "text", required: true, max: 120 },
        ],
      },
      {
        title: "About CSRP",
        fields: [
          { key: "whyCsrp", label: "Why CSRP?", kind: "textarea", required: true, min: 30, max: 1000 },
          { key: "plannedContent", label: "What type of CSRP content will you create?", kind: "textarea", required: true, min: 30, max: 1000 },
          extra,
        ],
      },
    ],
    nextSteps: "Thank you for applying to the CSRP Content Creator Program. Staff may contact you on Discord if a review or interview is needed.",
  },
];

export const getDefinition = (type: string) => applicationDefinitions.find((d) => d.type === type);
export const allFields = (d: AppDefinition) => d.steps.flatMap((s) => s.fields);
