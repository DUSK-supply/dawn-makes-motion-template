import { existsSync } from 'node:fs';

/** Load KEY=value pairs from a .env file into process.env (Node built-in; existing variables win). Never logs values. */
export function loadDotEnv(path = '.env'): void {
  if (existsSync(path)) process.loadEnvFile(path);
}
