import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { MetadataStore, type Principal } from '../src/metadata-store.js';
import { YouTubeAdapter } from '../src/youtube-adapter.js';

const fixtureDirectories: string[] = [];

function createStore(): MetadataStore {
  const dir = mkdtempSync(join(tmpdir(), 'monoga-erp-search-test-'));
  fixtureDirectories.push(dir);
  return new MetadataStore(join(dir, 'metadata.sqlite'));
}

afterEach(() => {
  while (fixtureDirectories.length > 0) {
    const dir = fixtureDirectories.pop()!;
    try {
      rmSync(dir, { force: true, recursive: true });
    } catch {
      // ignore cleanup errors on open handles
    }
  }
});

describe('Catalog Search & Revocation', () => {
  const owner: Principal = { kind: 'OWNER' };
  const collaborator: Principal = { kind: 'COLLABORATOR' };

  it('filters search results by permissions and returns cited revisions only for permitted sources', () => {
    const store = createStore();
    const project = store.createProject({ name: 'ERP Catalog' });
    const source = store.createSource({ name: 'Active Source', projectId: project.id });
    store.setSourceAccess(source.id, 'METADATA_ONLY');

    const adapter = new YouTubeAdapter(store);
    adapter.ingestCase({
      sourceId: source.id,
      fixture: {
        nativeCaseId: 'yt-case-search-1',
        title: 'Searchable Case',
        scriptContent: 'Script for searchable video',
        rightsEvidence: 'Verified rights',
        timedVoiceEvidence: '10 min voice',
      },
    });

    const ownerResults = store.searchArtifacts(owner, 'yt-case-search');
    expect(ownerResults.length).toBeGreaterThan(0);
    expect(ownerResults[0].citation).toContain('yt-case-search-1');

    const collabResults = store.searchArtifacts(collaborator, 'yt-case-search');
    expect(collabResults).toHaveLength(0);

    store.close();
  });

  it('immediately removes previously indexed content from search results upon access revocation', () => {
    const store = createStore();
    const project = store.createProject({ name: 'ERP Catalog' });
    const source = store.createSource({ name: 'Revocable Source', projectId: project.id });
    store.setSourceAccess(source.id, 'METADATA_ONLY');

    const adapter = new YouTubeAdapter(store);
    adapter.ingestCase({
      sourceId: source.id,
      fixture: {
        nativeCaseId: 'yt-case-revocable',
        title: 'Revocable Content',
        scriptContent: 'Content before revocation',
        rightsEvidence: 'Rights OK',
        timedVoiceEvidence: 'Audio OK',
      },
    });

    const initialResults = store.searchArtifacts(owner, 'revocable');
    expect(initialResults.length).toBeGreaterThan(0);

    store.setSourceAccess(source.id, 'DENIED');

    const revokedResults = store.searchArtifacts(owner, 'revocable');
    expect(revokedResults).toHaveLength(0);

    store.close();
  });
});
