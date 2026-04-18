// Blog post index. Same discipline as lib/docs.ts: single source of truth
// for the /blog index page, the /blog/[slug] routing, and the sitemap. Add
// a new MDX post under app/blog/<slug>/page.mdx and append a row here.

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  summary: string;           // slightly longer card copy than description
  publishedAt: string;       // ISO-8601 date
  updatedAt?: string;        // ISO-8601 date; falls back to publishedAt
  readingTime: string;       // "8 min" or "12 min read"
  author: string;
  keywords: string[];
  status: 'published' | 'draft';
}

export const posts: BlogPost[] = [
  {
    slug: 'woocommerce-churn-benchmarks',
    title: 'WooCommerce subscription churn benchmarks: what a normal save rate looks like',
    description:
      'Churn rates, save rates, and MRR preserved benchmarks for WooCommerce Subscriptions stores by category. Data from public sources plus what we see across early ChurnStop installs.',
    summary:
      'What a normal save rate looks like for subscription boxes, memberships, and SaaS-on-WooCommerce, with real numbers sourced from public benchmarks and ChurnStop installs.',
    publishedAt: '2026-04-18',
    readingTime: '9 min',
    author: 'ChurnStop',
    keywords: [
      'WooCommerce subscription churn',
      'save rate benchmark',
      'MRR preserved',
      'subscription retention rate',
      'WooCommerce Subscriptions',
    ],
    status: 'published',
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug && p.status === 'published');
}

export function publishedPosts(): BlogPost[] {
  return posts.filter((p) => p.status === 'published');
}
