import { getState, replaceState, flush, subscribe } from "./store.js";
import { emptyLedger, isLedgerState, mergeLedgers } from "./syncMerge.js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const LEDGER_ID = "kept";
const META_KEY = "kept.cloud.v1";
const CLIENT_KEY = "kept.clientId";
const PUSH_DELAY_MS = 800;
const PULL_MS = 12000;
const MAX_RETRIES = 5;

let clientPromise = null;
let applyingRemote = false;
let queue = Promise.resolve();
let pushTimer = null;
let pullTimer = null;
let started = false;

export function isCloudConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON);
}

export function readCloudMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeCloudMeta(meta) {
  try {
    if (meta) localStorage.setItem(META_KEY, JSON.stringify(meta));
    else localStorage.removeItem(META_KEY);
  } catch {
    return;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("kept:cloud:meta"));
  }
}

export function getClientId() {
  try {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id =
        globalThis.crypto?.randomUUID?.() ??
        `c-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

function patchMeta(partial) {
  const prev = readCloudMeta() || {
    userId: LEDGER_ID,
    clientId: getClientId(),
    revision: 0,
    linked: true,
    dirty: false,
    conflict: false,
  };
  const next = { ...prev, ...partial, linked: true, clientId: prev.clientId || getClientId() };
  writeCloudMeta(next);
  return next;
}

async function client() {
  if (!isCloudConfigured()) throw new Error("Cloud sync is not configured.");
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_ANON, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    );
  }
  return clientPromise;
}

function isConflict(error) {
  const code = error?.code;
  const msg = String(error?.message || "");
  return (
    code === "40001" ||
    code === "PGRST301" ||
    /revision_conflict|serialization|could not serialize/i.test(msg)
  );
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function currentSession() {
  if (!isCloudConfigured()) return null;
  return { user: { id: LEDGER_ID, email: null } };
}

export async function consumeAuthRedirect() {
  return null;
}

export async function requestCode() {}
export async function verifyCode() {
  throw new Error("Sign-in is disabled. Data syncs automatically.");
}
export async function signInWithPassword() {
  throw new Error("Sign-in is disabled. Data syncs automatically.");
}
export async function signUpWithPassword() {
  throw new Error("Sign-in is disabled. Data syncs automatically.");
}
export async function signOutCloud() {
  writeCloudMeta(null);
}

export async function fetchCloudRow() {
  const sb = await client();
  const { data, error } = await sb
    .from("kept_ledger")
    .select("state, revision, updated_at")
    .eq("id", LEDGER_ID)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function pushCloudState(state, baseRevision = 0, clientId = null) {
  if (!isLedgerState(state)) {
    const err = new Error("Local state is not a valid ledger.");
    err.code = "invalid_state";
    throw err;
  }
  const sb = await client();
  const { data, error } = await sb.rpc("push_kept_ledger", {
    p_id: LEDGER_ID,
    p_state: state,
    p_base_revision: Number(baseRevision) || 0,
    p_client_id: clientId || getClientId(),
  });
  if (error) {
    const err = new Error(isConflict(error) ? "Cloud data changed on another device." : error.message);
    err.code = isConflict(error) ? "conflict" : "push_failed";
    throw err;
  }
  return Number(data);
}

function applyRemote(state, revision) {
  if (!isLedgerState(state)) return false;
  applyingRemote = true;
  try {
    replaceState(state);
  } finally {
    applyingRemote = false;
  }
  patchMeta({
    revision: Number(revision) || 0,
    dirty: false,
    conflict: false,
    lastSyncAt: new Date().toISOString(),
    lastError: null,
  });
  return true;
}

function enqueue(task) {
  const run = queue.then(task, task);
  queue = run.then(
    () => {},
    () => {}
  );
  return run;
}

async function pushWithRetry() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  flush();
  let base = Number(readCloudMeta()?.revision) || 0;
  let payload = getState();

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const revision = await pushCloudState(payload, base, getClientId());
      patchMeta({
        revision,
        dirty: false,
        conflict: false,
        lastSyncAt: new Date().toISOString(),
        lastError: null,
      });
      return revision;
    } catch (err) {
      if (err.code === "conflict") {
        const row = await fetchCloudRow();
        if (!row) {
          base = 0;
          continue;
        }
        payload = mergeLedgers(getState(), row.state);
        if (isLedgerState(payload) && payload !== getState()) {
          applyingRemote = true;
          try {
            replaceState(payload);
          } finally {
            applyingRemote = false;
          }
        }
        base = Number(row.revision) || 0;
        continue;
      }
      patchMeta({ lastError: err.message, conflict: false });
      await sleep(300 * 2 ** attempt);
    }
  }
}

async function pullIfClean() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  const meta = readCloudMeta();
  if (meta?.dirty) return;
  const row = await fetchCloudRow();
  if (!row || !isLedgerState(row.state)) return;
  if (Number(row.revision) <= Number(meta?.revision ?? 0)) return;
  applyRemote(row.state, row.revision);
}

async function bootstrap() {
  const row = await fetchCloudRow();
  const local = getState();
  const meta = readCloudMeta();

  if (!row) {
    await pushWithRetry();
    if (!readCloudMeta()?.linked) patchMeta({ revision: 1, dirty: false });
    return;
  }

  if (!isLedgerState(row.state)) {
    await pushWithRetry();
    return;
  }

  if (emptyLedger(local) && !emptyLedger(row.state)) {
    applyRemote(row.state, row.revision);
    return;
  }

  if (emptyLedger(row.state) && !emptyLedger(local)) {
    patchMeta({ revision: Number(row.revision) || 0, dirty: true });
    await pushWithRetry();
    return;
  }

  if (meta?.dirty) {
    patchMeta({ revision: Number(row.revision) || meta.revision || 0, dirty: true });
    const merged = mergeLedgers(local, row.state);
    applyingRemote = true;
    try {
      replaceState(merged);
    } finally {
      applyingRemote = false;
    }
    await pushWithRetry();
    return;
  }

  if (Number(row.revision) >= Number(meta?.revision ?? 0)) {
    applyRemote(row.state, row.revision);
  } else {
    patchMeta({ revision: Number(meta?.revision) || 0, dirty: true });
    await pushWithRetry();
  }
}

export async function linkIfNeeded() {
  return enqueue(bootstrap);
}

function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    enqueue(pushWithRetry);
  }, PUSH_DELAY_MS);
}

export function startCloudSync() {
  if (!isCloudConfigured() || started || typeof window === "undefined") {
    return () => {};
  }
  started = true;

  const unsub = subscribe(() => {
    if (applyingRemote) return;
    patchMeta({ dirty: true });
    schedulePush();
  });

  const onVisible = () => {
    if (document.visibilityState === "visible") enqueue(pullIfClean);
  };
  const flushPush = () => {
    flush();
    enqueue(pushWithRetry);
  };
  const onHidden = () => {
    if (document.visibilityState === "hidden") flushPush();
  };
  const onOnline = () => enqueue(async () => {
    await bootstrap();
  });

  document.addEventListener("visibilitychange", onVisible);
  document.addEventListener("visibilitychange", onHidden);
  window.addEventListener("online", onOnline);
  window.addEventListener("pagehide", flushPush);

  pullTimer = setInterval(() => {
    if (document.visibilityState === "visible") enqueue(pullIfClean);
  }, PULL_MS);

  enqueue(bootstrap);

  return () => {
    started = false;
    unsub();
    if (pushTimer) clearTimeout(pushTimer);
    if (pullTimer) clearInterval(pullTimer);
    document.removeEventListener("visibilitychange", onVisible);
    document.removeEventListener("visibilitychange", onHidden);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("pagehide", flushPush);
  };
}
