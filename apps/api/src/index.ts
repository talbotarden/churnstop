import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

import { licenseRoutes } from './routes/license.js';
import { benchmarkRoutes } from './routes/benchmarks.js';
import { winbackRoutes } from './routes/winback.js';
import { checkoutRoutes } from './routes/checkout.js';
import { stripeWebhookRoutes } from './routes/webhooks/stripe.js';

const app = new Hono();

app.use('*', logger());

// CORS: browser-callable routes (/checkout POST from the portal) need a
// permissive CORS posture; the Stripe webhook is server-to-server so CORS
// is irrelevant. Keep the allowlist narrow - only the portal origins.
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return 'https://churnstop.org';
      const allow = ['https://churnstop.org', 'https://www.churnstop.org'];
      if (allow.includes(origin)) return origin;
      // Local dev on :3040.
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return origin;
      }
      return 'https://churnstop.org';
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Stripe-Signature'],
    maxAge: 600,
  }),
);

app.get('/', (c) => c.json({ ok: true, service: 'churnstop-api', version: '0.1.0' }));
app.get('/healthz', (c) => c.json({ ok: true }));

app.route('/license', licenseRoutes);
app.route('/benchmarks', benchmarkRoutes);
app.route('/winback', winbackRoutes);
app.route('/checkout', checkoutRoutes);
app.route('/webhooks/stripe', stripeWebhookRoutes);

const port = Number(process.env.PORT ?? 8787);

serve({ fetch: app.fetch, port }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`churnstop-api listening on :${info.port}`);
});
