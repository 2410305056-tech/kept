import { createInitialState } from "./seed.js";
import { key } from "./dates.js";

const STORAGE_KEY = "kept.v1";
let memoryState = null;
let writeTimeout = null;
let storageError = false;
const listeners = new Set();

function notify() {
  for (const listener of listeners) {
    listener(memoryState);
  }
}

export function getTodayKey() {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search || window.location.hash.split("?")[1] || "");
    const dateParam = params.get("date");
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return dateParam;
    }
  }
  return key(new Date());
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialState();
      saveToStorage(initial, true);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || !parsed.plan || !Array.isArray(parsed.sessions)) {
      const initial = createInitialState();
      saveToStorage(initial, true);
      return initial;
    }
    return parsed;
  } catch (err) {
    console.error("Storage read failed, using memory state:", err);
    storageError = true;
    return createInitialState();
  }
}

function saveToStorage(state, immediate = false) {
  if (immediate) {
    if (writeTimeout) {
      clearTimeout(writeTimeout);
      writeTimeout = null;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageError = false;
    } catch (err) {
      console.error("Storage write failed:", err);
      storageError = true;
    }
    return;
  }

  if (writeTimeout) clearTimeout(writeTimeout);
  writeTimeout = setTimeout(() => {
    writeTimeout = null;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageError = false;
    } catch (err) {
      console.error("Storage write failed:", err);
      storageError = true;
      notify();
    }
  }, 150);
}

export function initStore() {
  if (!memoryState) {
    memoryState = loadFromStorage();

    if (typeof window !== "undefined") {
      window.addEventListener("pagehide", () => flush());
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") flush();
      });
      window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const externalState = JSON.parse(e.newValue);
            if (externalState && externalState.version === 1) {
              memoryState = externalState;
              notify();
            }
          } catch (err) {
            console.error("Storage sync parse error:", err);
          }
        }
      });
    }
  }
  return memoryState;
}

export function getState() {
  if (!memoryState) initStore();
  return memoryState;
}

export function setState(updater) {
  if (!memoryState) initStore();
  const next = typeof updater === "function" ? updater(memoryState) : updater;
  memoryState = next;
  saveToStorage(next, false);
  notify();
  return memoryState;
}

export function flush() {
  if (memoryState) {
    saveToStorage(memoryState, true);
  }
}

export function resetToSeed() {
  const seed = createInitialState();
  memoryState = seed;
  saveToStorage(seed, true);
  notify();
  return seed;
}

export function replaceState(newState) {
  memoryState = newState;
  saveToStorage(newState, true);
  notify();
  return newState;
}

export function isStorageError() {
  return storageError;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
