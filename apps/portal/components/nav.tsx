import Link from 'next/link';
import Image from 'next/image';
import { site } from '@/lib/site';

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-soft bg-[var(--bg)]/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center"
          aria-label={`${site.name} home`}
        >
          {/* Logo is a 3:2 wordmark lockup. Rendered at 36px tall in the nav */}
          {/* (54px wide at the source ratio). Next/Image optimises and lazy-loads */}
          {/* correctly; priority is on so it appears on first paint without shift. */}
          <Image
            src="/churnstop-logo.png"
            alt={site.name}
            width={612}
            height={408}
            priority
            className="h-9 w-auto dark:invert"
          />
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
