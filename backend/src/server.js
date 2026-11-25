import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { deleteEntry, listEntries, saveEntry, storageMode } from './storage.js';

const port = Number(process.env.PORT || 5001);
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',').map((origin) => origin.trim()).filter(Boolean);
const types = new Set(['workout', 'run', 'study', 'habit']);

function send(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 32_000) reject(new Error('Request body is too large'));
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Request body must be valid JSON')); }
    });
    req.on('error', reject);
  });
}

function validateEntry(input) {
  const entry = {
    id: typeof input.id === 'string' && input.id.length <= 80 ? input.id : randomUUID(),
    type: input.type,
    title: typeof input.title === 'string' ? input.title.trim() : '',
    date: input.date,
    durationMinutes: Number(input.durationMinutes || 0),
    notes: typeof input.notes === 'string' ? input.notes.trim().slice(0, 400) : '',
    createdAt: typeof input.createdAt === 'string' && !Number.isNaN(Date.parse(input.createdAt)) ? input.createdAt : new Date().toISOString()
  };
  if (!types.has(entry.type)) throw new Error('type must be workout, run, study, or habit');
  if (!entry.title || entry.title.length > 100) throw new Error('title is required and must be 100 characters or fewer');
  if (typeof entry.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || Number.isNaN(Date.parse(`${entry.date}T12:00:00Z`))) throw new Error('date must use YYYY-MM-DD format');
  if (!Number.isInteger(entry.durationMinutes) || entry.durationMinutes < 0 || entry.durationMinutes > 1440) throw new Error('durationMinutes must be between 0 and 1440');
  if (entry.type !== 'habit' && entry.durationMinutes < 1) throw new Error('durationMinutes must be at least 1 for workouts, runs, and study sessions');
  return entry;
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/health') {
      return send(res, 200, { status: 'ok', service: 'kept-api', storage: storageMode() });
    }
    if (req.method === 'GET' && url.pathname === '/api/entries') {
      return send(res, 200, { entries: await listEntries() });
    }
    if (req.method === 'POST' && url.pathname === '/api/entries') {
      const entry = validateEntry(await readJson(req));
      return send(res, 201, { entry: await saveEntry(entry) });
    }
    const match = url.pathname.match(/^\/api\/entries\/([^/]+)$/);
    if (req.method === 'DELETE' && match) {
      const id = decodeURIComponent(match[1]);
      const deleted = await deleteEntry(id);
      return deleted ? send(res, 200, { deleted: true, id }) : send(res, 404, { error: 'Entry not found' });
    }
    return send(res, 404, { error: 'Route not found' });
  } catch (error) {
    const status = error.message.includes('Request body') || error.message.includes('type must') || error.message.includes('title is') || error.message.includes('date must') || error.message.includes('durationMinutes') ? 400 : 500;
    console.error(`${req.method} ${url.pathname}:`, error);
    return send(res, status, { error: status === 400 ? error.message : 'Server error' });
  }
});

server.listen(port, '0.0.0.0', () => console.log(`Kept API listening on ${port} (${storageMode()} storage)`));
