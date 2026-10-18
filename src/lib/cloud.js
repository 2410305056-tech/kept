// Optional Supabase sync. Nothing here runs unless both env vars exist.
const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

const META_KEY = "kept.cloud.v1";
const CLIENT_KEY = "kept.clientId";

let clientPromise = null;

export function isCloudConfigured() {
  return Boolean(URL && ANON);
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
      createClient(URL, ANON, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // HashRouter owns the URL hash, so use email codes instead of magic links.
          detectSessionInUrl: false,
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

export async function requestCode(email) {
  const sb = await client();
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
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
