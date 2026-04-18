import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumb';
import { getGlossaryTerm, glossarySlugs, glossaryTerms } from '@/lib/data/glossary';
import { publishedPosts } from '@/lib/blog';
import { site } from '@/lib/site';

export function generateStaticParams() {
  return glossarySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const term = getGlossaryTerm(slug);
  if (!term) return {};
  return {
    title: `${term.term} - definition`,
    description: term.shortDefinition,
    alternates: { canonical: `/glossary/${term.slug}` },
  };
}

export default async function GlossaryTermPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const term = getGlossaryTerm(slug);
  if (!term) notFound();

  const posts = publishedPosts();
  const relatedPosts = posts.filter((p) => term.relatedBlogSlugs.includes(p.slug));
  const relatedTerms = term.relatedTerms
    .map((s) => glossaryTerms.find((t) => t.slug === s))
    .filter((t): t is (typeof glossaryTerms)[number] => Boolean(t));

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Glossary', path: '/glossary' },
    { name: term.term, path: `/glossary/${term.slug}` },
  ]);

  // DefinedTerm schema so AI engines + Google can surface the definition
  // directly. Includes the formula + example in `description` because
  // schema.org DefinedTerm has no dedicated formula field.
  const definedTermSchema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    '@id': `${site.url}/glossary/${term.slug}/#definedterm`,
    name: term.term,
    description: term.shortDefinition + (term.formula ? ` Formula: ${term.formula}.` : ''),
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      '@id': `${site.url}/glossary/#termset`,
      name: 'ChurnStop subscription glossary',
      url: `${site.url}/glossary`,
    },
    url: `${site.url}/glossary/${term.slug}`,
  };

  return (
    <>
      <JsonLd id="ld-breadcrumb" schema={breadcrumbSchema} />
      <JsonLd id="ld-definedterm" schema={definedTermSchema} />

      <main className="mx-auto max-w-2xl px-6 py-20">
        <nav className="text-xs text-muted-2 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--fg)]">Home</Link>
          <span aria-hidden className="px-2">/</span>
          <Link href="/glossary" className="hover:text-[var(--fg)]">Glossary</Link>
          <span aria-hidden className="px-2">/</span>
          <span>{term.term}</span>
        </nav>

        <div className="eyebrow">Glossary</div>
        <h1 className="mt-3 text-[32px] lg:text-[40px] leading-tight tracking-tightish font-semibold">
          {term.term}
        </h1>

        {term.alsoKnownAs && term.alsoKnownAs.length > 0 ? (
          <p className="mt-3 text-[13px] text-muted-2">
            Also known as: {term.alsoKnownAs.join(', ')}
          </p>
        ) : null}

        <p className="mt-5 text-[17px] text-muted leading-relaxed">{term.shortDefinition}</p>

        <div className="mt-8 rounded-xl border border-strong p-6">
          <p className="text-[15px] leading-relaxed">{term.longDefinition}</p>
        </div>

        {term.formula ? (
          <section className="mt-8">
            <h2 className="text-[17px] font-semibold tracking-tightish">Formula</h2>
            <pre className="mt-3 rounded-xl border border-strong bg-[var(--bg-elev)] px-4 py-3 font-mono text-[13px] overflow-x-auto whitespace-pre-wrap">
              {term.formula}
            </pre>
          </section>
        ) : null}

        {term.example ? (
          <section className="mt-8">
            <h2 className="text-[17px] font-semibold tracking-tightish">Worked example</h2>
            <p className="mt-3 text-[15px] text-muted leading-relaxed">{term.example}</p>
          </section>
        ) : null}

        {relatedTerms.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-[17px] font-semibold tracking-tightish">Related terms</h2>
            <ul className="mt-3 space-y-2">
              {relatedTerms.map((t) => (
                <li key={t.slug}>
                  <Link href={`/glossary/${t.slug}`} className="text-accent underline underline-offset-4 hover:no-underline">
                    {t.term}
                  </Link>
                  <span className="ml-2 text-[14px] text-muted">- {t.shortDefinition}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {relatedPosts.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-[17px] font-semibold tracking-tightish">Related reading</h2>
            <ul className="mt-3 space-y-2">
              {relatedPosts.map((post) => (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="text-accent underline underline-offset-4 hover:no-underline">
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-16 rounded-xl border border-strong surface p-6">
          <h2 className="text-[17px] font-semibold tracking-tightish">Reduce churn with ChurnStop</h2>
          <p className="mt-2 text-[14px] text-muted leading-relaxed">
            Free WooCommerce Subscriptions plugin. Intercept cancellations with targeted offers, stay click-to-cancel compliant, report MRR preserved.
          </p>
          <Link
            href="/downloads/churnstop.zip"
            className="mt-4 inline-flex rounded-md bg-ink text-white px-4 py-2 text-sm font-medium hover:opacity-90 dark:bg-white dark:text-ink"
          >
            Download churnstop.zip
          </Link>
        </section>
      </main>
    </>
  );
}
