import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { MetadataStore } from '../src/metadata-store.js';

const fixtureDirectories: string[] = [];

function createStore(): { store: MetadataStore; dbPath: string } {
  const dir = mkdtempSync(join(tmpdir(), 'monoga-erp-ui-e2e-test-'));
  fixtureDirectories.push(dir);
  const dbPath = join(dir, 'metadata.sqlite');
  const store = new MetadataStore(dbPath);
  return { store, dbPath };
}

afterEach(() => {
  while (fixtureDirectories.length > 0) {
    const dir = fixtureDirectories.pop()!;
    try {
      rmSync(dir, { force: true, recursive: true });
    } catch {
      // ignore
    }
  }
});

describe('Web UI E2E Integration', () => {
  it('serves static HTML index page and API endpoints through Fastify loopback server', async () => {
    const { store, dbPath } = createStore();
    const app = buildApp({ dbPath });

    const htmlResponse = await app.inject({ method: 'GET', url: '/' });
    expect(htmlResponse.statusCode).toBe(200);
    expect(htmlResponse.headers['content-type']).toContain('text/html');
    expect(htmlResponse.body).toContain('<div id="root"></div>');
    expect(htmlResponse.body).toContain('Monoga ERP');

    const apiResponse = await app.inject({ method: 'GET', url: '/api/v1/home' });
    expect(apiResponse.statusCode).toBe(200);
    expect(apiResponse.json().status).toBe('ok');

    store.close();
    await app.close();
  });
});
