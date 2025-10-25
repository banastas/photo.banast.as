// Database adapter - switches between PostgreSQL and D1 based on environment

import type { Primitive } from './postgres';

// Check if we're using D1 (Cloudflare) or PostgreSQL (Vercel/other)
const USE_D1 = process.env.USE_D1 === 'true' ||
               process.env.CLOUDFLARE === 'true' ||
               typeof (globalThis as any).DB !== 'undefined';

// Import the appropriate adapter
const dbAdapter = USE_D1
  ? require('./d1')
  : require('./postgres');

export const query = dbAdapter.query;
export const sql = dbAdapter.sql;
export const testDatabaseConnection = dbAdapter.testDatabaseConnection;

// Re-export types
export type { Primitive };
export type { QueryResult } from './postgres';

// Export D1-specific functions if using D1
export const setD1Database = USE_D1 ? dbAdapter.setD1Database : undefined;
export const getD1Database = USE_D1 ? dbAdapter.getD1Database : undefined;

console.log(`[Database] Using ${USE_D1 ? 'Cloudflare D1 (SQLite)' : 'PostgreSQL'}`);
