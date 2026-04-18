/**
 * Shared Drizzle database client. Uses postgres.js under the hood with a
 * small connection pool (max 10) suitable for the API's expected request
 * volume. All route files should `import { db }` from here rather than
 * reinstantiating the client, so connection count stays bounded.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Set it in apps/api/.env.');
}

const client = postgres(connectionString, { max: 10, idle_timeout: 30 });

export const db = drizzle(client, { schema });
export { schema };
