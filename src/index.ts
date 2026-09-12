import { app } from './app';
import { env } from './config/env';

app.listen(env.port);

console.log(`Project Bun is running at ${app.server?.url}`);