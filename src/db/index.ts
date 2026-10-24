import pg from 'pg';
import { config } from '../config/env.js';

const { Pool } = pg;

export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err.message);
});

export const query = async <T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> => {
  try {
    return await pool.query<T>(text, params);
  } catch (err: any) {
    console.error('Database query error:', {
      query: text,
      message: err.message,
      code: err.code,
    });

    const error: any = new Error();

    // Map common PostgreSQL error codes to client-friendly errors
    if (err.code === '23505') {
      // Unique violation
      error.status = 409;
      error.message = err.detail || 'A record with this information already exists';
    } else if (err.code === '23503') {
      // Foreign key violation
      error.status = 400;
      error.message = err.detail || 'Referenced record does not exist';
    } else if (err.code === '22P02') {
      // Invalid text representation (e.g., bad UUID or integer)
      error.status = 400;
      error.message = 'Invalid input format';
    } else if (err.code === 'ECONNREFUSED' || err.code === '57P01') {
      // Database connection down
      error.status = 503;
      error.message = 'Database service is currently unavailable';
    } else {
      error.status = 500;
      error.message = err.message || 'Database operation failed';
    }

    throw error;
  }
};
