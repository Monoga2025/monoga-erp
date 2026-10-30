import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { MetadataStore } from '../src/metadata-store.js';

const fixtureDirectories: string[] = [];

function createStore(): MetadataStore {
  const dir = mkdtempSync(join(tmpdir(), 'monoga-erp-prompts-test-'));
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

describe('JARVIS-001 Prompts & AI Query Plans Persistence', () => {
  it('creates and lists prompts by category', () => {
    const store = createStore();

    const prompt1 = store.createPrompt({
      slug: 'coding-refactor-ts',
      category: 'Coding',
      title: 'TypeScript Clean Code Refactor',
      content: 'Refactor the following code following clean code and TDD: {{code}}',
      variablesJson: JSON.stringify(['code']),
    });

    const prompt2 = store.createPrompt({
      slug: 'copy-viral-hook',
      category: 'Copywriting',
      title: 'Viral Hook Generator',
      content: 'Generate 5 viral hooks for: {{niche}}',
      variablesJson: JSON.stringify(['niche']),
    });

    expect(prompt1.id).toBeDefined();
    expect(prompt1.slug).toBe('coding-refactor-ts');

    const codingPrompts = store.listPrompts('Coding');
    expect(codingPrompts).toHaveLength(1);
    expect(codingPrompts[0].title).toBe('TypeScript Clean Code Refactor');

    const allPrompts = store.listPrompts();
    expect(allPrompts).toHaveLength(2);

    store.close();
  });

  it('creates and retrieves forecasted AI query plans', () => {
    const store = createStore();
    const prompt = store.createPrompt({
      slug: 'arch-review',
      category: 'Architecture',
      title: 'System Architecture Audit',
      content: 'Audit system architecture for {{repo}}',
    });

    const plan = store.createAiQueryPlan({
      purpose: 'System Audit',
      promptId: prompt.id,
      budgetCap: 10.0,
    });

    expect(plan.planId).toBeDefined();
    expect(plan.planHash).toMatch(/^[0-9a-f]{64}$/);
    expect(plan.budgetCap).toBe(10.0);

    const retrieved = store.getAiQueryPlan(plan.planId);
    expect(retrieved?.purpose).toBe('System Audit');

    store.close();
  });
});
