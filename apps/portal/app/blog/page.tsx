import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumb';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Coming soon: pillar posts on WooCommerce Subscriptions retention, subscription save-flow benchmarks, click-to-cancel compliance updates, and how-to guides for ChurnStop customers.',
  alternates: { canonical: '/blog' },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Blog', path: '/blog' },
]);

const plannedPosts = [
  {
    title: 'WooCommerce subscription churn benchmarks',
    summary: 'What a normal save rate looks like for subscription boxes, memberships, and SaaS-on-WooCommerce, with real numbers sourced from ChurnStop customers and industry data.',
  },
  {
    title: 'The click-to-cancel rule, explained for WooCommerce',
    summary: 'A merchant-readable breakdown of the 2024 FTC rule update, the five requirements, and the specific WooCommerce configurations that pass or fail each one.',
  },
  {
    title: 'Pause vs discount: which offer saves more cancels',
    summary: 'Data from 50+ WooCommerce stores on which offer type wins by cancellation reason. Short answer: depends on the reason, pause wins overall.',
  },
  {
    title: 'How to build a 30-day winback sequence that works',
    summary: 'Template for the three-email winback sequence ChurnStop Growth ships, with send timing, subject lines, and what to measure.',
  },
  {
    title: 'Save-flow best practices: the one-question rule',
    summary: 'Why every additional survey question drops your save rate by about 6.7% (per Churnkey), and what to do instead.',
  },
];

export default function BlogPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" schema={breadcrumbSchema} />

      <main className="mx-auto max-w-3xl px-6 py-20">
        <nav className="text-xs text-muted-2 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--fg)]">Home</Link>
          <span aria-hidden className="px-2">/</span>
          <span>Blog</span>
        </nav>

        <div className="eyebrow">Blog</div>
        <h1 className="mt-3 text-[40px] lg:text-[48px] leading-[1.05] tracking-tightish font-semibold max-w-[20ch]">
          Posts are on the way.
        </h1>
        <p className="mt-5 text-[18px] text-muted max-w-[60ch] leading-relaxed">
          The blog will cover WooCommerce Subscriptions retention, save-flow benchmarks, click-to-cancel compliance updates, and how-to guides for ChurnStop customers. Numbers-forward, one post at a time. No corporate content marketing.
        </p>

        <p className="mt-5 text-[16px] text-muted max-w-[60ch] leading-relaxed">
          In the meantime: the <Link href="/docs" className="text-accent underline underline-offset-4 hover:no-underline">docs</Link> cover install, offer types, and the API. The <Link href="/click-to-cancel" className="text-accent underline underline-offset-4 hover:no-underline">click-to-cancel page</Link> covers FTC compliance end to end. <Link href="/pricing" className="text-accent underline underline-offset-4 hover:no-underline">Pricing</Link> lists what each tier includes.
        </p>

        <section className="mt-16">
          <h2 className="text-[22px] tracking-tightish font-semibold">Planned posts</h2>
          <p className="mt-3 text-muted max-w-prose text-[15px]">
            Roughly in order of publication. These will land as real articles on this page; the list below is the promise, not the product.
          </p>

          <ul className="mt-8 divide-y divide-[color:var(--border)] border-t border-b border-soft">
            {plannedPosts.map((post) => (
              <li key={post.title} className="py-5">
                <h3 className="text-[17px] font-medium tracking-tightish">{post.title}</h3>
                <p className="mt-2 text-[14px] text-muted leading-relaxed max-w-prose">
                  {post.summary}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 rounded-xl border border-strong surface px-8 py-8">
          <h2 className="text-xl font-semibold tracking-tightish">Want to be notified?</h2>
          <p className="mt-3 text-muted max-w-prose">
            The blog has an RSS feed at <code className="font-mono text-[0.9em] rounded bg-[var(--bg)] border border-soft px-1.5 py-0.5">/blog/rss.xml</code> (live once the first post ships) and there is no email list. Subscribe via RSS, or follow the public <a href="https://github.com/talbotarden/churnstop/releases" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4 hover:no-underline">GitHub releases</a> for plugin changelog.
          </p>
        </section>
      </main>
    </>
  );
}
