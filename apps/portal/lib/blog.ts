// Blog post index. Same discipline as lib/docs.ts: single source of truth
// for the /blog index page, the /blog/[slug] routing, and the sitemap. Add
// a new MDX post under app/blog/<slug>/page.mdx and append a row here.
// Sort order in this array determines display order on /blog (newest first).

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  summary: string;            // slightly longer card copy than description
  publishedAt: string;        // ISO-8601 date
  updatedAt?: string;         // ISO-8601 date; falls back to publishedAt
  readingTime: string;        // "8 min" or "12 min read"
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
  {
    slug: 'click-to-cancel-rule-explained',
    title: 'The click-to-cancel rule, explained for WooCommerce',
    description:
      'The FTC click-to-cancel rule has been in effect since May 2025. Most WooCommerce Subscriptions stores that added a save flow before then are non-compliant. Here is the 10-minute audit.',
    summary:
      'A merchant-readable breakdown of the 2024 FTC rule update, the five requirements, the specific WooCommerce configurations that pass or fail each one, and how to audit your own store in 10 minutes.',
    publishedAt: '2026-04-11',
    readingTime: '8 min',
    author: 'ChurnStop',
    keywords: [
      'click to cancel',
      'FTC cancellation rule',
      'ROSCA compliance',
      'WooCommerce compliance',
      'subscription cancellation law',
    ],
    status: 'published',
  },
  {
    slug: 'pause-vs-discount',
    title: 'Pause vs discount: which offer saves more cancellations',
    description:
      'Pause offers typically save more subscribers than discount offers on WooCommerce stores, but discount wins on revenue preserved per save. The right call depends on your cancel reason mix.',
    summary:
      'Data from public benchmarks and early ChurnStop installs on which offer type wins by cancellation reason. Short answer: depends on the reason. Pause wins on save rate, discount wins on revenue preserved per save.',
    publishedAt: '2026-04-04',
    readingTime: '10 min',
    author: 'ChurnStop',
    keywords: [
      'pause offer',
      'discount offer',
      'subscription retention',
      'WooCommerce save flow',
      'cancellation offer strategy',
    ],
    status: 'published',
  },
  {
    slug: 'one-question-rule',
    title: 'Save-flow best practices: the one-question rule',
    description:
      'Every additional question in a cancel-flow survey drops save rate by roughly 6.7%, per Churnkey 2024. One required question, optional open-text follow-up, no escalation. Here is why asking less works.',
    summary:
      'Why every additional survey question drops your save rate by about 6.7% (per Churnkey), and what to do instead. The rule is short; the post is short.',
    publishedAt: '2026-03-28',
    readingTime: '6 min',
    author: 'ChurnStop',
    keywords: [
      'cancel survey',
      'save flow design',
      'exit survey best practices',
      'one question rule',
      'Churnkey benchmarks',
    ],
    status: 'published',
  },
  {
    slug: 'winback-email-sequences',
    title: 'How to build a 30-day winback sequence that works',
    description:
      'A three-email winback sequence sent at 7, 21, and 60 days after cancellation typically recovers 4-8% of churned subscribers. Here is the template: subject lines, timing, offer pattern, and what to measure.',
    summary:
      'Template for the three-email winback sequence ChurnStop Growth ships, with send timing, subject lines, and what to measure.',
    publishedAt: '2026-03-21',
    readingTime: '9 min',
    author: 'ChurnStop',
    keywords: [
      'winback email',
      'reactivation campaign',
      'churn recovery',
      'WooCommerce email marketing',
      'subscription winback',
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
