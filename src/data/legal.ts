/**
 * Plain-language legal pages. These are sensible starting templates for a
 * community website, not legal advice — have them reviewed before launch.
 */
export interface LegalDoc {
  slug: string;
  title: string;
  updated: string;
  intro: string;
  sections: { h: string; p: string[] }[];
}

export const legalDocs: LegalDoc[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    updated: "11 October 2026",
    intro: "This policy explains what information Chandra Surya Roleplay (\"CSRP\", \"we\") collects through this website, why, and the choices you have.",
    sections: [
      { h: "What we collect", p: ["When you log in with Discord we receive your Discord user ID, username, display name and avatar (the identify scope). We do not receive your email address, password or messages.", "If our Discord bot is connected, we check whether you are a member of the CSRP Discord server and which CSRP roles you hold.", "We store the applications, tickets, reports and appeals you submit, and a log of actions taken on them."] },
      { h: "Why we use it", p: ["To let you apply, contact staff and track your requests; to let staff review them and contact you on Discord; and to keep the community safe by preventing spam, abuse and ban evasion."] },
      { h: "Security logs", p: ["For security we keep an audit log of logins and staff actions. Where IP information is used for rate limiting or abuse prevention it is stored as a one-way hash, not as a readable address."] },
      { h: "Sharing", p: ["Your submissions are visible to CSRP staff only. Summaries are posted to private staff channels in our Discord. We do not sell your information or share it with advertisers."] },
      { h: "Retention and your rights", p: ["We keep records while your account is active and for as long as needed to moderate the community. You can ask staff through a Contact Staff ticket to see or delete your data, except where we need to keep records of bans or rule breaks."] },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Service",
    updated: "11 October 2026",
    intro: "By using this website or joining the CSRP FiveM server you agree to these terms and to the CSRP city rulebook.",
    sections: [
      { h: "Eligibility", p: ["You must meet the minimum age required by Discord and FiveM in your country. Whitelisting and department roles are granted at staff discretion."] },
      { h: "Your account", p: ["You are responsible for activity on your Discord account. Accounts may not be shared, sold or used to evade a ban."] },
      { h: "Content you submit", p: ["Applications, tickets and reports must be honest and your own work. Submitting false reports, spam or abusive content may lead to removal from the community."] },
      { h: "Independence", p: ["CSRP is an independent community and is not affiliated with, endorsed by or sponsored by Rockstar Games, Take-Two Interactive, Cfx.re or their affiliates. All trademarks belong to their owners."] },
      { h: "Changes and termination", p: ["We may update these terms, the rules or the website at any time. We may suspend access to the website or server for breaches of these terms or the rulebook."] },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie Policy",
    updated: "11 October 2026",
    intro: "We keep cookies to the minimum the website needs to work.",
    sections: [
      { h: "Essential cookies", p: ["A secure, http-only session cookie keeps you logged in after Discord login, and a CSRF cookie protects forms. These are required for the site to work and can't be switched off."] },
      { h: "Local storage", p: ["Your browser may store an unfinished application draft and whether you have seen the intro animation this session. This never leaves your device."] },
      { h: "No tracking", p: ["We do not use advertising or cross-site tracking cookies."] },
    ],
  },
  {
    slug: "refunds",
    title: "Refund Policy",
    updated: "11 October 2026",
    intro: "The CSRP store is not open yet. This policy will apply once it launches.",
    sections: [
      { h: "Cosmetic and supporter items", p: ["Store purchases are voluntary contributions toward hosting and development and grant cosmetic or supporter perks only — never gameplay advantages."] },
      { h: "Refunds", p: ["Because perks are delivered digitally and immediately, purchases are generally non-refundable. If something went wrong with delivery, open a Support Ticket within 14 days and staff will fix it or refund you."] },
      { h: "Chargebacks and bans", p: ["Filing a chargeback instead of contacting us may result in removal of perks. Perks are not refunded if you are banned for breaking the rules."] },
    ],
  },
];
