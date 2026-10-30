import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { LOOPBACK_HOST, resolvePort } from '../src/server.js';

describe('local application foundation', () => {
  it('returns a healthy response through the Fastify boundary', async () => {
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });

    await app.close();
  });

  it('uses loopback only and accepts a valid local port', () => {
    expect(LOOPBACK_HOST).toBe('127.0.0.1');
    expect(resolvePort('4310')).toBe(4310);
    expect(() => resolvePort('0.0.0.0')).toThrow('PORT must be an integer from 1 to 65535');
  });
});
