import { getState, replaceState } from "./store.js";

// Optional Supabase sync. Nothing here runs unless both env vars exist.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

const EMPTY_KEYS = [
  "sessions",
  "bodyLogs",
  "fuelLogs",
  "studySessions",
  "cleanLog",
  "runs",
  "fees",
];

function emptyData(s) {
  return EMPTY_KEYS.every((k) => !s?.[k]?.length);
}

const META_KEY = "kept.cloud.v1";
const CLIENT_KEY = "kept.clientId";

let clientPromise = null;
let linkPromise = null;

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

async function client() {
  if (!isCloudConfigured()) throw new Error("Cloud sync is not configured.");
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_ANON, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          flowType: "implicit",
        },
      })
    );
  }
  return clientPromise;
}

export async function currentSession() {
  if (!isCloudConfigured()) return null;
  const sb = await client();
  const { data } = await sb.auth.getSession();
  return data.session ?? null;
}

function authParams() {
  const query = new URLSearchParams(window.location.search);
  let stored = "";
  try {
    stored = sessionStorage.getItem("kept.auth.hash") || "";
    if (stored) sessionStorage.removeItem("kept.auth.hash");
  } catch {
    stored = "";
  }
  const raw = (stored || window.location.hash || "").replace(/^#/, "");
  const body = raw.startsWith("/") ? raw.slice(1).replace(/^\?/, "") : raw;
  const hash = new URLSearchParams(body.includes("=") ? body : "");
  return { query, hash };
}

// Magic-link tokens land in the URL hash. An inline script in index.html
// stashes them before HashRouter can treat the fragment as a route.
export async function consumeAuthRedirect() {
  if (!isCloudConfigured() || typeof window === "undefined") return null;
  const { query, hash } = authParams();
  const accessToken = hash.get("access_token") || query.get("access_token");
  const refreshToken = hash.get("refresh_token") || query.get("refresh_token");
  const code = query.get("code") || hash.get("code");
  const tokenHash = query.get("token_hash") || hash.get("token_hash");
  if (!accessToken && !code && !tokenHash) return null;

  const sb = await client();
  let session = null;
  if (accessToken && refreshToken) {
    const { data, error } = await sb.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    session = data.session ?? null;
  } else if (code) {
    const { data, error } = await sb.auth.exchangeCodeForSession(code);
    if (error) throw error;
    session = data.session ?? null;
  } else {
    const { data, error } = await sb.auth.verifyOtp({
      token_hash: tokenHash,
      type: query.get("type") || hash.get("type") || "email",
    });
    if (error) throw error;
    session = data.session ?? null;
  }

  const url = new URL(window.location.href);
  url.search = "";
  window.history.replaceState({}, "", `${url.pathname}#/`);
  try {
    await linkIfNeeded();
  } catch (err) {
    console.warn("Cloud link after sign-in failed:", err);
  }
  window.dispatchEvent(new Event("kept:cloud:auth"));
  return session;
}

export async function requestCode(email) {
  const sb = await client();
  const redirect =
    typeof window !== "undefined"
      ? `${window.location.origin}${import.meta.env.BASE_URL}`
      : undefined;
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: redirect },
  });
  if (error) throw error;
}

export async function verifyCode(email, token) {
  const sb = await client();
  const { data, error } = await sb.auth.verifyOtp({
    email,
    token: token.trim(),
    type: "email",
  });
  if (error) throw error;
  if (!data.session) throw new Error("Verification did not return a session.");
  return data.session;
}

export async function signInWithPassword(email, password) {
  const sb = await client();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error("Sign-in did not return a session.");
  await linkIfNeeded();
  window.dispatchEvent(new Event("kept:cloud:auth"));
  return data.session;
}

export async function signUpWithPassword(email, password) {
  const sb = await client();
  const redirect =
    typeof window !== "undefined"
      ? `${window.location.origin}${import.meta.env.BASE_URL}`
      : undefined;
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirect },
  });
  if (error) throw error;
  if (data.session) {
    await linkIfNeeded();
    window.dispatchEvent(new Event("kept:cloud:auth"));
    return { session: data.session, needsConfirm: false };
  }
  return { session: null, needsConfirm: true };
}

export async function signOutCloud() {
  const sb = await client();
  await sb.auth.signOut();
  writeCloudMeta(null);
}

export async function fetchCloudRow() {
  const sb = await client();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) throw new Error("Not signed in.");

  const { data, error } = await sb
    .from("kept_state")
    .select("state, revision, updated_at")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Atomic compare-and-set in Postgres. A stale base revision raises 40001.
export async function pushCloudState(state, baseRevision = 0, clientId = null) {
  const sb = await client();
  const { data, error } = await sb.rpc("push_kept_state", {
    p_state: state,
    p_base_revision: baseRevision ?? 0,
    p_client_id: clientId,
  });

  if (error) {
    const conflict =
      error.code === "40001" || /revision_conflict/i.test(error.message || "");
    const err = new Error(
      conflict ? "Cloud data changed on another device." : error.message
    );
    err.code = conflict ? "conflict" : "push_failed";
    throw err;
  }
  return Number(data);
}

function writeLinkedMeta(user, revision) {
  const next = {
    userId: user?.id,
    email: user?.email,
    clientId: getClientId(),
    revision: Number(revision) || 0,
    linked: true,
    dirty: false,
    conflict: false,
    lastSyncAt: new Date().toISOString(),
  };
  writeCloudMeta(next);
  return next;
}

// After a session exists, attach this device. Safe to call from any page —
// background sync is gated on meta.linked, not on visiting Progress.
export async function linkIfNeeded() {
  if (linkPromise) return linkPromise;
  linkPromise = (async () => {
    const session = await currentSession();
    if (!session) return { session: null, linked: false };
    if (readCloudMeta()?.linked) return { session, linked: true, action: "already" };

    const row = await fetchCloudRow();
    if (!row) {
      const revision = await pushCloudState(getState(), 0, getClientId());
      writeLinkedMeta(session.user, revision);
      return { session, linked: true, action: "upload" };
    }

    if (emptyData(getState())) {
      replaceState(row.state);
      writeLinkedMeta(session.user, row.revision);
      return { session, linked: true, action: "pull", row };
    }

    return { session, linked: false, action: "choose", row };
  })().finally(() => {
    linkPromise = null;
  });
  return linkPromise;
}
