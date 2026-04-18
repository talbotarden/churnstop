import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { docs } from '@/lib/docs';
import { publishedPosts } from '@/lib/blog';

// Static sitemap. Top-level routes plus every doc that is currently shipped
// (coming-soon docs are filtered out so the sitemap only lists URLs that
// actually resolve). Doc entries are enumerated from lib/docs.ts so adding
// a new MDX doc appends a sitemap entry automatically.

const staticRoutes: Array<{ path: string; priority: number; changefreq: 'daily' | 'weekly' | 'monthly' }> = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/pricing', priority: 0.9, changefreq: 'monthly' },
  { path: '/features', priority: 0.8, changefreq: 'monthly' },
  { path: '/click-to-cancel', priority: 0.8, changefreq: 'monthly' },
  { path: '/docs', priority: 0.7, changefreq: 'weekly' },
  { path: '/blog', priority: 0.6, changefreq: 'weekly' },
  { path: '/about', priority: 0.5, changefreq: 'monthly' },
  { path: '/terms', priority: 0.3, changefreq: 'monthly' },
  { path: '/privacy', priority: 0.3, changefreq: 'monthly' },
];

const routes = [
  ...staticRoutes,
  ...docs
    .filter((d) => d.status !== 'coming-soon')
    .map((d) => ({ path: `/docs/${d.slug}`, priority: 0.6, changefreq: 'monthly' as const })),
  ...publishedPosts().map((p) => ({
    path: `/blog/${p.slug}`,
    priority: 0.6,
    changefreq: 'monthly' as const,
  })),
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return routes.map(({ path, priority, changefreq }) => ({
    url: `${site.url}${path}`,
    lastModified: now,
    changeFrequency: changefreq,
    priority,
  }));
}
