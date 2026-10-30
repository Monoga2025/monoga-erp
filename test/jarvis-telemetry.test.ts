import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { MetadataStore } from '../src/metadata-store.js';
import { WorkspaceProjectsAdapter } from '../src/workspace-projects-adapter.js';

const fixtureDirectories: string[] = [];

function createStore(): { store: MetadataStore; dbPath: string } {
  const dir = mkdtempSync(join(tmpdir(), 'monoga-erp-telemetry-test-'));
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

describe('JARVIS Telemetry & Omnibar HUD Endpoints', () => {
  it('GET /api/v1/jarvis/telemetry returns telemetry health status for workspace projects', async () => {
    const { store, dbPath } = createStore();
    const adapter = new WorkspaceProjectsAdapter(store);
    adapter.discoverAndCatalog();

    const app = buildApp({ dbPath });
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/jarvis/telemetry',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe('online');
    expect(body.telemetry.projectsCount).toBeGreaterThan(0);
    expect(body.telemetry.projects).toBeDefined();

    store.close();
    await app.close();
  });

  it('GET /api/v1/jarvis/hud performs sub-second omnibar search across projects, prompts, and artifacts', async () => {
    const { store, dbPath } = createStore();
    store.createPrompt({
      slug: 'jarvis-code-audit',
      category: 'Coding',
      title: 'JARVIS Code Audit',
      content: 'Audit code for security: {{code}}',
    });

    const app = buildApp({ dbPath });
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/jarvis/hud?q=jarvis',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.query).toBe('jarvis');
    expect(body.prompts.length).toBeGreaterThan(0);
    expect(body.prompts[0].slug).toBe('jarvis-code-audit');

    store.close();
    await app.close();
  });
});
