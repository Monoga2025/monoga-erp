import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { MetadataStore } from '../src/metadata-store.js';
import { ViralScriptsAdapter } from '../src/viral-scripts-adapter.js';

const fixtureDirectories: string[] = [];

function createStore(): MetadataStore {
  const dir = mkdtempSync(join(tmpdir(), 'monoga-erp-viral-test-'));
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

describe('JARVIS-004 YouTube 40-Daily Viral Scripts Ingestion Adapter', () => {
  it('parses markdown viral scripts document and ingests daily video cases into MetadataStore', () => {
    const store = createStore();
    const project = store.createProject({ name: '12_LA_GROWTH_STUDIO' });
    const source = store.createSource({ name: 'LA Growth Viral Scripts Source', projectId: project.id });
    store.setSourceAccess(source.id, 'METADATA_ONLY');

    const tempDir = mkdtempSync(join(tmpdir(), 'viral-doc-'));
    fixtureDirectories.push(tempDir);
    const mockMarkdownPath = join(tempDir, 'guiones_diarios.md');

    const mockContent = `
# 🎬 40 GUIONES DIARIOS DE VIDEO VIRAL PARA EL HERMANO

## 📅 DÍA 1: DOMINGO 2026-09-20 (Lanzamiento & El Gancho del QR)

### 🎬 Video 1: "La prueba gratis de $3,000 USD"
- **Formato:** Cara a cámara con iPhone o POV entrando a local.
- **Hook en Pantalla (0-3s):** *"Le regalé una web de $3,000 USD a este negocio en Pasadena y mira lo que pasó..."*
- **Guion Hablado (4-25s):**
  > *"En Los Ángeles hay miles de MedSpas increíbles..."*
- **Llamado a la Acción (CTA):** Comenta "DEMO" o entra al enlace del perfil.

### 🎬 Video 2: "¿Por qué las páginas de Wix no funcionan en LA?"
- **Formato:** Cara a cámara con fondo de calle en Los Ángeles.
- **Hook en Pantalla (0-3s):** *"Por esto tu sitio de Wix te está haciendo perder clientes..."*
- **Guion Hablado (4-25s):**
  > *"El 85% de las personas en California..."*
`;

    writeFileSync(mockMarkdownPath, mockContent, 'utf-8');

    const adapter = new ViralScriptsAdapter(store);
    const results = adapter.ingestMarkdownFile(source.id, mockMarkdownPath);

    expect(results).toHaveLength(2);
    expect(results[0].title).toBe('La prueba gratis de $3,000 USD');
    expect(results[0].readiness).toBe('BLOCKED'); // missing rights and voice evidence
    expect(results[0].citations).toHaveLength(1); // script revision citation

    store.close();
  });
});
