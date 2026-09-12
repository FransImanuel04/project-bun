import { describe, expect, test } from 'bun:test';

import { EmailAlreadyRegisteredError, InvalidCredentialsError, type UsersService } from '../services/users-service';
import { createUsersRoutes } from './users-route';

function createTestApp(service: UsersService) {
  return createUsersRoutes(service);
}

describe('users routes', () => {
  test('returns 201 for a valid registration', async () => {
    const service: UsersService = {
      register: async () => undefined,
      login: async () => 'token',
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
      login: async () => 'token',
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
      login: async () => 'token',
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

  test('returns a session token for valid login', async () => {
    const service: UsersService = {
      register: async () => undefined,
      login: async () => '550e8400-e29b-41d4-a716-446655440000',
    };

    const response = await createTestApp(service).handle(
      new Request('http://localhost/api/users/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'frans@localhost', password: 'rahasia' }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: '550e8400-e29b-41d4-a716-446655440000' });
  });

  test('returns a generic 401 response for invalid credentials', async () => {
    const service: UsersService = {
      register: async () => undefined,
      login: async () => {
        throw new InvalidCredentialsError();
      },
    };

    const response = await createTestApp(service).handle(
      new Request('http://localhost/api/users/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'frans@localhost', password: 'wrongpass' }),
      }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Email atau password salah' });
  });
});