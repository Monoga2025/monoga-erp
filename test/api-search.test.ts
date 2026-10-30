import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { MetadataStore } from '../src/metadata-store.js';
import { YouTubeAdapter } from '../src/youtube-adapter.js';

const fixtureDirectories: string[] = [];

function createStore(): { store: MetadataStore; dbPath: string } {
  const dir = mkdtempSync(join(tmpdir(), 'monoga-erp-api-search-test-'));
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

describe('API-002 Catalog Search & Browse Endpoints', () => {
  it('GET /api/v1/search returns permission-filtered search results', async () => {
    const { store, dbPath } = createStore();
    const project = store.createProject({ name: 'Project Alpha' });
    const source = store.createSource({ name: 'YouTube Channel', projectId: project.id });
    store.setSourceAccess(source.id, 'METADATA_ONLY');

    const adapter = new YouTubeAdapter(store);
    adapter.ingestCase({
      sourceId: source.id,
      fixture: {
        nativeCaseId: 'yt-case-api-1',
        title: 'API Search Case',
        scriptContent: 'Video script content',
        rightsEvidence: 'Permission document',
        timedVoiceEvidence: '12 min audio',
      },
    });

    const app = buildApp({ dbPath });
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/search?q=yt-case-api',
      headers: { 'x-principal-kind': 'OWNER' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results[0].citation).toContain('yt-case-api-1');

    store.close();
    await app.close();
  });

  it('GET /api/v1/search returns empty results when access is revoked', async () => {
    const { store, dbPath } = createStore();
    const project = store.createProject({ name: 'Project Alpha' });
    const source = store.createSource({ name: 'YouTube Channel', projectId: project.id });
    store.setSourceAccess(source.id, 'METADATA_ONLY');

    const adapter = new YouTubeAdapter(store);
    adapter.ingestCase({
      sourceId: source.id,
      fixture: {
        nativeCaseId: 'yt-case-revoked-api',
        title: 'Revoked API Case',
        scriptContent: 'Script content',
        rightsEvidence: 'Rights OK',
        timedVoiceEvidence: 'Audio OK',
      },
    });

    // Revoke access
    store.setSourceAccess(source.id, 'DENIED');

    const app = buildApp({ dbPath });
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/search?q=yt-case-revoked',
      headers: { 'x-principal-kind': 'OWNER' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.results).toHaveLength(0);

    store.close();
    await app.close();
  });
});
