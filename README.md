# Project Bun

Backend project using Bun, ElysiaJS, Drizzle ORM, and MySQL.

## Prerequisites

- Bun
- MySQL

## Setup

Install dependencies:

```bash
bun install
```

Copy `.env.example` to `.env`, then adjust `DATABASE_URL` for the local MySQL instance.

## Development

```bash
bun run dev
```

The server runs on `http://localhost:3000` by default. The available initial endpoints are:

- `GET /` checks that the application is running.
- `GET /health` checks application and database availability.
- `POST /api/users` registers a new user and stores the password as a bcrypt hash.
- `POST /api/users/login` verifies credentials and creates a UUID session token.
- `GET /api/users/current` returns the user associated with a valid session token.

Example request:

```json
{
	"name": "Frans",
	"email": "frans@localhost",
	"password": "rahasia"
}
```

A successful registration returns HTTP `201` with `{ "data": "OK" }`. An existing email returns HTTP `409` with `{ "error": "Email sudah terdaftar" }`.

Login example:

```json
{
	"email": "frans@localhost",
	"password": "rahasia"
}
```

A successful login returns HTTP `200` with `{ "data": "token" }`. Invalid credentials return HTTP `401` with `{ "error": "Email atau password salah" }`.

Current user example:

```text
Authorization: Bearer <token>
```

The current-user endpoint returns HTTP `200` with the authenticated user's `id`, `name`, `email`, and `created_at`. Missing or invalid tokens return HTTP `401` with `{ "error": "Unathorized" }`.

## Database

Generate and apply Drizzle migrations after configuring `DATABASE_URL`:

```bash
bun run db:generate
bun run db:migrate
```

The `users` table stores the name, unique email, bcrypt password hash, and creation timestamp. The `sessions` table stores UUID login tokens associated with users. Apply migrations after configuring `DATABASE_URL`.

## Validation

Run the TypeScript check with:

```bash
bun run typecheck
```