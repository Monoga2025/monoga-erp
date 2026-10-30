import { describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.js';

describe('workspace folder API', () => {
  it('accepts the allowlisted ID without returning a path', async () => {
    const launcher = vi.fn(async () => ({ ok: true as const }));
    const app = buildApp({ workspaceLauncher: launcher });
    const response = await app.inject({ method: 'POST', url: '/api/v1/workspace-folders/open', payload: { id: 'youtube-content-os' } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    expect(launcher).toHaveBeenCalledWith('youtube-content-os');
    expect(response.body).not.toMatch(/[A-Za-z]:[\\/]/);
    await app.close();
  });

  it('rejects malformed and unknown IDs safely', async () => {
    const app = buildApp({ workspaceLauncher: vi.fn() });
    expect((await app.inject({ method: 'POST', url: '/api/v1/workspace-folders/open', payload: {} })).statusCode).toBe(400);
    const extra = await app.inject({ method: 'POST', url: '/api/v1/workspace-folders/open', payload: { id: 'youtube-content-os', path: 'C:/secret' } });
    expect(extra.statusCode).toBe(400);
    expect((await app.inject({ method: 'POST', url: '/api/v1/workspace-folders/open', payload: { id: '../secret' } })).statusCode).toBe(400);
    const unavailableApp = buildApp({ workspaceLauncher: vi.fn(async () => ({ ok: false as const, code: 'WORKSPACE_FOLDER_UNAVAILABLE' })) });
    expect((await unavailableApp.inject({ method: 'POST', url: '/api/v1/workspace-folders/open', payload: { id: 'youtube-content-os' } })).statusCode).toBe(404);
    await unavailableApp.close();
    await app.close();
  });
});
