import { describe, expect, test } from 'bun:test';

import { EmailAlreadyRegisteredError, type UsersService } from '../services/users-service';
import { createUsersRoutes } from './users-route';

function createTestApp(service: UsersService) {
  return createUsersRoutes(service);
}

describe('users routes', () => {
  test('returns 201 for a valid registration', async () => {
    const service: UsersService = {
      register: async () => undefined,
    };

    const response = await createTestApp(service).handle(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Frans', email: 'frans@localhost', password: 'rahasia' }),
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ data: 'OK' });
  });

  test('returns 409 when the email already exists', async () => {
    const service: UsersService = {
      register: async () => {
        throw new EmailAlreadyRegisteredError();
      },
    };

    const response = await createTestApp(service).handle(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Frans', email: 'frans@localhost', password: 'rahasia' }),
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'Email sudah terdaftar' });
  });

  test('rejects a short password', async () => {
    const service: UsersService = {
      register: async () => undefined,
    };

    const response = await createTestApp(service).handle(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Frans', email: 'frans@localhost', password: 'short' }),
      }),
    );

    expect(response.status).toBe(422);
  });
});