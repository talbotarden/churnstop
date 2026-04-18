import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumb';
import { comparisons, comparisonSlugs, getComparison } from '@/lib/data/comparisons';
import { personas } from '@/lib/data/personas';

export function generateStaticParams() {
  return comparisonSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) return {};
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: `/vs/${c.slug}` },
  };
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) notFound();

  const relatedPersonas = personas.filter((p) => c.relatedPersonaSlugs.includes(p.slug));
  const otherComparisons = comparisons.filter((o) => o.slug !== c.slug);

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Compare', path: '/vs' },
    { name: `vs ${c.competitor}`, path: `/vs/${c.slug}` },
  ]);

  return (
    <>
      <JsonLd id="ld-breadcrumb" schema={breadcrumbSchema} />

      <main className="mx-auto max-w-3xl px-6 py-20">
        <nav className="text-xs text-muted-2 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--fg)]">Home</Link>
          <span aria-hidden className="px-2">/</span>
          <Link href="/vs" className="hover:text-[var(--fg)]">Compare</Link>
          <span aria-hidden className="px-2">/</span>
          <span>vs {c.competitor}</span>
        </nav>

        <div className="eyebrow">Honest comparison</div>
        <h1 className="mt-3 text-[32px] lg:text-[40px] leading-tight tracking-tightish font-semibold">
          ChurnStop vs {c.competitor}
        </h1>
        <p className="mt-5 text-[17px] text-muted leading-relaxed max-w-[58ch]">{c.oneLiner}</p>
        <p className="mt-2 text-[12px] text-muted-2">Last verified: {c.lastVerified}</p>

        <section className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-strong p-5">
            <div className="eyebrow">ChurnStop positioning</div>
            <p className="mt-2 text-[14px] text-muted leading-relaxed">{c.positioning.us}</p>
          </div>
          <div className="rounded-xl border border-strong p-5">
            <div className="eyebrow">{c.competitor} positioning</div>
            <p className="mt-2 text-[14px] text-muted leading-relaxed">{c.positioning.them}</p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-[22px] font-semibold tracking-tightish">When to choose each</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <div className="eyebrow">Choose ChurnStop if</div>
              <ul className="mt-2 space-y-2 text-[14px] text-muted leading-relaxed">
                {c.whenToChooseEach.us.map((r) => (
                  <li key={r}>- {r}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="eyebrow">Choose {c.competitor} if</div>
              <ul className="mt-2 space-y-2 text-[14px] text-muted leading-relaxed">
                {c.whenToChooseEach.them.map((r) => (
                  <li key={r}>- {r}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-[22px] font-semibold tracking-tightish">Feature matrix</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-strong">
            <table className="w-full text-[13px]">
              <thead className="bg-[var(--bg-elev)] text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Dimension</th>
                  <th className="px-4 py-2 font-medium">ChurnStop</th>
                  <th className="px-4 py-2 font-medium">{c.competitor}</th>
                </tr>
              </thead>
              <tbody>
                {c.matrix.map((row) => (
                  <tr key={row.label} className="border-t border-soft align-top">
                    <td className="px-4 py-3 font-medium">{row.label}</td>
                    <td className="px-4 py-3 text-muted">{row.us}</td>
                    <td className="px-4 py-3 text-muted">{row.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[13px] text-muted-2">{c.pricingNote}</p>
        </section>

        {relatedPersonas.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-[22px] font-semibold tracking-tightish">Best fit for</h2>
            <p className="mt-2 text-[14px] text-muted leading-relaxed">
              If you run any of these, ChurnStop is a good match out of the box:
            </p>
            <ul className="mt-3 space-y-2">
              {relatedPersonas.map((p) => (
                <li key={p.slug}>
                  <Link href={`/for/${p.slug}`} className="text-accent underline underline-offset-4 hover:no-underline">
                    {p.vertical}
                  </Link>
                  <span className="ml-2 text-[14px] text-muted">- {p.hero.subhead}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-16 rounded-xl border border-strong surface p-6">
          <h2 className="text-[17px] font-semibold tracking-tightish">Try ChurnStop on your store</h2>
          <p className="mt-2 text-[14px] text-muted leading-relaxed">
            Free plugin install. 5 minutes to activate. Full save flow runs locally on your WooCommerce database.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/downloads/churnstop.zip"
              className="rounded-md bg-ink text-white px-4 py-2 text-sm font-medium hover:opacity-90 dark:bg-white dark:text-ink"
            >
              Download churnstop.zip
            </Link>
            <Link
              href="/pricing"
              className="rounded-md border border-strong px-4 py-2 text-sm font-medium hover:bg-[var(--bg-elev)]"
            >
              See pricing
            </Link>
          </div>
        </section>

        <section className="mt-12 border-t border-soft pt-8">
          <h2 className="text-[17px] font-semibold tracking-tightish">Other comparisons</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {otherComparisons.map((o) => (
              <Link
                key={o.slug}
                href={`/vs/${o.slug}`}
                className="rounded-full border border-soft px-3 py-1 text-[13px] hover:border-[var(--fg)]"
              >
                vs {o.competitor}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
