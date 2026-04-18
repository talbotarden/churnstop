// Article JSON-LD builder. Call from any blog post page once MDX content
// lands. The return value is drop-in for <JsonLd schema={...} />.
//
// Usage in a future app/blog/[slug]/page.tsx:
//
//   const post = await getPost(params.slug);
//   const schema = buildArticleSchema({
//     title: post.title,
//     description: post.summary,
//     slug: params.slug,
//     publishedAt: post.published,
//     updatedAt: post.updated,
//     authorName: post.author,
//     coverImage: post.cover,
//   });
//   return <>
//     <JsonLd schema={schema} />
//     <article>...</article>
//   </>;

import { site } from '@/lib/site';
import { organizationSchema } from './organization';

export interface ArticleInput {
  title: string;
  description: string;
  slug: string;               // without leading slash, e.g. "woocommerce-churn-benchmarks"
  publishedAt: string;        // ISO-8601
  updatedAt?: string;         // ISO-8601; falls back to publishedAt
  authorName: string;
  authorUrl?: string;         // canonical profile URL; falls back to site.url/about
  coverImage?: string;        // absolute URL; falls back to site-wide OG
  wordCount?: number;
  keywords?: string[];
}

export function buildArticleSchema(input: ArticleInput) {
  const url = `${site.url}/blog/${input.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}/#article`,
    headline: input.title,
    description: input.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    datePublished: input.publishedAt,
    dateModified: input.updatedAt ?? input.publishedAt,
    author: {
      '@type': 'Person',
      name: input.authorName,
      url: input.authorUrl ?? `${site.url}/about`,
    },
    publisher: { '@id': organizationSchema['@id'] },
    image: input.coverImage ?? `${site.url}/opengraph-image`,
    inLanguage: 'en',
    ...(input.wordCount ? { wordCount: input.wordCount } : {}),
    ...(input.keywords?.length ? { keywords: input.keywords.join(', ') } : {}),
  };
}
