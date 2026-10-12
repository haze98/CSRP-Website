/**
 * Homepage images (files live in /public/media).
 *
 * Each slot lists candidate files in order of preference; the first one that
 * exists is used. To swap an image, drop a file in /public/media and put its
 * path first in the list (e.g. "/media/hero-gta.jpg").
 * If no file exists — or the image fails to load — the slot shows a clean
 * black / red-blue gradient. Nothing is ever printed on the page about it.
 */
export interface MediaSlot {
  /** Candidate paths under /public, most preferred first. */
  files: string[];
  /** Describes the photo for screen readers. */
  alt: string;
  /** object-position — keeps the subject in frame when cropped. */
  focus?: string;
  /** "night" darkens and cools the image (used to reuse a dusk shot as night). */
  grade?: "night";
}

export const mediaSlots = {
  hero: {
    // hero-gta.webp = gta-5-rp-1024x576.webp resampled to 1920×1080 (Lanczos + light sharpen) — no larger source exists yet
    files: ["/media/hero-gta.jpg", "/media/hero-gta.webp", "/media/gta-5-rp-1024x576.webp"],
    alt: "A high-speed chase along the coast highway at sunset",
    focus: "60% 50%",
  },
  showcaseStory: {
    files: ["/media/showcase-live-your-story.jpg", "/media/WsiTM354Mx3wFiMcjCTEZk.webp"],
    alt: "A player at a casino poker table with the dealer",
    focus: "45% 60%",
  },
  showcaseServe: {
    files: ["/media/showcase-serve-the-city.jpg", "/media/GTA5_NextGen_069_Hakuchou_PoliceTransporter-292-360.webp"],
    alt: "A police transporter and bikers in a pursuit at dusk",
    focus: "55% 40%",
  },
  showcaseLegacy: {
    files: ["/media/showcase-build-your-legacy.jpg", "/media/444a3517b76978c50c2ab0fce81f7aa3.webp"],
    alt: "A crew in black suits lined up in front of an armoured SUV",
    focus: "50% 45%",
  },
  showcaseNight: {
    // night-graded crop of gta-5-rp-1024x576.webp (rider + muscle car)
    files: ["/media/showcase-city-never-sleeps.jpg", "/media/showcase-city-never-sleeps.webp", "/media/gta-5-rp-1024x576.webp"],
    alt: "Riders and a muscle car racing down the highway as night falls",
    focus: "45% 55%",
  },
  cta: {
    files: ["/media/cta-city-waiting.jpg", "/media/444a3517b76978c50c2ab0fce81f7aa3.webp"],
    alt: "A crew waiting by their vehicles",
    focus: "50% 50%",
  },
} satisfies Record<string, MediaSlot>;

export type MediaSlotKey = keyof typeof mediaSlots;

/** A slot after checking /public: `src` is the first existing file, or null. */
export interface ResolvedMedia extends MediaSlot {
  key: MediaSlotKey;
  src: string | null;
}
