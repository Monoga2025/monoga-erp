import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MetadataStore,
  can,
  type Principal,
} from '../src/metadata-store.js';

const fixtureDirectories: string[] = [];

function createStore(): MetadataStore {
  return new MetadataStore(createDatabaseFilename());
}

function createDatabaseFilename(): string {
  const directory = mkdtempSync(join(tmpdir(), 'monoga-erp-metadata-'));
  fixtureDirectories.push(directory);
  return join(directory, 'metadata.sqlite');
}

afterEach(() => {
  while (fixtureDirectories.length > 0) {
    rmSync(fixtureDirectories.pop()!, { force: true, recursive: true });
  }
});

describe('metadata persistence', () => {
  it('reopens an existing database cleanly after migrations', () => {
    const filename = createDatabaseFilename();
    const initialStore = new MetadataStore(filename);
    initialStore.close();

    const reopenedStore = new MetadataStore(filename);

    expect(reopenedStore.createProject({ name: 'Reopened catalog' }).name).toBe('Reopened catalog');
    reopenedStore.close();
  });

  it('rolls back schema DDL when a migration version cannot be recorded', () => {
    const filename = createDatabaseFilename();
    const database = new DatabaseSync(filename);
    database.exec(`
      CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY NOT NULL);
      CREATE TRIGGER reject_migration_version
      BEFORE INSERT ON schema_migrations
      BEGIN
        SELECT RAISE(ABORT, 'version recording failed');
      END;
    `);
    database.close();

    expect(() => new MetadataStore(filename)).toThrow('version recording failed');

    const reopenedDatabase = new DatabaseSync(filename);
    const projectsTable = reopenedDatabase
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'projects'")
      .get();
    reopenedDatabase.close();

    expect(projectsTable).toBeUndefined();
  });

  it('creates denied sources by default', () => {
    const store = createStore();
    const project = store.createProject({ name: 'Catalog' });

    const source = store.createSource({ name: 'Prior work', projectId: project.id });

    expect(source.access).toBe('DENIED');
    store.close();
  });

  it('retains one artifact for each source and native identity tuple', () => {
    const store = createStore();
    const project = store.createProject({ name: 'Catalog' });
    const source = store.createSource({ name: 'Prior work', projectId: project.id });

    const artifact = store.createArtifact({ nativeId: 'video-42', sourceId: source.id });

    expect(artifact.sourceId).toBe(source.id);
    expect(artifact.nativeId).toBe('video-42');
    expect(() => store.createArtifact({ nativeId: 'video-42', sourceId: source.id })).toThrow();
    store.close();
  });

  it('generates opaque UUIDs and UTC ISO timestamps for retained metadata', () => {
    const store = createStore();
    const project = store.createProject({ name: 'Catalog' });
    const source = store.createSource({ name: 'Prior work', projectId: project.id });
    const artifact = store.createArtifact({ nativeId: 'video-42', sourceId: source.id });
    const revision = store.createArtifactRevision({ artifactId: artifact.id, citation: 'fixture://video-42' });

    for (const record of [project, source, artifact, revision]) {
      expect(record.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(record.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    }
    store.close();
  });
});

describe('catalog permission evaluation', () => {
  const owner: Principal = { kind: 'OWNER' };
  const collaborator: Principal = { kind: 'COLLABORATOR' };

  it('denies by default and allows only an owner to read metadata-only sources', () => {
    expect(can(collaborator, 'catalog.read', { access: 'METADATA_ONLY' })).toBe(false);
    expect(can(owner, 'catalog.write', { access: 'METADATA_ONLY' })).toBe(false);
    expect(can(owner, 'catalog.read', { access: 'DENIED' })).toBe(false);
    expect(can(owner, 'catalog.read', { access: 'METADATA_ONLY' })).toBe(true);
  });
});
