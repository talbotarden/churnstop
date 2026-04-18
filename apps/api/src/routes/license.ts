import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

// Phase 1 only ships a WooCommerce plugin. We accept a `platform` field on the
// request body NOW so the contract is locked in: future Phase 2 platforms
// (stripe, paddle, recurly, chargebee, lemonsqueezy) will be added to this
// enum without breaking the wire format. Anything outside the enum is rejected
// at the schema layer with a 400.
//
// PLATFORM_ADAPTER: extend SUPPORTED_PLATFORMS when adding a new adapter under
// apps/api/src/adapters/.
const SUPPORTED_PLATFORMS = ['woocommerce'] as const;

const verifySchema = z.object({
  platform: z.enum(SUPPORTED_PLATFORMS, {
    errorMap: () => ({
      message: `unsupported_platform - phase 1 supports: ${SUPPORTED_PLATFORMS.join(', ')}`,
    }),
  }),
  key: z.string().min(10),
  site_url: z.string().url(),
});

export const licenseRoutes = new Hono();

licenseRoutes.post('/verify', zValidator('json', verifySchema), async (c) => {
  const { key } = c.req.valid('json');

  // TODO: look up key in licenses table, check status, bind to site_url
  // respecting the tier's site-activation cap.
  const ok = key.startsWith('CS-');

  if (!ok) {
    return c.json({ ok: false, error: 'Invalid license key' }, 400);
  }

  return c.json({
    ok: true,
    entitlements: {
      tier: 'growth',
      features: [
        'conditional_flows',
        'pause_offer',
        'discount_offer',
        'skip_renewal_offer',
        'tier_down_offer',
        'extend_trial_offer',
        'product_swap_offer',
        'analytics',
        'ab_testing',
        'winback',
      ],
      seats: 1,
      renews_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });
});

licenseRoutes.post('/entitlements', zValidator('json', verifySchema), async (c) => {
  // Same shape as verify; called every 12 hours from the plugin to refresh.
  return c.json({
    ok: true,
    entitlements: {
      tier: 'growth',
      features: [
        'conditional_flows',
        'pause_offer',
        'discount_offer',
        'skip_renewal_offer',
        'tier_down_offer',
        'analytics',
        'ab_testing',
        'winback',
      ],
    },
  });
});
