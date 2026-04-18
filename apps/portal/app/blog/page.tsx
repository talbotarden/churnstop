import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumb';
import { publishedPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'WooCommerce Subscriptions retention, save-flow benchmarks, click-to-cancel compliance updates, and how-to guides for ChurnStop customers.',
  alternates: { canonical: '/blog' },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Blog', path: '/blog' },
]);

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogPage() {
  const posts = publishedPosts();

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
        <h1 className="mt-3 text-[40px] lg:text-[48px] leading-[1.05] tracking-tightish font-semibold max-w-[22ch]">
          Numbers-forward posts on WooCommerce subscription retention.
        </h1>
        <p className="mt-5 text-[18px] text-muted max-w-[60ch] leading-relaxed">
          The blog covers save-flow benchmarks, click-to-cancel compliance updates, and how-to guides for ChurnStop customers. One post at a time. No corporate content marketing, no listicles, no AI-generated filler.
        </p>

        {posts.length > 0 ? (
          <section className="mt-16">
            <h2 className="text-[22px] tracking-tightish font-semibold">Posts</h2>
            <ul className="mt-6 divide-y divide-[color:var(--border)] border-t border-b border-soft">
              {posts.map((post) => (
                <li key={post.slug} className="py-6">
                  <div className="text-xs text-muted-2 mb-2">
                    <time dateTime={post.publishedAt}>{fmtDate(post.publishedAt)}</time>
                    <span aria-hidden className="px-2">·</span>
                    <span>{post.readingTime}</span>
                  </div>
                  <h3 className="text-[20px] font-semibold tracking-tightish">
                    <Link href={`/blog/${post.slug}`} className="hover:underline underline-offset-4">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-[15px] text-muted leading-relaxed max-w-prose">
                    {post.summary}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-16 rounded-xl border border-strong surface px-8 py-8">
          <h2 className="text-xl font-semibold tracking-tightish">Want to be notified?</h2>
          <p className="mt-3 text-muted max-w-prose">
            The blog has an RSS feed at <code className="font-mono text-[0.9em] rounded bg-[var(--bg)] border border-soft px-1.5 py-0.5">/blog/rss.xml</code> (live with the next post) and no email list. Subscribe via RSS, or follow public <a href="https://github.com/talbotarden/churnstop/releases" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4 hover:no-underline">GitHub releases</a> for plugin changelog.
          </p>
        </section>
      </main>
    </>
  );
}
