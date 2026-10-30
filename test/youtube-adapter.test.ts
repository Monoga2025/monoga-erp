import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { MetadataStore } from '../src/metadata-store.js';
import { YouTubeAdapter, type YouTubeFixtureInput } from '../src/youtube-adapter.js';

const fixtureDirectories: string[] = [];

function createStore(): MetadataStore {
  const dir = mkdtempSync(join(tmpdir(), 'monoga-erp-yt-test-'));
  fixtureDirectories.push(dir);
  return new MetadataStore(join(dir, 'metadata.sqlite'));
}

afterEach(() => {
  while (fixtureDirectories.length > 0) {
    rmSync(fixtureDirectories.pop()!, { force: true, recursive: true });
  }
});

describe('YouTubeAdapter', () => {
  it('throws an error if the source activation state is DENIED', () => {
    const store = createStore();
    const project = store.createProject({ name: 'YouTube Channel' });
    const source = store.createSource({ name: 'Prior Work YouTube', projectId: project.id });
    const adapter = new YouTubeAdapter(store);

    const fixture: YouTubeFixtureInput = {
      nativeCaseId: 'yt-case-001',
      title: 'Monoga OS Overview',
      scriptContent: 'Welcome to Monoga OS video script...',
    };

    expect(() => adapter.ingestCase({ sourceId: source.id, fixture })).toThrow('Source access is DENIED');
    store.close();
  });

  it('catalogues a case with cited revisions and identifies missing evidence as blockers', () => {
    const store = createStore();
    const project = store.createProject({ name: 'YouTube Channel' });
    const source = store.createSource({ name: 'Prior Work YouTube', projectId: project.id });
    store.setSourceAccess(source.id, 'METADATA_ONLY');

    const adapter = new YouTubeAdapter(store);

    // Case 1: missing rights and voice evidence
    const incompleteFixture: YouTubeFixtureInput = {
      nativeCaseId: 'yt-case-001',
      title: 'Incomplete Case',
      scriptContent: 'Script without rights or audio',
    };

    const result1 = adapter.ingestCase({ sourceId: source.id, fixture: incompleteFixture });
    expect(result1.readiness).toBe('BLOCKED');
    expect(result1.blockers).toContain('RIGHTS_EVIDENCE_MISSING');
    expect(result1.blockers).toContain('TIMED_VOICE_EVIDENCE_MISSING');

    // Case 2: complete evidence
    const completeFixture: YouTubeFixtureInput = {
      nativeCaseId: 'yt-case-002',
      title: 'Complete Case',
      scriptContent: 'Script content with all proof',
      rightsEvidence: 'Copyright permission granted by owner',
      timedVoiceEvidence: 'Audio recording: 12 minutes verified',
    };

    const result2 = adapter.ingestCase({ sourceId: source.id, fixture: completeFixture });
    expect(result2.readiness).toBe('READY');
    expect(result2.blockers).toHaveLength(0);
    expect(result2.citations).toHaveLength(3); // script, rights, timed voice
    store.close();
  });

  it('is idempotent and does not create duplicate artifacts on re-ingestion', () => {
    const store = createStore();
    const project = store.createProject({ name: 'YouTube Channel' });
    const source = store.createSource({ name: 'Prior Work YouTube', projectId: project.id });
    store.setSourceAccess(source.id, 'METADATA_ONLY');

    const adapter = new YouTubeAdapter(store);
    const fixture: YouTubeFixtureInput = {
      nativeCaseId: 'yt-case-idempotent',
      title: 'Idempotent Case',
      scriptContent: 'Script content',
      rightsEvidence: 'Permission verified',
      timedVoiceEvidence: '15 min audio',
    };

    const firstIngest = adapter.ingestCase({ sourceId: source.id, fixture });
    const secondIngest = adapter.ingestCase({ sourceId: source.id, fixture });

    expect(firstIngest.caseId).toBe(secondIngest.caseId);
    expect(firstIngest.citations).toEqual(secondIngest.citations);
    store.close();
  });
});
