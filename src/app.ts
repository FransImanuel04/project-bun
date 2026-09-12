import { Elysia } from 'elysia';

import { healthRoutes } from './routes/health';
import { usersRoutes } from './routes/users-route';

export const app = new Elysia()
  .get('/', () => ({
    name: 'project-bun',
    status: 'running',
  }))
  .use(healthRoutes)
  .use(usersRoutes);