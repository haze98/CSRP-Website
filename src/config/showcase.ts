/**
 * City showcase cards (home section 03).
 *
 * To use your own screenshots or clips, put the file in /public/media/ and set
 * `media`, e.g.
 *   media: { type: "image", src: "/media/lspd-pursuit.webp" }
 *   media: { type: "video", src: "/media/night-city.webm", poster: "/media/night-city.webp" }
 * Videos autoplay muted + loop only while visible and load lazily.
 * Until then each card shows an original procedural scene (clearly labelled).
 */
export type SceneKind = "story" | "serve" | "empire" | "streets" | "legacy" | "night";

export interface ShowcaseItem {
  n: string;
  title: string;
  line: string;
  scene: SceneKind;
  media?: { type: "image" | "video"; src: string; poster?: string };
}

export const showcase: ShowcaseItem[] = [
  { n: "01", title: "Live Your Story", line: "Build your character and shape your own journey through the city.", scene: "story" },
  { n: "02", title: "Serve the City", line: "Join LSPD, EMS or other departments and become part of the city infrastructure.", scene: "serve" },
  { n: "03", title: "Build Your Legacy", line: "Businesses, crews, organizations and relationships can shape your future.", scene: "empire" },
  { n: "04", title: "The City Never Sleeps", line: "From peaceful roleplay to tense situations, every session creates a new story.", scene: "night" },
];
