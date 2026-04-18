import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { licenseRoutes } from './routes/license.js';
import { benchmarkRoutes } from './routes/benchmarks.js';
import { winbackRoutes } from './routes/winback.js';

const app = new Hono();

app.use('*', logger());
app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST'], maxAge: 600 }));

app.get('/', (c) => c.json({ ok: true, service: 'churnstop-api', version: '0.1.0' }));
app.get('/healthz', (c) => c.json({ ok: true }));

app.route('/license', licenseRoutes);
app.route('/benchmarks', benchmarkRoutes);
app.route('/winback', winbackRoutes);

const port = Number(process.env.PORT ?? 8787);

serve({ fetch: app.fetch, port }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`churnstop-api listening on :${info.port}`);
});
