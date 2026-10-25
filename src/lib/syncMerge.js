const ARRAY_KEYS = [
  "sessions",
  "bodyLogs",
  "fuelLogs",
  "studySessions",
  "cleanLog",
  "runs",
  "fees",
];

export function emptyLedger(s) {
  return ARRAY_KEYS.every((k) => !s?.[k]?.length);
}

export function isLedgerState(s) {
  if (!s || typeof s !== "object" || s.version !== 1) return false;
  if (!s.plan || !Array.isArray(s.plan.split)) return false;
  return ARRAY_KEYS.every((k) => Array.isArray(s[k]));
}

function itemKey(kind, item, index) {
  if (!item || typeof item !== "object") return `${kind}:${index}`;
  if (item.id) return `${kind}:id:${item.id}`;
  if (kind === "cleanLog" && item.date) return `clean:${item.date}`;
  if (kind === "bodyLogs" && item.date) return `body:${item.date}`;
  if (kind === "fuelLogs" && item.date) return `fuel:${item.date}:${item.meal || ""}`;
  if (kind === "runs" && item.date) return `run:${item.date}:${item.km ?? ""}:${item.minutes ?? ""}`;
  if (kind === "fees" && item.date) return `fee:${item.date}:${item.name || ""}`;
  if (kind === "studySessions" && item.date) {
    return `study:${item.date}:${item.minutes ?? ""}:${item.tag || ""}:${item.source || ""}`;
  }
  if (kind === "sessions" && item.date) return `session:${item.date}:${item.dayName || ""}`;
  return `${kind}:json:${JSON.stringify(item)}`;
}

function mergeArray(kind, a = [], b = []) {
  const map = new Map();
  [...a, ...b].forEach((item, i) => {
    map.set(itemKey(kind, item, i), item);
  });
  return [...map.values()];
}

function newerSettings(local, remote) {
  const ls = local?.settings || {};
  const rs = remote?.settings || {};
  return { ...rs, ...ls };
}

/** Union logs from two devices; keep local plan/profile when both exist. */
export function mergeLedgers(local, remote) {
  if (!isLedgerState(local) && isLedgerState(remote)) return remote;
  if (!isLedgerState(remote) && isLedgerState(local)) return local;
  if (!isLedgerState(local) && !isLedgerState(remote)) return local || remote;

  const out = {
    ...remote,
    ...local,
    version: 1,
    plan: local.plan || remote.plan,
    profile: { ...(remote.profile || {}), ...(local.profile || {}) },
    settings: newerSettings(local, remote),
  };
  for (const k of ARRAY_KEYS) {
    out[k] = mergeArray(k, remote[k], local[k]);
  }
  return out;
}
