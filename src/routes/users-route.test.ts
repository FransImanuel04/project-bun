import { describe, expect, test } from 'bun:test';

import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  UnauthorizedError,
  type UsersService,
} from '../services/users-service';
import { createUsersRoutes } from './users-route';

function createTestApp(service: UsersService) {
  return createUsersRoutes(service);
}

describe('users routes', () => {
  test('returns 201 for a valid registration', async () => {
    const service: UsersService = {
      register: async () => undefined,
      login: async () => 'token',
      getCurrentUser: async () => ({ id: 1, name: 'Frans', email: 'frans@localhost', createdAt: 'timestamp' }),
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
      getCurrentUser: async () => ({ id: 1, name: 'Frans', email: 'frans@localhost', createdAt: 'timestamp' }),
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
      getCurrentUser: async () => ({ id: 1, name: 'Frans', email: 'frans@localhost', createdAt: 'timestamp' }),
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
      getCurrentUser: async () => ({ id: 1, name: 'Frans', email: 'frans@localhost', createdAt: 'timestamp' }),
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
      getCurrentUser: async () => ({ id: 1, name: 'Frans', email: 'frans@localhost', createdAt: 'timestamp' }),
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

  test('returns the current user without exposing the password', async () => {
    const service: UsersService = {
      register: async () => undefined,
      login: async () => 'token',
      getCurrentUser: async (token) => {
        expect(token).toBe('valid-token');
        return { id: 1, name: 'Frans', email: 'frans@localhost', createdAt: 'timestamp' };
      },
    };

    const response = await createTestApp(service).handle(
      new Request('http://localhost/api/users/current', {
        headers: { authorization: 'Bearer valid-token' },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: { id: 1, name: 'Frans', email: 'frans@localhost', created_at: 'timestamp' },
    });
  });

  test('returns unauthorized for a missing or malformed token', async () => {
    const service: UsersService = {
      register: async () => undefined,
      login: async () => 'token',
      getCurrentUser: async () => {
        throw new UnauthorizedError();
      },
    };
    const app = createTestApp(service);

    const missingHeader = await app.handle(new Request('http://localhost/api/users/current'));
    const malformedHeader = await app.handle(
      new Request('http://localhost/api/users/current', { headers: { authorization: 'Token invalid' } }),
    );

    expect(missingHeader.status).toBe(401);
    expect(await missingHeader.json()).toEqual({ error: 'Unathorized' });
    expect(malformedHeader.status).toBe(401);
    expect(await malformedHeader.json()).toEqual({ error: 'Unathorized' });
  });

  test('returns unauthorized when the session token is unknown', async () => {
    const service: UsersService = {
      register: async () => undefined,
      login: async () => 'token',
      getCurrentUser: async () => {
        throw new UnauthorizedError();
      },
    };

    const response = await createTestApp(service).handle(
      new Request('http://localhost/api/users/current', {
        headers: { authorization: 'Bearer unknown-token' },
      }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unathorized' });
  });
});