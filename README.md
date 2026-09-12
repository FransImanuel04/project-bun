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

## Database

Generate and apply Drizzle migrations after configuring `DATABASE_URL`:

```bash
bun run db:generate
bun run db:migrate
```

The initial schema contains a `users` table as a starting point for future development.

## Validation

Run the TypeScript check with:

```bash
bun run typecheck
```