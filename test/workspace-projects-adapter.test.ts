import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { MetadataStore } from '../src/metadata-store.js';
import { WorkspaceProjectsAdapter } from '../src/workspace-projects-adapter.js';

const fixtureDirectories: string[] = [];

function createStore(): MetadataStore {
  const dir = mkdtempSync(join(tmpdir(), 'monoga-erp-ws-test-'));
  fixtureDirectories.push(dir);
  return new MetadataStore(join(dir, 'metadata.sqlite'));
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

describe('JARVIS-002 Workspace Projects Discovery & Catalog Adapter', () => {
  it('scans workspace directories, indexes active projects, and excludes archived folders', () => {
    const store = createStore();
    const mockWorkspace = mkdtempSync(join(tmpdir(), 'mock-workspace-'));
    fixtureDirectories.push(mockWorkspace);

    // Create active project folders
    mkdirSync(join(mockWorkspace, '02_PROYECTOS_WEB'));
    mkdirSync(join(mockWorkspace, '04_UNAB_INGENIERIA'));
    mkdirSync(join(mockWorkspace, '12_LA_GROWTH_STUDIO'));

    // Create archived folder (should be excluded from active ingestion)
    mkdirSync(join(mockWorkspace, '00_Archivado'));

    const adapter = new WorkspaceProjectsAdapter(store, mockWorkspace);
    const discovered = adapter.discoverAndCatalog();

    expect(discovered.projects).toHaveLength(3);
    const names = discovered.projects.map((p) => p.name);
    expect(names).toContain('02_PROYECTOS_WEB');
    expect(names).toContain('04_UNAB_INGENIERIA');
    expect(names).toContain('12_LA_GROWTH_STUDIO');
    expect(names).not.toContain('00_Archivado');

    // Idempotency: re-running discovery returns same projects without duplication
    const reDiscovered = adapter.discoverAndCatalog();
    expect(reDiscovered.projects).toHaveLength(3);

    store.close();
  });
});
