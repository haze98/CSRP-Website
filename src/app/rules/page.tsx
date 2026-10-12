import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { RulesCenter } from "@/components/rules/RulesCenter";
import { allRules, ruleCategories } from "@/data/rules";

export const metadata: Metadata = {
  title: "Rules",
  description: "The Chandra Surya Roleplay city rulebook — general, roleplay, combat, vehicle, gang, streaming rules and RP terminology.",
};

export default function RulesPage() {
  return (
    <>
      <PageHero
        tag="City rulebook"
        title="Chandra Surya Roleplay"
        accent="City rulebook."
        lede="Clear rules keep stories fair for everyone. Read them before you apply — staff expect every resident to know them. Last updated by the CSRP staff team."
        aside={
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.06] text-center">
            {[
              { k: "Categories", v: ruleCategories.length },
              { k: "Rules", v: allRules.length },
              { k: "Terms", v: allRules.filter((r) => r.term).length },
            ].map((s) => (
              <div key={s.k} className="bg-charcoal px-5 py-4">
                <dt className="tag !text-[0.6rem]">{s.k}</dt>
                <dd className="mt-1 font-display text-3xl font-bold text-snow">{s.v}</dd>
              </div>
            ))}
          </dl>
        }
      />
      <div className="container-x pb-16">
        <RulesCenter />
      </div>
    </>
  );
}
