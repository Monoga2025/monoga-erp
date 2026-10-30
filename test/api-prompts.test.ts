import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { MetadataStore } from '../src/metadata-store.js';

const fixtureDirectories: string[] = [];

function createStore(): { store: MetadataStore; dbPath: string } {
  const dir = mkdtempSync(join(tmpdir(), 'monoga-erp-api-prompts-test-'));
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

describe('JARVIS-003 Prompts Registry REST API Endpoints', () => {
  it('POST /api/v1/prompts creates a prompt and GET /api/v1/prompts lists it', async () => {
    const { store, dbPath } = createStore();
    const app = buildApp({ dbPath });

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/prompts',
      payload: {
        slug: 'coding-tdd-agent',
        category: 'Coding',
        title: 'TDD Execution Agent',
        content: 'Write TDD RED, GREEN, REFACTOR steps for: {{feature}}',
      },
    });

    expect(createRes.statusCode).toBe(201);
    const createBody = createRes.json();
    expect(createBody.prompt.slug).toBe('coding-tdd-agent');

    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/prompts?category=Coding',
    });

    expect(listRes.statusCode).toBe(200);
    const listBody = listRes.json();
    expect(listBody.prompts).toHaveLength(1);
    expect(listBody.prompts[0].title).toBe('TDD Execution Agent');

    store.close();
    await app.close();
  });

  it('POST /api/v1/ai/query-plans creates a forecasted query plan hash with budget cap', async () => {
    const { store, dbPath } = createStore();
    const app = buildApp({ dbPath });

    const planRes = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/query-plans',
      payload: {
        purpose: 'Architecture Review',
        budgetCap: 5.0,
      },
    });

    expect(planRes.statusCode).toBe(201);
    const planBody = planRes.json();
    expect(planBody.plan.planHash).toBeDefined();
    expect(planBody.plan.budgetCap).toBe(5.0);

    store.close();
    await app.close();
  });
});
