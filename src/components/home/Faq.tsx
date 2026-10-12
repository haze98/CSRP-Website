import { Accordion } from "@/components/ui/Accordion";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const faqs = [
  {
    q: "What is Chandra Surya Roleplay?",
    a: "CSRP is a Nepal-based GTA V roleplay community running on FiveM. We focus on serious, character-driven roleplay: you play a person with a job, relationships and consequences, and the city remembers what you do.",
  },
  {
    q: "How do I join CSRP?",
    a: "Join our Discord, read the rulebook, then log in on this website with Discord and submit a whitelist application. Once approved you'll receive the Whitelisted role and the connect details for the city.",
  },
  {
    q: "Do I need to be whitelisted?",
    a: "Yes. Whitelisting keeps the quality of roleplay high and protects the community from trolls. The application asks about you, your roleplay experience and a short character backstory — be honest and take your time.",
  },
  {
    q: "How do I apply for LSPD?",
    a: "Open the Applications page and choose LSPD. You need to be whitelisted first. The form covers your availability, law-enforcement roleplay experience and a few scenario questions. Shortlisted applicants are invited to an interview.",
  },
  {
    q: "How do I apply for EMS?",
    a: "Choose EMS on the Applications page. EMS looks for calm, patient players who enjoy medical roleplay. You'll answer questions about your experience and how you'd handle a few emergency scenarios.",
  },
  {
    q: "Where can I report a player?",
    a: "Use Player Report in the Support Center. Include the player's name or ID, the time it happened and a clip if you have one. Reports are private — only staff can see them.",
  },
  {
    q: "How do I contact staff?",
    a: "Open a Support Ticket or use Staff Contact in the Support Center. You can follow the status of your ticket from your account dashboard, and staff are notified in Discord the moment you submit.",
  },
  {
    q: "Can I become a content creator?",
    a: "Yes — when the Content Creator Program is open, apply from the Applications page with links to your channels. We look for consistency and good representation of the city rather than follower count alone.",
  },
  {
    q: "What happens after submitting an application?",
    a: "You'll get an application ID like CSRP-LSPD-000127. Its status moves through Submitted, Under Review, Interview and then Accepted or Rejected. You can watch every step from your dashboard, and you may receive a Discord DM when it changes.",
  },
  {
    q: "How can I support the server?",
    a: "The best support is good roleplay and inviting friends who'll enjoy it. A cosmetic-only store is coming soon — no pay-to-win, ever. Every contribution goes toward hosting and development.",
  },
];

export function Faq() {
  return (
    <section data-tone="moon" aria-labelledby="faq-title" className="py-20 sm:py-28">
      <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.4fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeader index="06" tag="FAQ" id="faq-title" title="Questions," accent="answered." lede="Still stuck? Open a ticket in the Support Center and a staff member will get back to you." />
        </div>
        <Reveal>
          <Accordion items={faqs} />
        </Reveal>
      </div>
    </section>
  );
}
