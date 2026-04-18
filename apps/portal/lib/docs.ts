// Docs sidebar index. Single source of truth for the docs nav, the /docs
// landing page cards, the sitemap entries, and any llms.txt updates. Add a
// new MDX page under app/docs/<slug>/page.mdx and append a row here.

export interface DocEntry {
  slug: string;                 // route segment under /docs/
  title: string;                // shows in sidebar, breadcrumb, and as the page H1 default
  description: string;          // one sentence for the landing card + Article schema
  section: 'Start' | 'Reference' | 'Guides';
  readingTime?: string;         // approximate, shown on the landing card
  status?: 'available' | 'coming-soon';
}

export const docs: DocEntry[] = [
  {
    slug: 'getting-started',
    title: 'Getting started',
    description:
      'Install the ChurnStop plugin, activate it, and verify the default save flow is intercepting cancellations. 5-10 minutes.',
    section: 'Start',
    readingTime: '8 min',
    status: 'available',
  },
  {
    slug: 'offer-types',
    title: 'Offer types reference',
    description:
      'The six offer types (discount, pause, skip renewal, tier-down, extend trial, product swap) - what each does, when to use it, and how it maps to native WC Subs APIs.',
    section: 'Reference',
    readingTime: '12 min',
    status: 'available',
  },
  {
    slug: 'api',
    title: 'API and hooks reference',
    description:
      'REST endpoints, WordPress actions and filters, and data shapes exposed by the plugin. Use these to pipe cancellation events into your own analytics.',
    section: 'Reference',
    readingTime: '10 min',
    status: 'available',
  },
  {
    slug: 'ab-testing',
    title: 'A/B testing guide',
    description:
      'How to set up a save-flow experiment, what sample sizes to target, and how to read the results. Placeholder until Starter tier ships.',
    section: 'Guides',
    status: 'coming-soon',
  },
  {
    slug: 'winback',
    title: 'Winback email sequences',
    description:
      'Configure the 7/21/60-day winback sequence, bind it to your transactional email provider, and measure recovered revenue. Placeholder until Growth tier ships.',
    section: 'Guides',
    status: 'coming-soon',
  },
];

export const docSections: Array<DocEntry['section']> = ['Start', 'Reference', 'Guides'];

export function getDocsBySection(section: DocEntry['section']): DocEntry[] {
  return docs.filter((d) => d.section === section);
}

export function getDoc(slug: string): DocEntry | undefined {
  return docs.find((d) => d.slug === slug);
}
