import { describe, expect, it, vi } from 'vitest';
import { openWorkspaceFolder, resolveWorkspaceFolder } from '../src/workspace-folders.js';

describe('workspace folder launcher', () => {
  it('resolves only the allowlisted YouTube Content OS folder', () => {
    expect(resolveWorkspaceFolder('youtube-content-os', 'C:/workspace')).toBe('C:\\12_LA_GROWTH_STUDIO\\02_MOTOR_DE_CONTENIDO');
    expect(resolveWorkspaceFolder('../secret', 'C:/workspace')).toBeNull();
  });

  it('returns unavailable for missing, non-directory, and filesystem failures', async () => {
    expect(await openWorkspaceFolder('youtube-content-os', { exists: () => false })).toEqual({ ok: false, code: 'WORKSPACE_FOLDER_UNAVAILABLE' });
    expect(await openWorkspaceFolder('youtube-content-os', { exists: () => true, isDirectory: () => false })).toEqual({ ok: false, code: 'WORKSPACE_FOLDER_UNAVAILABLE' });
    expect(await openWorkspaceFolder('youtube-content-os', { exists: () => { throw new Error('fs'); } })).toEqual({ ok: false, code: 'WORKSPACE_FOLDER_UNAVAILABLE' });
  });

  it('checks the destination and launches Explorer without a shell', async () => {
    const spawn = vi.fn(() => ({ unref: vi.fn(), once: vi.fn((event: string, handler: () => void) => { if (event === 'spawn') queueMicrotask(handler); }) } as never));
    const result = openWorkspaceFolder('youtube-content-os', {
      baseDirectory: 'C:/workspace',
      exists: () => true,
      isDirectory: () => true,
      spawn,
    });

    expect(await result).toEqual({ ok: true });
    expect(spawn).toHaveBeenCalledWith('explorer.exe', ['C:\\12_LA_GROWTH_STUDIO\\02_MOTOR_DE_CONTENIDO'], { shell: false, windowsHide: false });
  });

  it('reports asynchronous Explorer errors', async () => {
    const spawn = vi.fn(() => {
      const handlers: Record<string, () => void> = {};
      return { unref: vi.fn(), once: vi.fn((event: string, handler: () => void) => { handlers[event] = handler; if (event === 'error') queueMicrotask(handler); }) } as never;
    });
    await expect(openWorkspaceFolder('youtube-content-os', { exists: () => true, isDirectory: () => true, spawn })).resolves.toEqual({ ok: false, code: 'WORKSPACE_FOLDER_UNAVAILABLE' });
  });
});
