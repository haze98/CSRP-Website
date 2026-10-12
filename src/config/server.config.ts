/**
 * ============================================================
 *  CSRP — ONE PLACE TO CHANGE SERVER INFORMATION
 * ============================================================
 * Public, non-secret settings live here. Secrets (tokens, client secret,
 * database URL, webhook URLs) must ONLY live in environment variables —
 * see .env.example. IDs below can be overridden by env vars of the same
 * meaning so you can keep them out of git if you prefer.
 */

const env = (key: string) => (typeof process !== "undefined" ? process.env[key] : undefined) || "";
const list = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);

export const serverConfig = {
  /* ---------------------------------------------------------- identity */
  name: "Chandra Surya Roleplay",
  shortName: "CSRP",
  tagline: "Two Forces. One City. Your Story.",
  description:
    "A Nepal-focused serious roleplay community where players build characters, careers, organisations, friendships and stories that last.",
  region: "Nepal",
  siteUrl: env("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000",

  /* ------------------------------------------------------------- links */
  /**
   * THE Discord invite — every "Join Discord" button reads this one value.
   * Override with NEXT_PUBLIC_DISCORD_INVITE_URL (read literally so the
   * server and browser bundles always agree).
   */
  discordInvite: process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/SsFwQaHU",
  /** fivem://connect/IP:PORT or https://cfx.re/join/XXXXXX — empty until public */
  fivemConnectUrl: env("NEXT_PUBLIC_FIVEM_CONNECT_URL"),
  socials: {
    youtube: env("NEXT_PUBLIC_YOUTUBE_URL"),
    tiktok: env("NEXT_PUBLIC_TIKTOK_URL"),
    kick: env("NEXT_PUBLIC_KICK_URL"),
    twitch: env("NEXT_PUBLIC_TWITCH_URL"),
  },

  /* ------------------------------------------------------------ server */
  maxPlayers: 128,

  /* --------------------------------------------------------- whitelist */
  whitelist: {
    /** Correct answers needed (out of questionsPerAttempt). */
    passScore: 3,
    questionsPerAttempt: 5,
    /** Minutes a player must wait after failing (WHITELIST_RETRY_COOLDOWN_MINUTES overrides on the server). */
    retryCooldownMinutes: 60,
    /** Written answer limits. */
    whyMin: 50,
    whyMax: 1000,
  },

  /* ------------------------------------------------------ applications */
  applications: {
    whitelist: { open: true },
    lspd: { open: true },
    ems: { open: true },
    staff: { open: true },
    creator: { open: false },
    /** Hours a user must wait after a rejected application before re-applying. */
    cooldownHours: 72,
  },

  /* ------------------------------------------------------------- store */
  store: {
    open: false,
    /** ISO date for a launch countdown, or empty for no countdown. */
    launchDate: "",
  },

  /* -------------------------------------------------------- developers */
  /**
   * Developer cards are built from THESE Discord IDs only (never from a
   * role). The server fetches avatar / username / display name from Discord.
   * Titles and skills are maintained here.
   */
  developers: {
    ids: [...new Set(["1195271781544640522", ...list(env("DEVELOPER_DISCORD_IDS"))])],
    profiles: {
      "1195271781544640522": { title: "Developer", role: "", skills: [] },
    } as Record<string, { title: string; role: string; skills: string[] }>,
  },

  /* ----------------------------------------------------- website credit */
  /** Footer credit (only the name is a link). */
  credit: { name: "Real Haze", url: "https://guns.lol/nothaze._" as string },

  /* ---------------------------------------------------- discord roles */
  discordRoles: {
    whitelist: env("DISCORD_WHITELIST_ROLE_ID"),
    lspd: env("DISCORD_LSPD_ROLE_ID"),
    ems: env("DISCORD_EMS_ROLE_ID"),
    staff: env("DISCORD_STAFF_ROLE_ID"),
    creator: env("DISCORD_CREATOR_ROLE_ID"),
    supporter: env("DISCORD_SUPPORTER_ROLE_ID"),
  },

  /* ------------------------------------------------- discord channels */
  discordLogChannels: {
    application: env("APPLICATION_LOG_CHANNEL_ID"),
    auth: env("AUTH_LOG_CHANNEL_ID"),
    support: env("SUPPORT_LOG_CHANNEL_ID"),
    staff: env("STAFF_LOG_CHANNEL_ID"),
    report: env("REPORT_LOG_CHANNEL_ID"),
    security: env("SECURITY_LOG_CHANNEL_ID"),
    whitelist: env("WHITELIST_LOG_CHANNEL_ID"),
    store: env("STORE_LOG_CHANNEL_ID"),
  },
} as const;

export type ServerConfig = typeof serverConfig;

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/applications", label: "Applications" },
  { href: "/rules", label: "Rules" },
  { href: "/store", label: "Store" },
  { href: "/status", label: "Status" },
  { href: "/discord", label: "Discord" },
] as const;

/** ENTER THE CITY: connect when the address is public, otherwise go apply. */
export const enterCityHref = () => serverConfig.fivemConnectUrl || "/applications?apply=whitelist";
