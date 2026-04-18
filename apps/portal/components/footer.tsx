import Link from 'next/link';
import { site } from '@/lib/site';

const cols: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: 'Product',
    links: [
      { href: '/features', label: 'Features' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/click-to-cancel', label: 'Click to Cancel' },
      { href: '/downloads/churnstop.zip', label: 'Download .zip' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/docs', label: 'Docs' },
      { href: '/blog', label: 'Blog' },
      { href: '/glossary', label: 'Glossary' },
      { href: '/calculators', label: 'Calculators' },
      { href: '/for', label: 'By vertical' },
      { href: '/vs', label: 'Compare' },
      { href: '/about', label: 'About' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-soft mt-32">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="text-[15px] font-semibold tracking-tightish">{site.name}</div>
          <p className="mt-3 text-sm text-muted max-w-xs">
            Cancellation save flow for WooCommerce Subscriptions. Built for stores that bill monthly and want to keep more of them.
          </p>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-2">
              {col.title}
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted hover:text-[var(--fg)] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-soft">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted">
          <div>(c) {new Date().getFullYear()} ChurnStop. GPL-2.0-or-later.</div>
          <div>Built for WooCommerce Subscriptions 4.0+</div>
        </div>
      </div>
    </footer>
  );
}
