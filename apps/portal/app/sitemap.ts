import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

// Static sitemap. Keep entries in sync with the routes that are actually
// rendered. MDX docs and blog posts will be enumerated dynamically once
// those directories land; for now, only the built pages are listed.

const routes: Array<{ path: string; priority: number; changefreq: 'daily' | 'weekly' | 'monthly' }> = [
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

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return routes.map(({ path, priority, changefreq }) => ({
    url: `${site.url}${path}`,
    lastModified: now,
    changeFrequency: changefreq,
    priority,
  }));
}
