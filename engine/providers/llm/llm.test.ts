import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MissingKeyError } from '../types.ts';
import { LLM_PRESETS } from './presets.ts';
import { complete } from './client.ts';

function fakeFetch(content: string | null = 'hello there') {
  const calls: { url: string; headers: Headers }[] = [];
  const fn = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    calls.push({ url, headers: new Headers(init?.headers) });
    const body = {
      id: 'x', object: 'chat.completion', created: 0, model: 'm',
      choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content } }],
    };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  return { fn, calls };
}

const base = { system: 's', prompt: 'p' };

test('unknown provider is rejected', async () => {
  const { fn } = fakeFetch();
  await assert.rejects(complete({ ...base, provider: 'nope' as never, env: {}, fetch: fn }), /unknown LLM provider/);
});

test('provider unset errors', async () => {
  const { fn } = fakeFetch();
  await assert.rejects(complete({ ...base, env: {}, fetch: fn }), /FYE_LLM_PROVIDER is not set/);
});

test('kimi without key throws MissingKeyError and makes no request', async () => {
  const { fn, calls } = fakeFetch();
  await assert.rejects(
    complete({ ...base, provider: 'kimi', env: {}, fetch: fn }),
    (e: unknown) => e instanceof MissingKeyError && /MOONSHOT_API_KEY/.test((e as Error).message),
  );
  assert.equal(calls.length, 0);
});

test('kimi returns text, hits preset base URL, sends bearer key', async () => {
  const { fn, calls } = fakeFetch('hi kimi');
  const out = await complete({ ...base, provider: 'kimi', env: { MOONSHOT_API_KEY: 'sk-test' }, fetch: fn });
  assert.equal(out, 'hi kimi');
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.startsWith(LLM_PRESETS.kimi.baseURL.replace(/\/$/, '')));
  assert.equal(calls[0].headers.get('authorization'), 'Bearer sk-test');
});

test('provider falls back to FYE_LLM_PROVIDER; ollama needs no key', async () => {
  const { fn, calls } = fakeFetch('local');
  const out = await complete({ ...base, env: { FYE_LLM_PROVIDER: 'ollama' }, fetch: fn });
  assert.equal(out, 'local');
  assert.ok(calls[0].url.startsWith('http://localhost:11434/v1'));
});

test('empty completion content errors without leaking the key', async () => {
  const { fn } = fakeFetch(null);
  await assert.rejects(
    complete({ ...base, provider: 'openai', env: { OPENAI_API_KEY: 'sk-secret' }, fetch: fn }),
    (e: unknown) => /empty response/.test((e as Error).message) && !(e as Error).message.includes('sk-secret'),
  );
});
