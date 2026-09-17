import os from 'node:os';
import path from 'node:path';

export function dataDirectory(): string {
  return process.env.CW_DATA_DIR ?? path.join(process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local', 'share'), 'cw');
}

export function configPath(): string { return path.join(dataDirectory(), 'config.yaml'); }
export function templatesDirectory(): string { return path.join(dataDirectory(), 'templates'); }
export function draftsDirectory(): string { return path.join(dataDirectory(), 'drafts'); }
export function browserProfileDirectory(): string { return path.join(dataDirectory(), 'browser'); }
