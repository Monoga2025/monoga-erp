import { MetadataStore } from './metadata-store.js';

export type JarvisTelemetryResult = {
  status: 'online';
  timestamp: string;
  telemetry: {
    projectsCount: number;
    sourcesCount: number;
    activeSourcesCount: number;
    promptsCount: number;
    projects: Array<{
      id: string;
      name: string;
      status: 'active';
      createdAt: string;
    }>;
  };
};

export class JarvisTelemetryAdapter {
  constructor(private readonly store: MetadataStore) {}

  getTelemetry(): JarvisTelemetryResult {
    const projects = this.store.listProjects();
    const sources = this.store.listSources();
    const prompts = this.store.listPrompts();
    const activeSources = sources.filter((s) => s.access === 'METADATA_ONLY');

    return {
      status: 'online',
      timestamp: new Date().toISOString(),
      telemetry: {
        projectsCount: projects.length,
        sourcesCount: sources.length,
        activeSourcesCount: activeSources.length,
        promptsCount: prompts.length,
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          status: 'active',
          createdAt: p.createdAt,
        })),
      },
    };
  }
}
