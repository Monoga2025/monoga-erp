import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';

export const LOOPBACK_HOST = '127.0.0.1';
const DEFAULT_PORT = 3001;

export function resolvePort(value = process.env.PORT): number {
  if (value === undefined) {
    return DEFAULT_PORT;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer from 1 to 65535');
  }

  return port;
}

export async function startServer(app = buildApp()): Promise<FastifyInstance> {
  await app.listen({ host: LOOPBACK_HOST, port: resolvePort() });
  return app;
}

const isMainModule =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMainModule) {
  void startServer().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
