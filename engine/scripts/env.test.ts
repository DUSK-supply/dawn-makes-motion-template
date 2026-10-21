import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadDotEnv } from './env.ts';

test('loadDotEnv loads ./.env into process.env and tolerates a missing file', () => {
  const cwd = process.cwd();
  const saved = process.env.PEXELS_API_KEY;
  const dir = mkdtempSync(join(tmpdir(), 'env-'));
  try {
    process.chdir(dir);
    delete process.env.PEXELS_API_KEY;
    loadDotEnv(); // no .env yet: no throw
    assert.equal(process.env.PEXELS_API_KEY, undefined);
    writeFileSync('.env', 'PEXELS_API_KEY=x\n');
    loadDotEnv();
    assert.equal(process.env.PEXELS_API_KEY, 'x');
  } finally {
    process.chdir(cwd);
    if (saved === undefined) delete process.env.PEXELS_API_KEY;
    else process.env.PEXELS_API_KEY = saved;
  }
});
