import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { spawn as systemSpawn, type ChildProcess } from 'node:child_process';

export const WORKSPACE_FOLDER_IDS = ['youtube-content-os'] as const;
export type WorkspaceFolderId = (typeof WORKSPACE_FOLDER_IDS)[number];
type Spawn = (command: string, args: string[], options: { shell: false; windowsHide: boolean }) => ChildProcess;
export type WorkspaceLauncherDependencies = { baseDirectory?: string; exists?: (path: string) => boolean; isDirectory?: (path: string) => boolean; spawn?: Spawn };
type LaunchResult = { ok: true } | { ok: false; code: string };

const repositoryDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function resolveWorkspaceFolder(id: string, baseDirectory = repositoryDirectory): string | null {
  if (id !== 'youtube-content-os') return null;
  return resolve(baseDirectory, '..', '12_LA_GROWTH_STUDIO', '02_MOTOR_DE_CONTENIDO');
}

export async function openWorkspaceFolder(id: string, dependencies: WorkspaceLauncherDependencies = {}): Promise<LaunchResult> {
  const destination = resolveWorkspaceFolder(id, dependencies.baseDirectory);
  if (!destination) return { ok: false, code: 'UNKNOWN_WORKSPACE_FOLDER' };
  const exists = dependencies.exists ?? existsSync;
  const isDirectory = dependencies.isDirectory ?? ((path: string) => statSync(path).isDirectory());
  try {
    if (!exists(destination) || !isDirectory(destination)) return { ok: false, code: 'WORKSPACE_FOLDER_UNAVAILABLE' };
    await new Promise<void>((resolveLaunch, rejectLaunch) => {
      const child = (dependencies.spawn ?? systemSpawn)('explorer.exe', [destination], { shell: false, windowsHide: false });
      child.once('error', rejectLaunch);
      child.once('spawn', resolveLaunch);
      child.unref();
    });
    return { ok: true };
  } catch {
    return { ok: false, code: 'WORKSPACE_FOLDER_UNAVAILABLE' };
  }
}
