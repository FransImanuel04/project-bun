import { Elysia } from 'elysia';

import { checkDatabaseConnection } from '../db';

export const healthRoutes = new Elysia().get('/health', async ({ set }) => {
  try {
    const databaseConfigured = await checkDatabaseConnection();

    return {
      status: 'ok',
      database: databaseConfigured ? 'connected' : 'not_configured',
    };
  } catch {
    set.status = 503;

    return {
      status: 'degraded',
      database: 'unavailable',
    };
  }
});