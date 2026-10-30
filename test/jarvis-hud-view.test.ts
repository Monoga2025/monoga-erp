import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { MetadataStore } from '../src/metadata-store.js';

const fixtureDirectories: string[] = [];

function createStore(): { store: MetadataStore; dbPath: string } {
  const dir = mkdtempSync(join(tmpdir(), 'monoga-erp-jarvis-hud-test-'));
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

describe('JARVIS HUD View & Omnibar API Integration', () => {
  it('fetches telemetry, prompt matrix, and query plan forecast for HUD components', async () => {
    const { store, dbPath } = createStore();

    // Create seed prompt
    store.createPrompt({
      slug: 'stark-refactor',
      category: 'Coding',
      title: 'Stark Armor Refactor',
      content: 'Refactor module {{moduleName}} under {{framework}} rules',
    });

    const app = buildApp({ dbPath });

    // 1. Telemetry API endpoint test
    const telemRes = await app.inject({ method: 'GET', url: '/api/v1/jarvis/telemetry' });
    expect(telemRes.statusCode).toBe(200);
    const telemJson = telemRes.json();
    expect(telemJson.status).toBe('online');
    expect(telemJson.telemetry.projectsCount).toBeGreaterThanOrEqual(0);
    expect(telemJson.telemetry.promptsCount).toBe(1);

    // 2. HUD Search endpoint test
    const hudRes = await app.inject({ method: 'GET', url: '/api/v1/jarvis/hud?q=stark' });
    expect(hudRes.statusCode).toBe(200);
    const hudJson = hudRes.json();
    expect(hudJson.prompts).toHaveLength(1);
    expect(hudJson.prompts[0].title).toBe('Stark Armor Refactor');

    // 3. AI Query Plan Forecast endpoint test
    const planRes = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/query-plans',
      payload: {
        purpose: 'Execute Prompt: Stark Armor Refactor',
        budgetCap: 1.0,
      },
    });
    expect(planRes.statusCode).toBe(201);
    const planJson = planRes.json();
    expect(planJson.plan.planHash).toHaveLength(64);
    expect(planJson.plan.budgetCap).toBe(1.0);

    store.close();
    await app.close();
  });
});
