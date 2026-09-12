const port = Number(Bun.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port.');
}

export const env = {
  port,
  databaseUrl: Bun.env.DATABASE_URL,
};