import { useEffect, useRef } from "react";
import { subscribe, getState, replaceState } from "../lib/store.js";
import {
  isCloudConfigured,
  currentSession,
  fetchCloudRow,
  pushCloudState,
  readCloudMeta,
  writeCloudMeta,
} from "../lib/cloud.js";

// Background sync: pull when this device has no pending edits, push 1.2 s after
// a local change. Local state stays authoritative while offline.
export function useCloudSync() {
  const applyingRemote = useRef(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!isCloudConfigured()) return;

    const linked = () => Boolean(readCloudMeta()?.linked);

    const push = async () => {
      if (!linked()) return;
      const session = await currentSession();
      if (!session) return;
      const meta = readCloudMeta();
      if (!meta?.linked) return;

      try {
        const revision = await pushCloudState(
          getState(),
          meta.revision ?? 0,
          meta.clientId
        );
        writeCloudMeta({
          ...meta,
          revision,
          dirty: false,
          conflict: false,
          lastSyncAt: new Date().toISOString(),
        });
      } catch (err) {
        if (err.code === "conflict") {
          writeCloudMeta({ ...meta, dirty: true, conflict: true });
        }
      }
    };

    const pull = async () => {
      if (!linked()) return;
      const session = await currentSession();
      if (!session) return;
      const meta = readCloudMeta();
      if (!meta?.linked || meta.dirty) return;

      try {
        const row = await fetchCloudRow();
        if (!row) return;
        if (Number(row.revision) > Number(meta.revision ?? 0)) {
          applyingRemote.current = true;
          replaceState(row.state);
          applyingRemote.current = false;
          writeCloudMeta({
            ...meta,
            revision: row.revision,
            dirty: false,
            conflict: false,
            lastSyncAt: new Date().toISOString(),
          });
        }
      } catch {
        // Offline or transient failure: keep the local copy.
      }
    };

    const unsubscribe = subscribe(() => {
      if (applyingRemote.current) return;
      const meta = readCloudMeta();
      if (!meta?.linked) return;
      writeCloudMeta({ ...meta, dirty: true });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(push, 1200);
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") pull();
    };
    const onOnline = () => push();
    const onPullRequest = () => pull();

    pull();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("kept:cloud:pull", onPullRequest);

    return () => {
      unsubscribe();
      if (timer.current) clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("kept:cloud:pull", onPullRequest);
    };
  }, []);
}
