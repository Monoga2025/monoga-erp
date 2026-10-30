import { createHash, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

export type SourceAccess = 'DENIED' | 'METADATA_ONLY';
export type CatalogAction = 'catalog.read' | 'catalog.write';
export type Principal = { kind: 'OWNER' | 'COLLABORATOR' };

export type Project = {
  id: string;
  name: string;
  createdAt: string;
};

export type Source = {
  id: string;
  projectId: string;
  name: string;
  access: SourceAccess;
  createdAt: string;
};

export type Artifact = {
  id: string;
  sourceId: string;
  nativeId: string;
  createdAt: string;
};

export type ArtifactRevision = {
  id: string;
  artifactId: string;
  citation: string;
  createdAt: string;
};

export type SearchResultItem = {
  artifactId: string;
  sourceId: string;
  nativeId: string;
  citation: string;
  createdAt: string;
};

export type PromptItem = {
  id: string;
  slug: string;
  category: string;
  title: string;
  content: string;
  variablesJson?: string;
  createdAt: string;
  updatedAt: string;
};

export type AiQueryPlan = {
  planId: string;
  planHash: string;
  purpose: string;
  promptId?: string;
  budgetCap: number;
  createdAt: string;
};

type ProjectRow = Project;
type SourceRow = Source;
type ArtifactRow = Artifact;
type ArtifactRevisionRow = ArtifactRevision;

const migrations = [
  {
    version: 1,
    sql: `
      CREATE TABLE projects (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE sources (
        id TEXT PRIMARY KEY NOT NULL,
        project_id TEXT NOT NULL REFERENCES projects(id),
        name TEXT NOT NULL,
        access TEXT NOT NULL DEFAULT 'DENIED' CHECK (access IN ('DENIED', 'METADATA_ONLY')),
        created_at TEXT NOT NULL
      );

      CREATE TABLE artifacts (
        id TEXT PRIMARY KEY NOT NULL,
        source_id TEXT NOT NULL REFERENCES sources(id),
        native_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (source_id, native_id)
      );

      CREATE TABLE artifact_revisions (
        id TEXT PRIMARY KEY NOT NULL,
        artifact_id TEXT NOT NULL REFERENCES artifacts(id),
        citation TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `,
  },
  {
    version: 2,
    sql: `
      CREATE TABLE prompts (
        id TEXT PRIMARY KEY NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        variables_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE ai_query_plans (
        plan_id TEXT PRIMARY KEY NOT NULL,
        plan_hash TEXT UNIQUE NOT NULL,
        purpose TEXT NOT NULL,
        prompt_id TEXT REFERENCES prompts(id),
        budget_cap REAL NOT NULL,
        created_at TEXT NOT NULL
      );
    `,
  },
] as const;

export class MetadataStore {
  private readonly database: DatabaseSync;

  constructor(filename: string) {
    this.database = new DatabaseSync(filename);
    try {
      this.database.exec('PRAGMA foreign_keys = ON');
      this.applyMigrations();
    } catch (error) {
      this.database.close();
      throw error;
    }
  }

  createProject(input: { name: string }): Project {
    const project = { id: randomUUID(), name: input.name, createdAt: utcNow() };
    this.database
      .prepare('INSERT INTO projects (id, name, created_at) VALUES (?, ?, ?)')
      .run(project.id, project.name, project.createdAt);
    return project;
  }

  createSource(input: { projectId: string; name: string }): Source {
    const source = {
      id: randomUUID(),
      projectId: input.projectId,
      name: input.name,
      createdAt: utcNow(),
    };
    this.database
      .prepare('INSERT INTO sources (id, project_id, name, created_at) VALUES (?, ?, ?, ?)')
      .run(source.id, source.projectId, source.name, source.createdAt);
    return this.requireSource(source.id);
  }

  createArtifact(input: { sourceId: string; nativeId: string }): Artifact {
    const artifact = { id: randomUUID(), sourceId: input.sourceId, nativeId: input.nativeId, createdAt: utcNow() };
    this.database
      .prepare('INSERT INTO artifacts (id, source_id, native_id, created_at) VALUES (?, ?, ?, ?)')
      .run(artifact.id, artifact.sourceId, artifact.nativeId, artifact.createdAt);
    return artifact;
  }

  createArtifactRevision(input: { artifactId: string; citation: string }): ArtifactRevision {
    const revision = { id: randomUUID(), artifactId: input.artifactId, citation: input.citation, createdAt: utcNow() };
    this.database
      .prepare('INSERT INTO artifact_revisions (id, artifact_id, citation, created_at) VALUES (?, ?, ?, ?)')
      .run(revision.id, revision.artifactId, revision.citation, revision.createdAt);
    return revision;
  }

  listProjects(): Project[] {
    return this.database
      .prepare('SELECT id, name, created_at AS createdAt FROM projects ORDER BY created_at DESC')
      .all() as Project[];
  }

  listSources(): Source[] {
    return this.database
      .prepare('SELECT id, project_id AS projectId, name, access, created_at AS createdAt FROM sources ORDER BY created_at DESC')
      .all() as SourceRow[];
  }

  getSource(id: string): Source | undefined {
    return this.database
      .prepare('SELECT id, project_id AS projectId, name, access, created_at AS createdAt FROM sources WHERE id = ?')
      .get(id) as SourceRow | undefined;
  }

  setSourceAccess(id: string, access: SourceAccess): Source {
    this.database.prepare('UPDATE sources SET access = ? WHERE id = ?').run(access, id);
    return this.requireSource(id);
  }

  getArtifactByNativeId(sourceId: string, nativeId: string): Artifact | undefined {
    const row = this.database
      .prepare('SELECT id, source_id AS sourceId, native_id AS nativeId, created_at AS createdAt FROM artifacts WHERE source_id = ? AND native_id = ?')
      .get(sourceId, nativeId) as ArtifactRow | undefined;
    return row;
  }

  searchArtifacts(principal: Principal, query?: string): SearchResultItem[] {
    const rows = this.database
      .prepare(`
        SELECT
          a.id AS artifactId,
          a.source_id AS sourceId,
          a.native_id AS nativeId,
          r.citation AS citation,
          r.created_at AS createdAt,
          s.access AS sourceAccess
        FROM artifacts a
        JOIN sources s ON a.source_id = s.id
        JOIN artifact_revisions r ON r.artifact_id = a.id
        ORDER BY r.created_at DESC
      `)
      .all() as Array<{
        artifactId: string;
        sourceId: string;
        nativeId: string;
        citation: string;
        createdAt: string;
        sourceAccess: SourceAccess;
      }>;

    return rows
      .filter((row) => can(principal, 'catalog.read', { access: row.sourceAccess }))
      .filter((row) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          row.nativeId.toLowerCase().includes(q) ||
          row.citation.toLowerCase().includes(q)
        );
      })
      .map(({ artifactId, sourceId, nativeId, citation, createdAt }) => ({
        artifactId,
        sourceId,
        nativeId,
        citation,
        createdAt,
      }));
  }

  createPrompt(input: { slug: string; category: string; title: string; content: string; variablesJson?: string }): PromptItem {
    const now = utcNow();
    const prompt: PromptItem = {
      id: randomUUID(),
      slug: input.slug,
      category: input.category,
      title: input.title,
      content: input.content,
      variablesJson: input.variablesJson,
      createdAt: now,
      updatedAt: now,
    };

    this.database
      .prepare('INSERT INTO prompts (id, slug, category, title, content, variables_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(prompt.id, prompt.slug, prompt.category, prompt.title, prompt.content, prompt.variablesJson ?? null, prompt.createdAt, prompt.updatedAt);

    return prompt;
  }

  listPrompts(category?: string): PromptItem[] {
    if (category) {
      return this.database
        .prepare('SELECT id, slug, category, title, content, variables_json AS variablesJson, created_at AS createdAt, updated_at AS updatedAt FROM prompts WHERE category = ? ORDER BY created_at DESC')
        .all(category) as PromptItem[];
    }
    return this.database
      .prepare('SELECT id, slug, category, title, content, variables_json AS variablesJson, created_at AS createdAt, updated_at AS updatedAt FROM prompts ORDER BY created_at DESC')
      .all() as PromptItem[];
  }

  getPrompt(id: string): PromptItem | undefined {
    return this.database
      .prepare('SELECT id, slug, category, title, content, variables_json AS variablesJson, created_at AS createdAt, updated_at AS updatedAt FROM prompts WHERE id = ?')
      .get(id) as PromptItem | undefined;
  }

  createAiQueryPlan(input: { purpose: string; promptId?: string; budgetCap: number }): AiQueryPlan {
    const planId = randomUUID();
    const createdAt = utcNow();
    const rawHashInput = `${input.purpose}:${input.promptId ?? ''}:${input.budgetCap}:${createdAt}`;
    const planHash = createHash('sha256').update(rawHashInput).digest('hex');

    const plan: AiQueryPlan = {
      planId,
      planHash,
      purpose: input.purpose,
      promptId: input.promptId,
      budgetCap: input.budgetCap,
      createdAt,
    };

    this.database
      .prepare('INSERT INTO ai_query_plans (plan_id, plan_hash, purpose, prompt_id, budget_cap, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(plan.planId, plan.planHash, plan.purpose, plan.promptId ?? null, plan.budgetCap, plan.createdAt);

    return plan;
  }

  getAiQueryPlan(planId: string): AiQueryPlan | undefined {
    return this.database
      .prepare('SELECT plan_id AS planId, plan_hash AS planHash, purpose, prompt_id AS promptId, budget_cap AS budgetCap, created_at AS createdAt FROM ai_query_plans WHERE plan_id = ?')
      .get(planId) as AiQueryPlan | undefined;
  }

  close(): void {
    this.database.close();
  }

  private applyMigrations(): void {
    this.database.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY NOT NULL)');
    const applied = this.database.prepare('SELECT version FROM schema_migrations').all() as Array<{ version: number }>;

    for (const migration of migrations) {
      if (!applied.some(({ version }) => version === migration.version)) {
        this.database.exec('BEGIN');
        try {
          this.database.exec(migration.sql);
          this.database.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(migration.version);
          this.database.exec('COMMIT');
        } catch (error) {
          this.database.exec('ROLLBACK');
          throw error;
        }
      }
    }
  }

  private requireSource(id: string): Source {
    const row = this.database
      .prepare('SELECT id, project_id AS projectId, name, access, created_at AS createdAt FROM sources WHERE id = ?')
      .get(id) as SourceRow | undefined;

    if (row === undefined) {
      throw new Error(`Source ${id} was not created`);
    }
    return row;
  }
}

export function can(principal: Principal, action: CatalogAction, source: Pick<Source, 'access'>): boolean {
  return principal.kind === 'OWNER' && action === 'catalog.read' && source.access === 'METADATA_ONLY';
}

function utcNow(): string {
  return new Date().toISOString();
}
