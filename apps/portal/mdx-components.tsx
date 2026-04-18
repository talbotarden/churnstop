// Shared MDX component mapping. Applied to every .mdx route-level page in
// the App Router. Tailwind classes here match the prose style used on the
// non-MDX pages (click-to-cancel, features) for visual consistency.

import type { MDXComponents } from 'mdx/types';
import type { AnchorHTMLAttributes } from 'react';
import Link from 'next/link';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children, ...props }) => (
      <h1 className="text-[36px] lg:text-[48px] leading-[1.05] tracking-tightish font-semibold" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="mt-14 text-[28px] leading-tight tracking-tightish font-semibold scroll-mt-24" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="mt-10 text-[20px] tracking-tightish font-semibold scroll-mt-24" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 className="mt-8 text-[17px] tracking-tightish font-semibold" {...props}>
        {children}
      </h4>
    ),
    p: ({ children, ...props }) => (
      <p className="mt-5 text-[16px] leading-relaxed text-muted max-w-prose" {...props}>
        {children}
      </p>
    ),
    a: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
      const isInternal = href && href.startsWith('/');
      if (isInternal) {
        return (
          <Link href={href} className="text-accent underline underline-offset-4 hover:no-underline">
            {children}
          </Link>
        );
      }
      return (
        <a
          href={href}
          className="text-accent underline underline-offset-4 hover:no-underline"
          {...(href && !href.startsWith('#')
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
          {...props}
        >
          {children}
        </a>
      );
    },
    ul: ({ children, ...props }) => (
      <ul className="mt-5 space-y-2 text-[16px] leading-relaxed text-muted max-w-prose list-disc pl-6 marker:text-muted-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="mt-5 space-y-2 text-[16px] leading-relaxed text-muted max-w-prose list-decimal pl-6 marker:text-muted-2" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="pl-1" {...props}>
        {children}
      </li>
    ),
    code: ({ children, className, ...props }) => {
      const isBlock = typeof className === 'string' && className.startsWith('language-');
      if (isBlock) {
        return (
          <code className={`${className ?? ''} font-mono text-[13px] leading-relaxed`} {...props}>
            {children}
          </code>
        );
      }
      return (
        <code className="font-mono text-[0.875em] rounded bg-[var(--bg-elev)] border border-soft px-1.5 py-0.5" {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }) => (
      <pre className="mt-6 overflow-x-auto rounded-xl border border-strong surface p-5 text-[13px] leading-relaxed font-mono" {...props}>
        {children}
      </pre>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote className="mt-6 border-l-4 border-accent pl-5 italic text-muted max-w-prose" {...props}>
        {children}
      </blockquote>
    ),
    table: ({ children, ...props }) => (
      <div className="mt-6 overflow-x-auto rounded-xl border border-strong">
        <table className="w-full text-[14px]" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="surface border-b border-soft" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }) => (
      <th className="text-left px-4 py-3 font-medium" {...props}>
        {children}
      </th>
    ),
    tbody: ({ children, ...props }) => (
      <tbody className="divide-y divide-[color:var(--border)]" {...props}>
        {children}
      </tbody>
    ),
    td: ({ children, ...props }) => (
      <td className="px-4 py-3 align-top text-muted" {...props}>
        {children}
      </td>
    ),
    hr: ({ ...props }) => <hr className="mt-10 border-soft" {...props} />,
    ...components,
  };
}
