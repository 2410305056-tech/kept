import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const localFile = process.env.KEPT_DATA_FILE || join(here, '..', 'data', 'entries.json');
const postgresUrl = process.env.DATABASE_URL;
let pool;
let initialized;

export function storageMode() { return postgresUrl ? 'postgres' : 'local-json'; }

async function getPool() {
  if (!postgresUrl) return null;
  if (!pool) {
    const { Pool } = await import('pg');
    pool = new Pool({ connectionString: postgresUrl, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined });
  }
  if (!initialized) initialized = pool.query(`CREATE TABLE IF NOT EXISTS kept_entries (
    id TEXT PRIMARY KEY,
    entry JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await initialized;
  return pool;
}

async function readFileEntries() {
  try {
    const data = await readFile(localFile, 'utf8');
    const entries = JSON.parse(data);
    return Array.isArray(entries) ? entries : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeFileEntries(entries) {
  await mkdir(dirname(localFile), { recursive: true });
  const tempFile = `${localFile}.tmp`;
  await writeFile(tempFile, JSON.stringify(entries, null, 2));
  await rename(tempFile, localFile);
}

export async function listEntries() {
  const db = await getPool();
  if (db) {
    const result = await db.query('SELECT entry FROM kept_entries ORDER BY created_at DESC');
    return result.rows.map((row) => row.entry);
  }
  return (await readFileEntries()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveEntry(entry) {
  const db = await getPool();
  if (db) {
    const result = await db.query(
      'INSERT INTO kept_entries (id, entry, created_at) VALUES ($1, $2::jsonb, $3) ON CONFLICT (id) DO UPDATE SET entry = EXCLUDED.entry RETURNING entry',
      [entry.id, JSON.stringify(entry), entry.createdAt]
    );
    return result.rows[0].entry;
  }
  const entries = await readFileEntries();
  const index = entries.findIndex((item) => item.id === entry.id);
  if (index >= 0) entries[index] = entry; else entries.push(entry);
  await writeFileEntries(entries);
  return entry;
}

export async function deleteEntry(id) {
  const db = await getPool();
  if (db) {
    const result = await db.query('DELETE FROM kept_entries WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
  const entries = await readFileEntries();
  const next = entries.filter((entry) => entry.id !== id);
  if (next.length === entries.length) return false;
  await writeFileEntries(next);
  return true;
}
