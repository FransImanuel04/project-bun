import { compare } from 'bcryptjs';
import { describe, expect, test } from 'bun:test';

import { EmailAlreadyRegisteredError, createUsersService } from './users-service';

describe('users service', () => {
  test('registers a user with a hashed password', async () => {
    const storedUsers: Array<{ name: string; email: string; password: string }> = [];
    const service = createUsersService({
      findByEmail: async (email) => storedUsers.some((user) => user.email === email),
      create: async (user) => {
        storedUsers.push(user);
      },
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
      findByEmail: async () => true,
      create: async () => undefined,
    });

    expect(service.register({ name: 'Frans', email: 'frans@localhost', password: 'rahasia' })).rejects.toBeInstanceOf(
      EmailAlreadyRegisteredError,
    );
  });
});