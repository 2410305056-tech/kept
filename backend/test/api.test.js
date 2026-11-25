import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function startServer() {
  const directory = await mkdtemp(join(tmpdir(), 'kept-api-test-'));
  const port = 15000 + Math.floor(Math.random() * 20000);
  const child = spawn(process.execPath, ['src/server.js'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, PORT: String(port), KEPT_DATA_FILE: join(directory, 'entries.json'), DATABASE_URL: '' },
    stdio: 'ignore'
  });
  const base = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { await fetch(`${base}/api/health`); break; } catch { await new Promise((resolve) => setTimeout(resolve, 100)); }
  }
  return { child, base, directory };
}

test('health, create, list, validation, and delete work with persistent file storage', async (t) => {
  const app = await startServer();
  t.after(async () => { app.child.kill(); await once(app.child, 'exit').catch(() => {}); await rm(app.directory, { recursive: true, force: true }); });
  const health = await (await fetch(`${app.base}/api/health`)).json();
  assert.equal(health.status, 'ok');
  assert.equal(health.storage, 'local-json');
  const input = { id: 'test-entry', type: 'run', title: 'Easy run', date: '2026-11-25', durationMinutes: 25, notes: '' };
  const created = await fetch(`${app.base}/api/entries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  assert.equal(created.status, 201);
  assert.equal((await created.json()).entry.id, input.id);
  const listed = await (await fetch(`${app.base}/api/entries`)).json();
  assert.equal(listed.entries.length, 1);
  const invalid = await fetch(`${app.base}/api/entries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, type: 'unknown' }) });
  assert.equal(invalid.status, 400);
  const deleted = await fetch(`${app.base}/api/entries/${input.id}`, { method: 'DELETE' });
  assert.equal(deleted.status, 200);
  assert.equal((await (await fetch(`${app.base}/api/entries`)).json()).entries.length, 0);
});
