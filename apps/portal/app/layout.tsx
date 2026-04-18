import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ChurnStop - Cancellation Save Flow for WooCommerce Subscriptions',
  description:
    'Intercept WooCommerce Subscriptions cancellations with targeted save offers. Click-to-cancel compliant. Reduce churn, preserve MRR.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
