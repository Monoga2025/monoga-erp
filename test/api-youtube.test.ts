import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { MetadataStore } from '../src/metadata-store.js';

const fixtureDirectories: string[] = [];

function createStore(): { store: MetadataStore; dbPath: string } {
  const dir = mkdtempSync(join(tmpdir(), 'monoga-erp-api-yt-test-'));
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

describe('API-003 YouTube Cases REST Endpoints', () => {
  it('POST /api/v1/youtube/cases catalogs a case and returns readiness & blockers', async () => {
    const { store, dbPath } = createStore();
    const project = store.createProject({ name: 'Project Alpha' });
    const source = store.createSource({ name: 'YouTube Channel', projectId: project.id });
    store.setSourceAccess(source.id, 'METADATA_ONLY');

    const app = buildApp({ dbPath });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/youtube/cases',
      payload: {
        sourceId: source.id,
        fixture: {
          nativeCaseId: 'yt-case-api-003',
          title: 'YouTube REST Case',
          scriptContent: 'Video script content',
          rightsEvidence: 'Permission verified',
          timedVoiceEvidence: '15 min audio',
        },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.case.readiness).toBe('READY');
    expect(body.case.blockers).toHaveLength(0);
    expect(body.case.citations).toHaveLength(3);

    store.close();
    await app.close();
  });

  it('POST /api/v1/youtube/cases identifies missing evidence as blockers', async () => {
    const { store, dbPath } = createStore();
    const project = store.createProject({ name: 'Project Alpha' });
    const source = store.createSource({ name: 'YouTube Channel', projectId: project.id });
    store.setSourceAccess(source.id, 'METADATA_ONLY');

    const app = buildApp({ dbPath });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/youtube/cases',
      payload: {
        sourceId: source.id,
        fixture: {
          nativeCaseId: 'yt-case-incomplete-003',
          title: 'Incomplete Case',
          scriptContent: 'Script without rights or voice',
        },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.case.readiness).toBe('BLOCKED');
    expect(body.case.blockers).toContain('RIGHTS_EVIDENCE_MISSING');
    expect(body.case.blockers).toContain('TIMED_VOICE_EVIDENCE_MISSING');

    store.close();
    await app.close();
  });
});
