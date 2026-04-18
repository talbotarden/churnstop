// BreadcrumbList JSON-LD builder. Call from any "deep" page so AI engines
// and Google can render the proper hierarchy in AI answers and SERPs.
//
// Usage in a future app/docs/[slug]/page.tsx:
//
//   const schema = buildBreadcrumbSchema([
//     { name: 'Home', path: '/' },
//     { name: 'Docs', path: '/docs' },
//     { name: 'Getting started', path: `/docs/${params.slug}` },
//   ]);
//   <JsonLd schema={schema} />

import { site } from '@/lib/site';

export interface BreadcrumbItem {
  name: string;
  path: string;    // root-relative; leading slash required
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  if (items.length === 0) {
    throw new Error('buildBreadcrumbSchema: need at least one crumb');
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${site.url}${items[items.length - 1].path}/#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${site.url}${item.path}`,
    })),
  };
}
