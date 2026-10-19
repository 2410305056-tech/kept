import React, { useEffect, useState, useContext } from "react";
import { useStore } from "../../hooks/useStore.js";
import { getState, replaceState } from "../../lib/store.js";
import {
  isCloudConfigured,
  currentSession,
  requestCode,
  verifyCode,
  signOutCloud,
  fetchCloudRow,
  pushCloudState,
  readCloudMeta,
  writeCloudMeta,
  getClientId,
} from "../../lib/cloud.js";
import { ToastContext } from "../../context/ToastContext.js";
import { Card } from "./Card.jsx";
import { Button } from "./Button.jsx";

const emptyData = (s) =>
  ["sessions", "bodyLogs", "fuelLogs", "studySessions", "cleanLog", "runs", "fees"].every(
    (k) => !s?.[k]?.length
  );

const summary = (s) =>
  [
    `${s?.sessions?.length || 0} workouts`,
    `${s?.studySessions?.length || 0} study`,
    `${s?.cleanLog?.length || 0} clean`,
    `${s?.runs?.length || 0} runs`,
  ].join(" · ");

const stamp = (iso) => (iso ? iso.slice(0, 16).replace("T", " ") : "");

export function CloudPanel() {
  const [state] = useStore();
  const { showToast } = useContext(ToastContext);

  const [session, setSession] = useState(null);
  const [meta, setMeta] = useState(readCloudMeta());
  const [row, setRow] = useState(null);
  const [stage, setStage] = useState("email"); // email | code | signedIn
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(isCloudConfigured());
  const [error, setError] = useState("");
  const [showPullConfirm, setShowPullConfirm] = useState(false);

  const applyPull = (r, user) => {
    replaceState(r.state);
    const next = {
      userId: user?.id,
      email: user?.email,
      clientId: getClientId(),
      revision: Number(r.revision),
      linked: true,
      dirty: false,
      conflict: false,
      lastSyncAt: new Date().toISOString(),
    };
    writeCloudMeta(next);
    setMeta(next);
    setRow(r);
  };

  const uploadLocal = async (baseRevision, user) => {
    const revision = await pushCloudState(
      getState(),
      baseRevision,
      getClientId()
    );
    const next = {
      userId: user?.id,
      email: user?.email,
      clientId: getClientId(),
      revision,
      linked: true,
      dirty: false,
      conflict: false,
      lastSyncAt: new Date().toISOString(),
    };
    writeCloudMeta(next);
    setMeta(next);
    showToast("This device now syncs to the cloud");
  };

  const completeSignIn = async (s) => {
    setSession(s);
    setStage("signedIn");
    const r = await fetchCloudRow();
    setRow(r);
    if (readCloudMeta()?.linked) return;
    if (!r) {
      await uploadLocal(0, s.user);
    } else if (emptyData(getState())) {
      applyPull(r, s.user);
      showToast("Cloud data restored to this device");
    } else {
      showToast("Signed in. Choose which copy to keep below.");
    }
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!isCloudConfigured()) {
        setChecking(false);
        return;
      }
      try {
        const s = await currentSession();
        if (!alive) return;
        if (s) await completeSignIn(s);
      } catch (err) {
        if (alive) setError(err.message || "Could not reach the cloud.");
      } finally {
        if (alive) setChecking(false);
      }
    })();

    const onMeta = () => setMeta(readCloudMeta());
    const onAuth = async () => {
      try {
        const s = await currentSession();
        if (!alive || !s) return;
        await completeSignIn(s);
      } catch (err) {
        if (alive) setError(err.message);
      }
    };
    window.addEventListener("kept:cloud:meta", onMeta);
    window.addEventListener("kept:cloud:auth", onAuth);
    return () => {
      alive = false;
      window.removeEventListener("kept:cloud:meta", onMeta);
      window.removeEventListener("kept:cloud:auth", onAuth);
    };
  }, []);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await requestCode(email.trim());
      setStage("code");
      showToast("Check your email for the sign-in link.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      setError("Enter the code from the email.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const s = await verifyCode(email.trim(), code);
      await completeSignIn(s);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSyncNow = async () => {
    if (!meta?.linked) return;
    setBusy(true);
    setError("");
    try {
      if (meta.dirty || meta.conflict) {
        let base = meta.revision ?? 0;
        if (meta.conflict) {
          const latest = await fetchCloudRow();
          if (latest) base = Number(latest.revision);
        }
        const revision = await pushCloudState(
          getState(),
          base,
          getClientId()
        );
        const next = {
          ...meta,
          revision,
          dirty: false,
          conflict: false,
          lastSyncAt: new Date().toISOString(),
        };
        writeCloudMeta(next);
        setMeta(next);
        showToast("Uploaded this device");
      } else {
        const r = await fetchCloudRow();
        if (r && Number(r.revision) > Number(meta.revision ?? 0)) {
          applyPull(r, session?.user);
          showToast("Pulled the latest cloud data");
        } else {
          showToast("Already up to date");
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleForcePull = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetchCloudRow();
      if (!r) {
        showToast("No cloud data yet");
        return;
      }
      applyPull(r, session?.user);
      showToast("Cloud data restored to this device");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    setError("");
    try {
      await signOutCloud();
      setSession(null);
      setMeta(null);
      setRow(null);
      setStage("email");
      setCode("");
      setShowPullConfirm(false);
      showToast("Signed out of cloud sync");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!isCloudConfigured()) {
    return (
      <Card className="space-y-3">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
          <h3 className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-3)]">
            Cloud Sync
          </h3>
          <span className="text-[11px] font-mono text-[var(--text-3)]">Off</span>
        </div>
        <p className="text-xs text-[var(--text-3)] leading-relaxed">
          Not configured. Set <code>VITE_SUPABASE_URL</code> and{" "}
          <code>VITE_SUPABASE_ANON_KEY</code> at build time. Until then the app
          stays fully local.
        </p>
      </Card>
    );
  }

  const linked = Boolean(meta?.linked);
  const cloudTime = stamp(row?.updated_at);

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
        <h3 className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-3)]">
          Cloud Sync
        </h3>
        <span className="text-[11px] font-mono text-[var(--text-2)]">
          {checking ? "Checking..." : session ? session.user.email : "Supabase"}
        </span>
      </div>

      {!session && !checking && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--text-3)]">
            Sign in with email. Open the link on this device, or paste the code
            from the email if your template includes one.
          </p>

          {stage === "email" ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="h-11 flex-1 px-3 bg-[var(--surface-1)] border border-[var(--line)] text-sm font-mono text-[var(--text-1)] rounded-[8px] outline-none focus:border-[var(--accent)]"
              />
              <Button
                variant="primary"
                size="md"
                onClick={handleSendCode}
                disabled={busy}
              >
                {busy ? "Sending..." : "Send code"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  className="h-11 flex-1 px-3 bg-[var(--surface-1)] border border-[var(--line)] text-base font-mono tracking-[0.3em] text-[var(--text-1)] rounded-[8px] outline-none focus:border-[var(--accent)]"
                />
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleVerify}
                  disabled={busy}
                >
                  {busy ? "Verifying..." : "Verify"}
                </Button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStage("email");
                  setCode("");
                  setError("");
                }}
                className="text-[11px] font-mono text-[var(--text-3)] hover:text-[var(--text-2)] underline underline-offset-2"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>
      )}

      {session && (
        <div className="space-y-3">
          {!linked ? (
            row ? (
              <>
                <p className="text-xs text-[var(--text-2)]">
                  Cloud copy from{" "}
                  <strong className="text-[var(--text-1)]">{cloudTime} UTC</strong>:{" "}
                  {summary(row.state)}
                </p>
                <p className="text-xs text-[var(--text-3)]">
                  This device: {summary(state)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setShowPullConfirm(true)}
                    disabled={busy}
                  >
                    Use cloud data
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={async () => {
                      setBusy(true);
                      setError("");
                      try {
                        await uploadLocal(row.revision, session?.user);
                      } catch (err) {
                        setError(err.message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                    disabled={busy}
                  >
                    Upload this device
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-[var(--text-3)]">
                  No cloud copy yet. Upload this device to start syncing.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      await uploadLocal(0, session?.user);
                    } catch (err) {
                      setError(err.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                  disabled={busy}
                >
                  Upload this device
                </Button>
              </>
            )
          ) : (
            <>
              <p className="text-xs text-[var(--text-2)]">
                Auto-sync on.{" "}
                {meta?.lastSyncAt
                  ? `Last sync ${stamp(meta.lastSyncAt)} UTC.`
                  : "Waiting for first sync."}
              </p>
              {meta?.conflict && (
                <p className="text-xs font-mono text-[var(--warn)]">
                  Conflict: another device changed the cloud copy. Choose Sync now
                  (upload) or Pull cloud copy.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSyncNow}
                  disabled={busy}
                >
                  {busy ? "Syncing..." : "Sync now"}
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setShowPullConfirm(true)}
                  disabled={busy}
                >
                  Pull cloud copy
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleSignOut}
                  disabled={busy}
                >
                  Sign out
                </Button>
              </div>
            </>
          )}

          {showPullConfirm && (row || linked) && (
            <div className="p-3 bg-[var(--surface-2)] border border-[var(--warn)]/50 rounded-[8px] space-y-2">
              <p className="text-xs font-mono text-[var(--text-2)]">
                Replace everything on this device with the cloud copy? This cannot
                be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setShowPullConfirm(false);
                    if (linked) handleForcePull();
                    else {
                      applyPull(row, session?.user);
                      showToast("Cloud data restored to this device");
                    }
                  }}
                  disabled={busy}
                >
                  Replace this device
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setShowPullConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!linked && (
            <button
              type="button"
              onClick={handleSignOut}
              className="text-[11px] font-mono text-[var(--text-3)] hover:text-[var(--text-2)] underline underline-offset-2"
            >
              Sign out
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="text-[11px] font-mono text-[var(--danger)] break-words">
          {error}
        </p>
      )}
    </Card>
  );
}
