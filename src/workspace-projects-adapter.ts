import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { MetadataStore, type Project, type Source } from './metadata-store.js';

export class WorkspaceProjectsAdapter {
  constructor(
    private readonly store: MetadataStore,
    private readonly workspaceRoot: string = process.cwd()
  ) {}

  discoverAndCatalog(): { projects: Project[]; sources: Source[] } {
    const entries = readdirSync(this.workspaceRoot);
    const existingProjects = this.store.listProjects();
    const existingSources = this.store.listSources();

    const catalogedProjects: Project[] = [...existingProjects];
    const catalogedSources: Source[] = [...existingSources];

    for (const entry of entries) {
      if (entry.startsWith('.') || entry.startsWith('00_Archivado') || entry === 'node_modules' || entry === 'dist' || entry === 'scratch') {
        continue;
      }

      const fullPath = join(this.workspaceRoot, entry);
      try {
        if (statSync(fullPath).isDirectory()) {
          let project = catalogedProjects.find((p) => p.name === entry);
          if (!project) {
            project = this.store.createProject({ name: entry });
            catalogedProjects.push(project);

            const source = this.store.createSource({ projectId: project.id, name: `${entry} Source` });
            catalogedSources.push(source);
          }
        }
      } catch {
        // skip unreadable paths
      }
    }

    return { projects: catalogedProjects, sources: catalogedSources };
  }
}
