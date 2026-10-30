import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { MetadataStore, type SourceAccess } from './metadata-store.js';
import { YouTubeAdapter, type YouTubeFixtureInput } from './youtube-adapter.js';
import { JarvisTelemetryAdapter } from './jarvis-telemetry-adapter.js';
import { openWorkspaceFolder } from './workspace-folders.js';
import { EventSalesStore, PIPELINE_STAGES, type PipelineStage, type ProspectInput } from './event-sales/model.js';

export type AppOptions = {
  dbPath?: string;
  workspaceLauncher?: (id: string) => Promise<{ ok: true } | { ok: false; code: string }>;
  eventSalesStore?: EventSalesStore;
};

export function buildApp(options: AppOptions = {}): FastifyInstance {
  const app = Fastify({ ajv: { customOptions: { removeAdditional: false } } });
  const dbPath = options.dbPath ?? (process.env.DB_PATH || 'monoga-erp-metadata.sqlite');
  const launchWorkspace = options.workspaceLauncher ?? ((id: string) => openWorkspaceFolder(id));
  const eventSales = options.eventSalesStore ?? new EventSalesStore();

  const publicDir = join(process.cwd(), 'dist', 'public');
  if (existsSync(publicDir)) {
    void app.register(fastifyStatic, {
      root: publicDir,
      prefix: '/',
    });
  }

  app.get('/health', async () => ({ status: 'ok' }));

  app.get('/api/v1/event-sales/prospects', async () => ({ prospects: eventSales.list(), stages: PIPELINE_STAGES }));
  app.post<{ Body: ProspectInput }>('/api/v1/event-sales/prospects', async (request, reply) => {
    try { return reply.status(201).send({ prospect: eventSales.create(request.body) }); }
    catch (error) { return reply.status(400).send({ error: { code: 'INVALID_PROSPECT', message: error instanceof Error ? error.message : 'Invalid prospect' } }); }
  });
  app.patch<{ Params: { id: string }; Body: { stage: PipelineStage; nextAction?: string } }>('/api/v1/event-sales/prospects/:id', async (request, reply) => {
    try { return { prospect: eventSales.move(request.params.id, request.body.stage, request.body.nextAction) }; }
    catch (error) { return reply.status(400).send({ error: { code: 'INVALID_STAGE_CHANGE', message: error instanceof Error ? error.message : 'Invalid stage change' } }); }
  });

  app.post<{ Body: { id: 'youtube-content-os' } }>('/api/v1/workspace-folders/open', {
    schema: {
      body: {
        type: 'object', required: ['id'], additionalProperties: false,
        properties: { id: { type: 'string', const: 'youtube-content-os' } },
      },
    },
  }, async (request, reply) => {
    const body = request.body as { id?: unknown } | undefined;
    const id = body?.id;
    if (!body || Object.keys(body).length !== 1 || id !== 'youtube-content-os') {
      return reply.status(400).send({ error: { code: 'INVALID_WORKSPACE_FOLDER_ID', message: 'A valid workspace folder ID is required' } });
    }
    const result = await launchWorkspace(id);
    if (!result.ok) return reply.status(404).send({ error: { code: result.code, message: 'Workspace folder is unavailable' } });
    return { status: 'ok' };
  });

  app.get('/api/v1/home', async (request) => {
    const principalKind = (request.headers['x-principal-kind'] as string) === 'COLLABORATOR' ? 'COLLABORATOR' : 'OWNER';
    const store = new MetadataStore(dbPath);
    try {
      const projects = store.listProjects();
      const sources = store.listSources();
      const activeSources = sources.filter((s) => s.access === 'METADATA_ONLY').length;
      const deniedSources = sources.filter((s) => s.access === 'DENIED').length;
      const recentArtifacts = store.searchArtifacts({ kind: principalKind });

      return {
        status: 'ok',
        summary: {
          totalProjects: projects.length,
          totalSources: sources.length,
          activeSources,
          deniedSources,
        },
        recentArtifacts: recentArtifacts.slice(0, 10),
      };
    } finally {
      store.close();
    }
  });

  app.get('/api/v1/projects', async () => {
    const store = new MetadataStore(dbPath);
    try {
      const projects = store.listProjects();
      return { projects };
    } finally {
      store.close();
    }
  });

  app.get('/api/v1/sources', async () => {
    const store = new MetadataStore(dbPath);
    try {
      const sources = store.listSources();
      return { sources };
    } finally {
      store.close();
    }
  });

  app.get<{ Querystring: { q?: string } }>('/api/v1/search', async (request) => {
    const principalKind = (request.headers['x-principal-kind'] as string) === 'COLLABORATOR' ? 'COLLABORATOR' : 'OWNER';
    const store = new MetadataStore(dbPath);
    try {
      const results = store.searchArtifacts({ kind: principalKind }, request.query.q);
      return { results };
    } finally {
      store.close();
    }
  });

  app.get<{ Querystring: { q?: string } }>('/api/v1/artifacts', async (request) => {
    const principalKind = (request.headers['x-principal-kind'] as string) === 'COLLABORATOR' ? 'COLLABORATOR' : 'OWNER';
    const store = new MetadataStore(dbPath);
    try {
      const artifacts = store.searchArtifacts({ kind: principalKind }, request.query.q);
      return { artifacts };
    } finally {
      store.close();
    }
  });

  app.post<{ Params: { sourceId: string }; Body: { access: SourceAccess } }>(
    '/api/v1/sources/:sourceId/activation-requests',
    async (request, reply) => {
      const { sourceId } = request.params;
      const { access } = request.body || {};
      if (access !== 'DENIED' && access !== 'METADATA_ONLY') {
        return reply.status(400).send({
          error: {
            code: 'INVALID_ACCESS_LEVEL',
            message: 'access must be DENIED or METADATA_ONLY',
          },
        });
      }

      const store = new MetadataStore(dbPath);
      try {
        const source = store.setSourceAccess(sourceId, access);
        return { source };
      } catch {
        return reply.status(404).send({
          error: {
            code: 'SOURCE_NOT_FOUND',
            message: `Source ${sourceId} not found`,
          },
        });
      } finally {
        store.close();
      }
    }
  );

  app.post<{ Body: { sourceId: string; fixture: YouTubeFixtureInput } }>(
    '/api/v1/youtube/cases',
    async (request, reply) => {
      const { sourceId, fixture } = request.body || {};
      if (!sourceId || !fixture) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_INPUT',
            message: 'sourceId and fixture are required',
          },
        });
      }

      const store = new MetadataStore(dbPath);
      try {
        const adapter = new YouTubeAdapter(store);
        const result = adapter.ingestCase({ sourceId, fixture });
        return reply.status(201).send({ case: result });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Ingestion failed';
        return reply.status(403).send({
          error: {
            code: 'SOURCE_ACCESS_DENIED',
            message,
          },
        });
      } finally {
        store.close();
      }
    }
  );

  app.get<{ Querystring: { category?: string } }>('/api/v1/prompts', async (request) => {
    const store = new MetadataStore(dbPath);
    try {
      const prompts = store.listPrompts(request.query.category);
      return { prompts };
    } finally {
      store.close();
    }
  });

  app.post<{ Body: { slug: string; category: string; title: string; content: string; variablesJson?: string } }>(
    '/api/v1/prompts',
    async (request, reply) => {
      const { slug, category, title, content, variablesJson } = request.body || {};
      if (!slug || !category || !title || !content) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_INPUT',
            message: 'slug, category, title, and content are required',
          },
        });
      }

      const store = new MetadataStore(dbPath);
      try {
        const prompt = store.createPrompt({ slug, category, title, content, variablesJson });
        return reply.status(201).send({ prompt });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Creation failed';
        return reply.status(409).send({
          error: {
            code: 'PROMPT_CREATION_CONFLICT',
            message,
          },
        });
      } finally {
        store.close();
      }
    }
  );

  app.post<{ Body: { purpose: string; promptId?: string; budgetCap: number } }>(
    '/api/v1/ai/query-plans',
    async (request, reply) => {
      const { purpose, promptId, budgetCap } = request.body || {};
      if (!purpose || budgetCap === undefined) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_INPUT',
            message: 'purpose and budgetCap are required',
          },
        });
      }

      const store = new MetadataStore(dbPath);
      try {
        const plan = store.createAiQueryPlan({ purpose, promptId, budgetCap });
        return reply.status(201).send({ plan });
      } finally {
        store.close();
      }
    }
  );

  app.get('/api/v1/jarvis/telemetry', async () => {
    const store = new MetadataStore(dbPath);
    try {
      const adapter = new JarvisTelemetryAdapter(store);
      return adapter.getTelemetry();
    } finally {
      store.close();
    }
  });

  app.get<{ Querystring: { q?: string } }>('/api/v1/jarvis/hud', async (request) => {
    const query = request.query.q || '';
    const principalKind = (request.headers['x-principal-kind'] as string) === 'COLLABORATOR' ? 'COLLABORATOR' : 'OWNER';
    const store = new MetadataStore(dbPath);
    try {
      const projects = store.listProjects().filter((p) => !query || p.name.toLowerCase().includes(query.toLowerCase()));
      const prompts = store.listPrompts().filter((p) => !query || p.slug.toLowerCase().includes(query.toLowerCase()) || p.title.toLowerCase().includes(query.toLowerCase()));
      const artifacts = store.searchArtifacts({ kind: principalKind }, query);

      return {
        query,
        projects,
        prompts,
        artifacts,
      };
    } finally {
      store.close();
    }
  });

  return app;
}
