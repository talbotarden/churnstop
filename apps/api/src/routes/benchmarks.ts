import { Hono } from 'hono';

/**
 * Cross-customer benchmarks. Paid-tier plugins POST their anonymized save-rate
 * metrics here; in return they get back "you are in the top X percentile" data.
 * Phase 4 feature; stub only for now.
 */
export const benchmarkRoutes = new Hono();

benchmarkRoutes.post('/ingest', async (c) => {
  // TODO: accept anonymized metrics and store for percentile computation.
  return c.json({ ok: true });
});

benchmarkRoutes.get('/percentile', async (c) => {
  // TODO: return industry-median + requester's percentile.
  return c.json({
    industry_median_save_rate: 0.28,
    your_percentile: null,
  });
});
