import { Elysia } from 'elysia';

import { healthRoutes } from './routes/health';

export const app = new Elysia()
  .get('/', () => ({
    name: 'project-bun',
    status: 'running',
  }))
  .use(healthRoutes);