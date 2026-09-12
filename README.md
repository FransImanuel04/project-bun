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

Example request:

```json
{
	"name": "Frans",
	"email": "frans@localhost",
	"password": "rahasia"
}
```

A successful registration returns HTTP `201` with `{ "data": "OK" }`. An existing email returns HTTP `409` with `{ "error": "Email sudah terdaftar" }`.

## Database

Generate and apply Drizzle migrations after configuring `DATABASE_URL`:

```bash
bun run db:generate
bun run db:migrate
```

The `users` table stores the name, unique email, bcrypt password hash, and creation timestamp. Apply migrations after configuring `DATABASE_URL`.

## Validation

Run the TypeScript check with:

```bash
bun run typecheck
```