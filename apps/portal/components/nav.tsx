import Link from 'next/link';
import { site } from '@/lib/site';

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-soft bg-[var(--bg)]/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tightish">{site.name}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm text-muted">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-[var(--fg)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/account"
            className="hidden sm:inline-flex h-9 items-center px-3 text-sm text-muted hover:text-[var(--fg)] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href={site.ctas.installFree.href}
            className="inline-flex h-9 items-center rounded-md bg-ink text-white px-3.5 text-sm font-medium hover:opacity-90 transition-opacity dark:bg-white dark:text-ink"
          >
            Install Free
          </Link>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <rect x="1" y="1" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.5 11.5L9.5 14.5L15.5 7.5"
        stroke="#0B6E4F"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
