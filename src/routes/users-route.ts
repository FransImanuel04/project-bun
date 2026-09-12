import { Elysia, t } from 'elysia';

import { db } from '../db';
import {
  DatabaseUnavailableError,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  UnauthorizedError,
  createUsersService,
  type UsersService,
} from '../services/users-service';
import { sessions, users } from '../db/schema';
import { eq } from 'drizzle-orm';

const databaseUsersService = createUsersService({
  async findByEmail(email) {
    if (!db) {
      throw new DatabaseUnavailableError();
    }

    const result = await db.select({ id: users.id, password: users.password }).from(users).where(eq(users.email, email)).limit(1);
    return result[0] ?? null;
  },
  async create(user) {
    if (!db) {
      throw new DatabaseUnavailableError();
    }

    await db.insert(users).values(user);
  },
  async createSession(session) {
    if (!db) {
      throw new DatabaseUnavailableError();
    }

    await db.insert(sessions).values(session);
  },
  async findCurrentUserByToken(token) {
    if (!db) {
      throw new DatabaseUnavailableError();
    }

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1);

    return result[0] ?? null;
  },
});

function parseBearerToken(authorization: string | undefined) {
  if (!authorization) {
    return null;
  }

  const parts = authorization.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer' || !parts[1]) {
    return null;
  }

  return parts[1];
}

export function createUsersRoutes(usersService: UsersService) {
  return new Elysia().get('/api/users/current', async ({ headers, set }) => {
    const token = parseBearerToken(headers.authorization);

    if (!token) {
      set.status = 401;
      return { error: 'Unathorized' };
    }

    try {
      const user = await usersService.getCurrentUser(token);
      return {
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.createdAt,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        set.status = 401;
        return { error: error.message };
      }

      if (error instanceof DatabaseUnavailableError) {
        set.status = 503;
        return { error: error.message };
      }

      set.status = 500;
      return { error: 'Terjadi kesalahan internal' };
    }
  }).post(
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
  ).post(
    '/api/users/login',
    async ({ body, set }) => {
      try {
        const token = await usersService.login(body);
        return { data: token };
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          set.status = 401;
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
        email: t.String({ minLength: 3, maxLength: 255 }),
        password: t.String({ minLength: 1, maxLength: 255 }),
      }),
    },
  );
}

export const usersRoutes = createUsersRoutes(databaseUsersService);