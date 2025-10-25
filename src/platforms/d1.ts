// Cloudflare D1 database adapter
// This file provides the same interface as postgres.ts but uses D1 (SQLite)

import type { D1Database, D1Result } from '@cloudflare/workers-types';

export type Primitive = string | number | boolean | undefined | null;

// Get D1 database from Cloudflare bindings
// This will be available in production via wrangler bindings
// For local dev, we'll use a mock or local D1
let db: D1Database | null = null;

export const setD1Database = (database: D1Database) => {
  db = database;
};

export const getD1Database = (): D1Database => {
  if (!db) {
    // In Next.js edge runtime, get from process.env
    if (typeof process !== 'undefined' && (process as any).env?.DB) {
      db = (process as any).env.DB;
    } else {
      throw new Error(
        'D1 database not initialized. Call setD1Database() first.',
      );
    }
  }
  return db;
};

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

// Convert PostgreSQL parameterized query ($1, $2) to SQLite (?, ?)
const convertQueryToSQLite = (
  queryString: string,
  values: Primitive[],
): { query: string, values: Primitive[] } => {
  let converted = queryString;
  const convertedValues = [...values];

  // Handle PostgreSQL ANY(array) syntax for tags
  // PostgreSQL: WHERE ?=ANY(tags) becomes SQLite JSON search
  // Tags are stored as JSON array in SQLite
  const anyMatch = /\?\s*=\s*ANY\s*\(\s*(\w+)\s*\)/gi;
  let anyMatchResult;
  let valueOffset = 0;

  while ((anyMatchResult = anyMatch.exec(queryString)) !== null) {
    const columnName = anyMatchResult[1];

    // Replace with JSON search - SQLite json_each
    const replacement =
      'EXISTS (SELECT 1 FROM json_each(' + columnName + ') ' +
      'WHERE json_each.value = ?)';
    converted = converted.replace(anyMatchResult[0], replacement);
  }

  // Replace PostgreSQL-specific syntax with SQLite equivalents
  converted = converted
    // Replace $1, $2, etc. with ?
    .replace(/\$\d+/g, '?')
    // Replace ILIKE with LIKE (SQLite is case-insensitive)
    .replace(/ILIKE/gi, 'LIKE')
    // Replace CONCAT with || operator
    .replace(/CONCAT\((.*?)\)/g, (_, args) =>
      args.replace(/,\s*/g, ' || '))
    // Replace EXTRACT(YEAR FROM field) with strftime
    .replace(
      /EXTRACT\s*\(\s*YEAR\s+FROM\s+(\w+)\s*\)/gi,
      'CAST(strftime(\'%Y\', $1) AS INTEGER)',
    )
    // Replace PostgreSQL INTERVAL with SQLite datetime
    .replace(
      /\(now\(\) - INTERVAL '(\d+) days'\)/gi,
      'datetime(\'now\', \'-$1 days\')',
    )
    .replace(
      /\(SELECT MAX\((.*?)\) - INTERVAL '(\d+) days' FROM (.*?)\)/gi,
      'datetime((SELECT MAX($1) FROM $3), \'-$2 days\')',
    )
    // Replace REGEXP_REPLACE (doesn't exist in SQLite)
    .replace(/REGEXP_REPLACE\s*\([^)]+\)/gi, (match) => {
      const fieldMatch = match.match(
        /REGEXP_REPLACE\s*\(\s*REGEXP_REPLACE\s*\([^,]+,\s*([^,)]+)/,
      );
      return fieldMatch ? fieldMatch[1].trim() : match;
    })
    // Replace NOW() with datetime('now')
    .replace(/NOW\(\)/gi, 'datetime(\'now\')')
    // Replace IS NOT TRUE with != 1 (SQLite uses integers for booleans)
    .replace(/(\w+)\s+IS NOT TRUE/gi, '($1 IS NULL OR $1 != 1)')
    .replace(/(\w+)\s+IS TRUE/gi, '$1 = 1')
    .replace(/IS NOT FALSE/gi, '!= 0')
    .replace(/IS FALSE/gi, '= 0')
    // Handle BOOLEAN DEFAULT FALSE
    .replace(/BOOLEAN DEFAULT FALSE/gi, 'INTEGER DEFAULT 0')
    .replace(/BOOLEAN/gi, 'INTEGER');

  return { query: converted, values: convertedValues };
};

export const query = async <T = any>(
  queryString: string,
  values: Primitive[] = [],
): Promise<QueryResult<T>> => {
  const database = getD1Database();

  try {
    // Convert PostgreSQL query to SQLite
    const { query: sqliteQuery, values: convertedValues } =
      convertQueryToSQLite(queryString, values);

    // D1 uses ? for parameters, and we've already converted
    // Filter out undefined values
    const cleanValues = convertedValues.map(v =>
      v === undefined ? null : v);

    // Execute query
    const statement = database.prepare(sqliteQuery);
    const result: D1Result<T> = await statement.bind(...cleanValues).all();

    return {
      rows: result.results || [],
      rowCount: result.results?.length || 0,
    };
  } catch (error) {
    console.error('D1 Query Error:', error);
    console.error('Query:', queryString);
    console.error('Values:', values);
    throw error;
  }
};

export const sql = <T = any>(
  strings: TemplateStringsArray,
  ...values: Primitive[]
): Promise<QueryResult<T>> => {
  if (!isTemplateStringsArray(strings) || !Array.isArray(values)) {
    throw new Error('Invalid template literal argument');
  }

  let result = strings[0] ?? '';

  for (let i = 1; i < strings.length; i++) {
    result += `$${i}${strings[i] ?? ''}`;
  }

  return query<T>(result, values);
};

const isTemplateStringsArray = (
  strings: unknown,
): strings is TemplateStringsArray => {
  return (
    Array.isArray(strings) && 'raw' in strings && Array.isArray(strings.raw)
  );
};

export const testDatabaseConnection = async () => {
  try {
    await query('SELECT 1 as test');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};
