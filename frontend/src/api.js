const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const STORAGE_KEY = 'kept.entries.v1';

export function readLocalEntries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

async function request(path, options = {}) {
  if (!API_URL) throw new Error('API is not configured');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `API request failed (${response.status})`);
  return result;
}

export const apiConfigured = Boolean(API_URL);

export async function fetchEntries() {
  return (await request('/api/entries')).entries;
}

export async function saveEntry(entry) {
  return (await request('/api/entries', { method: 'POST', body: JSON.stringify(entry) })).entry;
}

export async function deleteRemoteEntry(id) {
  return request(`/api/entries/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
