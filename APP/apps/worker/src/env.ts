import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

function findEnvFile(startDir: string): string | null {
  let current = startDir;
  for (let i = 0; i < 5; i += 1) {
    const candidate = join(current, '.env');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

const envFile = findEnvFile(process.cwd());

if (envFile) {
  const lines = readFileSync(envFile, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1]!.trim();
    const value = match[2]!.trim().replace(/^['"]|['"]$/g, '');
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
