export const site = {
  name: 'ChurnStop',
  domain: 'churnstop.org',
  url: 'https://churnstop.org',
  description:
    'Cancellation save flow for WooCommerce Subscriptions. Intercept cancel clicks with conditional offers, stay click-to-cancel compliant, report MRR preserved.',
  pluginZip: '/downloads/churnstop.zip',
  nav: [
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/click-to-cancel', label: 'Click to Cancel' },
    { href: '/for', label: 'By vertical' },
    { href: '/docs', label: 'Docs' },
    { href: '/blog', label: 'Blog' },
  ],
  ctas: {
    installFree: {
      label: 'Install the free plugin',
      href: '/downloads/churnstop.zip',
    },
    startTrial: {
      // Label is "See pricing" rather than "Start 14-day trial" because the
      // paid tier checkout flow is not yet live. /pricing now carries a
      // #waitlist section the button lands on.
      label: 'See pricing',
      href: '/pricing',
    },
  },
};
