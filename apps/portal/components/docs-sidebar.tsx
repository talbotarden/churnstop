'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { docSections, getDocsBySection } from '@/lib/docs';

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Docs" className="text-sm">
      <Link
        href="/docs"
        className={`block px-3 py-1.5 rounded transition-colors ${
          pathname === '/docs' ? 'bg-[var(--bg-elev)] text-[var(--fg)] font-medium' : 'text-muted hover:text-[var(--fg)]'
        }`}
      >
        Overview
      </Link>

      {docSections.map((section) => (
        <div key={section} className="mt-6">
          <div className="px-3 text-[11px] uppercase tracking-wider text-muted-2 font-semibold">
            {section}
          </div>
          <ul className="mt-2 space-y-0.5">
            {getDocsBySection(section).map((doc) => {
              const href = `/docs/${doc.slug}`;
              const active = pathname === href;
              return (
                <li key={doc.slug}>
                  <Link
                    href={href}
                    className={`block px-3 py-1.5 rounded transition-colors ${
                      active
                        ? 'bg-[var(--bg-elev)] text-[var(--fg)] font-medium'
                        : 'text-muted hover:text-[var(--fg)]'
                    }`}
                  >
                    {doc.title}
                    {doc.status === 'coming-soon' ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-2">Soon</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
