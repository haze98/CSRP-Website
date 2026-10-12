import type { MediaSlotKey } from "./media";

/**
 * City showcase cards (home section 01).
 *
 * Each card's image comes from a slot in src/config/media.ts — drop the
 * matching file into /public/media/ (e.g. showcase-serve-the-city.jpg) and it
 * replaces the light-only fallback automatically.
 */
export interface ShowcaseItem {
  n: string;
  title: string;
  line: string;
  media: MediaSlotKey;
  /** Hover edge light. */
  accent: "red" | "blue";
}

export const showcase: ShowcaseItem[] = [
  { n: "01", title: "Live Your Story", line: "Build your character and shape your own journey through the city.", media: "showcaseStory", accent: "red" },
  { n: "02", title: "Serve the City", line: "Join LSPD, EMS or other departments and become part of the city infrastructure.", media: "showcaseServe", accent: "blue" },
  { n: "03", title: "Build Your Legacy", line: "Businesses, crews, organizations and relationships can shape your future.", media: "showcaseLegacy", accent: "red" },
  { n: "04", title: "The City Never Sleeps", line: "From peaceful roleplay to tense situations, every session creates a new story.", media: "showcaseNight", accent: "blue" },
];
