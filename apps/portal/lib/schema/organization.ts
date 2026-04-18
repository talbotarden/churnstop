// Organization JSON-LD. Rendered in the root layout so every page carries it.
// Kept as a TypeScript const (rather than a raw .json file) so we can reuse
// `site.url` without string duplication and so Next.js tree-shakes unused fields.

import { site } from '@/lib/site';

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${site.url}/#organization`,
  name: 'ChurnStop',
  legalName: 'ChurnStop',
  url: site.url,
  logo: {
    '@type': 'ImageObject',
    url: `${site.url}/og/churnstop-logo.png`,
    contentUrl: `${site.url}/og/churnstop-logo.png`,
    width: 413,
    height: 120,
    caption: 'ChurnStop',
    encodingFormat: 'image/png',
  },
  image: `${site.url}/og/churnstop-logo.png`,
  description:
    'ChurnStop is a WordPress plugin for WooCommerce Subscriptions that intercepts subscription cancellations with a conditional save flow. Free tier via direct download today; the wordpress.org listing is pending review. Paid tiers adding A/B testing, cohort analytics, and winback automation are on the roadmap.',
  foundingDate: '2026',
  // sameAs lists only URLs that resolve today. wordpress.org listing is
  // pending review; add when approved.
  sameAs: [
    'https://github.com/talbotarden/churnstop',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@churnstop.org',
    url: `${site.url}/docs`,
    availableLanguage: ['en'],
  },
};
