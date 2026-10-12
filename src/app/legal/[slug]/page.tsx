import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { legalDocs } from "@/data/legal";

export const dynamicParams = false;
export const generateStaticParams = () => legalDocs.map((d) => ({ slug: d.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = legalDocs.find((d) => d.slug === slug);
  return { title: doc?.title ?? "Legal" };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = legalDocs.find((d) => d.slug === slug);
  if (!doc) notFound();
  return (
    <div className="container-x pb-16 pt-36 sm:pt-44">
      <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Legal documents" className="lg:sticky lg:top-28 lg:self-start">
          <p className="tag mb-3">Legal</p>
          <ul className="flex flex-wrap gap-1 lg:flex-col">
            {legalDocs.map((d) => (
              <li key={d.slug}>
                <Link href={`/legal/${d.slug}`} aria-current={d.slug === slug ? "page" : undefined} className={`block rounded-lg px-3 py-2 text-sm ${d.slug === slug ? "bg-white/[0.06] text-snow" : "text-silver-400 hover:text-snow"}`}>
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <article className="max-w-3xl">
          <h1 className="h-display text-5xl text-snow sm:text-6xl">{doc.title}</h1>
          <p className="mt-3 text-sm text-silver-500">Last updated {doc.updated}</p>
          <p className="mt-8 text-lg leading-relaxed text-silver-300">{doc.intro}</p>
          {doc.sections.map((s, i) => (
            <section key={s.h} className="mt-10">
              <h2 className="flex items-center gap-3 font-display text-2xl font-semibold uppercase tracking-wide text-snow">
                <span className="text-sm text-crimson-400">{String(i + 1).padStart(2, "0")}</span>
                {s.h}
              </h2>
              {s.p.map((p) => (
                <p key={p} className="mt-3 leading-relaxed text-silver-400">
                  {p}
                </p>
              ))}
            </section>
          ))}
          <p className="mt-12 border-t border-white/[0.06] pt-6 text-sm text-silver-500">
            Questions? <Link href="/support?type=CONTACT" className="text-royal-400 hover:text-snow">Contact the staff team</Link>.
          </p>
        </article>
      </div>
    </div>
  );
}
