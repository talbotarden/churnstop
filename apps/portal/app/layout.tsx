import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { JsonLd } from '@/components/json-ld';
import { organizationSchema } from '@/lib/schema/organization';
import { websiteSchema } from '@/lib/schema/website';
import { site } from '@/lib/site';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'ChurnStop - Cancellation Save Flow for WooCommerce Subscriptions',
    template: '%s - ChurnStop',
  },
  description: site.description,
  openGraph: {
    title: 'ChurnStop - Cancellation Save Flow for WooCommerce Subscriptions',
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChurnStop - Cancellation Save Flow for WooCommerce Subscriptions',
    description: site.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <head>
        <link rel="alternate" type="text/markdown" href="/llms.txt" />
        <JsonLd id="ld-organization" schema={organizationSchema} />
        <JsonLd id="ld-website" schema={websiteSchema} />
      </head>
      <body className="font-sans antialiased">
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
