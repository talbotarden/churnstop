// WebSite JSON-LD. Rendered in the root layout. Declares the canonical site
// identity plus a SearchAction so AI engines know how to deep-link queries.
// Including this alongside Organization is the recommended baseline for every
// site because it resolves "who publishes this" and "can I search this" in
// one fetch.

import { site } from '@/lib/site';
import { organizationSchema } from './organization';

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${site.url}/#website`,
  url: site.url,
  name: 'ChurnStop',
  description: site.description,
  publisher: { '@id': organizationSchema['@id'] },
  inLanguage: 'en',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${site.url}/docs?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};
