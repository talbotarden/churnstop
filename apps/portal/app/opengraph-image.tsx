import { ImageResponse } from 'next/og';

// Site-wide default Open Graph / Twitter image. Next.js generates this at
// build time and serves it at /opengraph-image for any page that does not
// override it. Size matches the OG spec default (1.91:1, 1200x630).

export const runtime = 'edge';
export const alt = 'ChurnStop - Cancellation save flow for WooCommerce Subscriptions';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          background: '#0A0A0A',
          color: '#FAFAFA',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 22,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: '#71717A',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#0B6E4F',
              color: '#FFFFFF',
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            {'C'}
          </div>
          <div style={{ color: '#FAFAFA', fontSize: 24, letterSpacing: -0.2, textTransform: 'none', fontWeight: 600 }}>
            ChurnStop
          </div>
          <div style={{ flex: 1 }} />
          <div>For WooCommerce Subscriptions</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              fontSize: 84,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              fontWeight: 600,
              maxWidth: 960,
            }}
          >
            Stop losing subscribers at the cancel button.
          </div>
          <div style={{ fontSize: 28, color: '#A1A1AA', maxWidth: 900, lineHeight: 1.35 }}>
            Conditional save offers on native WooCommerce Subscriptions APIs. FTC click-to-cancel compliant by default. Reports every dollar of MRR preserved.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 28, fontSize: 20, color: '#71717A' }}>
            <div>churnstop.org</div>
            <div>GPL-2.0</div>
            <div>WC Subs 4.0+</div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 22,
              color: '#0B6E4F',
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: '#0B6E4F',
              }}
            />
            MRR preserved
          </div>
        </div>
      </div>
    ),
    size,
  );
}
