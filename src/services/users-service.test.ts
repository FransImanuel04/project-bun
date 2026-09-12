import { compare } from 'bcryptjs';
import { describe, expect, test } from 'bun:test';

import { EmailAlreadyRegisteredError, InvalidCredentialsError, createUsersService } from './users-service';

describe('users service', () => {
  test('registers a user with a hashed password', async () => {
    const storedUsers: Array<{ name: string; email: string; password: string }> = [];
    const service = createUsersService({
      findByEmail: async (email) => {
        const user = storedUsers.find((storedUser) => storedUser.email === email);
        return user ? { id: 1, password: user.password } : null;
      },
      create: async (user) => {
        storedUsers.push(user);
      },
      createSession: async () => undefined,
    });

    await service.register({ name: ' Frans ', email: 'FRANS@LOCALHOST', password: 'rahasia' });

    expect(storedUsers).toHaveLength(1);
    expect(storedUsers[0]?.name).toBe('Frans');
    expect(storedUsers[0]?.email).toBe('frans@localhost');
    expect(storedUsers[0]?.password).not.toBe('rahasia');
    expect(await compare('rahasia', storedUsers[0]?.password ?? '')).toBe(true);
  });

  test('rejects a duplicate email', async () => {
    const service = createUsersService({
      findByEmail: async () => ({ id: 1, password: 'hash' }),
      create: async () => undefined,
      createSession: async () => undefined,
    });

    expect(service.register({ name: 'Frans', email: 'frans@localhost', password: 'rahasia' })).rejects.toBeInstanceOf(
      EmailAlreadyRegisteredError,
    );
  });

  test('logs in with valid credentials and stores a UUID session', async () => {
    const storedSessions: Array<{ token: string; userId: number }> = [];
    const service = createUsersService(
      {
        findByEmail: async () => ({ id: 7, password: 'stored-hash' }),
        create: async () => undefined,
        createSession: async (session) => {
          storedSessions.push(session);
        },
      },
      {
        comparePassword: async (password, passwordHash) => password === 'rahasia' && passwordHash === 'stored-hash',
        generateToken: () => '550e8400-e29b-41d4-a716-446655440000',
      },
    );

    const token = await service.login({ email: ' FRANS@LOCALHOST ', password: 'rahasia' });

    expect(token).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(storedSessions).toEqual([{ token, userId: 7 }]);
  });

  test('rejects unknown users with a generic credentials error', async () => {
    const service = createUsersService({
      findByEmail: async () => null,
      create: async () => undefined,
      createSession: async () => undefined,
    });

    expect(service.login({ email: 'unknown@localhost', password: 'rahasia' })).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });
});