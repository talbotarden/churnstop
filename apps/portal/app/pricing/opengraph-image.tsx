import { ImageResponse } from 'next/og';

// Pricing-specific OG card. Shows the four tier prices at a glance so a
// link preview in Slack or Twitter answers the "what does it cost" question
// without the user having to click through.

export const runtime = 'edge';
export const alt = 'ChurnStop pricing - free to $399/month, 14-day trial';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const tiers = [
  { name: 'Free', price: '$0', sub: 'wordpress.org' },
  { name: 'Starter', price: '$79', sub: 'up to $10k MRR' },
  { name: 'Growth', price: '$199', sub: 'up to $50k MRR' },
  { name: 'Agency', price: '$399', sub: 'unlimited' },
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          background: '#FAFAFA',
          color: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 20,
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
              width: 38,
              height: 38,
              borderRadius: 9,
              background: '#0B6E4F',
              color: '#FFFFFF',
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {'C'}
          </div>
          <div style={{ color: '#0A0A0A', fontSize: 22, letterSpacing: -0.2, textTransform: 'none', fontWeight: 600 }}>
            ChurnStop
          </div>
          <div style={{ flex: 1 }} />
          <div>Pricing</div>
        </div>

        <div
          style={{
            fontSize: 62,
            lineHeight: 1.05,
            letterSpacing: -1.3,
            fontWeight: 600,
            maxWidth: 980,
          }}
        >
          Four tiers. Free to $399/month. 14-day trial.
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          {tiers.map((t) => (
            <div
              key={t.name}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid #D4D4D8',
                borderRadius: 18,
                background: '#FFFFFF',
                padding: '28px 24px',
                minHeight: 180,
              }}
            >
              <div style={{ fontSize: 22, color: '#52525B', fontWeight: 500 }}>{t.name}</div>
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 700,
                  letterSpacing: -1,
                  color: '#0A0A0A',
                }}
              >
                {t.price}
              </div>
              <div style={{ fontSize: 18, color: '#71717A' }}>{t.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 20, color: '#71717A' }}>
          <div>churnstop.org/pricing</div>
          <div>Save 20% billed annually</div>
        </div>
      </div>
    ),
    size,
  );
}
