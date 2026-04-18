import { MetadataRoute } from 'next';

// Named allow blocks for every major AI crawler, then a permissive fallback
// for everything else. Classic Googlebot is covered by the wildcard rule.
// Google-Extended is Google's AI-training crawler; allowing it lets Gemini
// and AI Overviews use ChurnStop content for answer citations without
// affecting classic SERP ranking. Mirrors templates/robots.txt from the
// ai-search-optimizer skill.

const aiCrawlers = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'anthropic-ai',
  'Claude-Web',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
  'Applebot-Extended',
  'YouBot',
  'cohere-ai',
  'Meta-ExternalAgent',
];

const commonDisallow = ['/api/', '/account/', '/admin/', '/dashboard/', '/checkout/'];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://churnstop.org';

  return {
    rules: [
      ...aiCrawlers.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: commonDisallow,
      })),
      {
        userAgent: '*',
        allow: '/',
        disallow: commonDisallow,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
