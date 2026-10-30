import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { MetadataStore } from '../src/metadata-store.js';

const fixtureDirectories: string[] = [];

function createStore(): { store: MetadataStore; dbPath: string } {
  const dir = mkdtempSync(join(tmpdir(), 'monoga-erp-api-test-'));
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
      // ignore open handles
    }
  }
});

describe('API-001 Projects and Sources REST Endpoints', () => {
  it('GET /api/v1/projects returns all registered projects', async () => {
    const { store, dbPath } = createStore();
    store.createProject({ name: 'Project Alpha' });
    store.createProject({ name: 'Project Beta' });

    const app = buildApp({ dbPath });
    const response = await app.inject({ method: 'GET', url: '/api/v1/projects' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.projects).toHaveLength(2);
    expect(body.projects.map((p: { name: string }) => p.name)).toContain('Project Alpha');

    store.close();
    await app.close();
  });

  it('GET /api/v1/sources returns all registered sources with activation status', async () => {
    const { store, dbPath } = createStore();
    const project = store.createProject({ name: 'Project Alpha' });
    store.createSource({ name: 'YouTube Source', projectId: project.id });

    const app = buildApp({ dbPath });
    const response = await app.inject({ method: 'GET', url: '/api/v1/sources' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.sources).toHaveLength(1);
    expect(body.sources[0].access).toBe('DENIED');

    store.close();
    await app.close();
  });

  it('POST /api/v1/sources/:sourceId/activation-requests updates source access', async () => {
    const { store, dbPath } = createStore();
    const project = store.createProject({ name: 'Project Alpha' });
    const source = store.createSource({ name: 'YouTube Source', projectId: project.id });

    const app = buildApp({ dbPath });
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/sources/${source.id}/activation-requests`,
      payload: { access: 'METADATA_ONLY' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.source.access).toBe('METADATA_ONLY');

    store.close();
    await app.close();
  });
});
