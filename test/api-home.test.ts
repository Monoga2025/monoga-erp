import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { MetadataStore } from '../src/metadata-store.js';
import { YouTubeAdapter } from '../src/youtube-adapter.js';

const fixtureDirectories: string[] = [];

function createStore(): { store: MetadataStore; dbPath: string } {
  const dir = mkdtempSync(join(tmpdir(), 'monoga-erp-api-home-test-'));
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

describe('API-004 Home Dashboard REST Endpoint', () => {
  it('GET /api/v1/home returns aggregated status, active sources, and recent evidence', async () => {
    const { store, dbPath } = createStore();
    const project = store.createProject({ name: 'Project Alpha' });
    const source1 = store.createSource({ name: 'YouTube Source 1', projectId: project.id });
    const source2 = store.createSource({ name: 'YouTube Source 2', projectId: project.id });

    store.setSourceAccess(source1.id, 'METADATA_ONLY'); // Active
    // source2 remains DENIED

    const adapter = new YouTubeAdapter(store);
    adapter.ingestCase({
      sourceId: source1.id,
      fixture: {
        nativeCaseId: 'yt-home-case-1',
        title: 'Home Test Case',
        scriptContent: 'Script content',
        rightsEvidence: 'Rights OK',
        timedVoiceEvidence: 'Voice OK',
      },
    });

    const app = buildApp({ dbPath });
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/home',
      headers: { 'x-principal-kind': 'OWNER' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe('ok');
    expect(body.summary.totalProjects).toBe(1);
    expect(body.summary.totalSources).toBe(2);
    expect(body.summary.activeSources).toBe(1);
    expect(body.summary.deniedSources).toBe(1);
    expect(body.recentArtifacts.length).toBeGreaterThan(0);

    store.close();
    await app.close();
  });
});
