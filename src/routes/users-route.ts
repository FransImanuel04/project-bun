import { Elysia, t } from 'elysia';

import { db } from '../db';
import {
  DatabaseUnavailableError,
  EmailAlreadyRegisteredError,
  createUsersService,
  type UsersService,
} from '../services/users-service';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const databaseUsersService = createUsersService({
  async findByEmail(email) {
    if (!db) {
      throw new DatabaseUnavailableError();
    }

    const result = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    return result.length > 0;
  },
  async create(user) {
    if (!db) {
      throw new DatabaseUnavailableError();
    }

    await db.insert(users).values(user);
  },
});

export function createUsersRoutes(usersService: UsersService) {
  return new Elysia().post(
    '/api/users',
    async ({ body, set }) => {
      try {
        await usersService.register(body);
        set.status = 201;
        return { data: 'OK' };
      } catch (error) {
        if (error instanceof EmailAlreadyRegisteredError) {
          set.status = 409;
          return { error: error.message };
        }

        if (error instanceof DatabaseUnavailableError) {
          set.status = 503;
          return { error: error.message };
        }

        set.status = 500;
        return { error: 'Terjadi kesalahan internal' };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
        email: t.String({ minLength: 3, maxLength: 255 }),
        password: t.String({ minLength: 6, maxLength: 255 }),
      }),
    },
  );
}

export const usersRoutes = createUsersRoutes(databaseUsersService);