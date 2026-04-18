import { Hono } from 'hono';

/**
 * Outbound winback email delivery. Merchants that don't want to run transactional
 * email themselves can delegate sending to us. Stub only for now.
 */
export const winbackRoutes = new Hono();

winbackRoutes.post('/enqueue', async (c) => {
  // TODO: accept a send job and queue it.
  return c.json({ ok: true, job_id: 'stub' });
});
