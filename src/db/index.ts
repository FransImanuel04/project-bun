import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

import { env } from '../config/env';

const pool = env.databaseUrl ? mysql.createPool(env.databaseUrl) : undefined;

export const db = pool ? drizzle(pool) : undefined;

export async function checkDatabaseConnection() {
  if (!pool) {
    return false;
  }

  await pool.query('SELECT 1');
  return true;
}