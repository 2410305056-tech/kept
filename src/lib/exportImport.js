import { key } from "./dates.js";

export function exportData(state) {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = key(new Date());
  a.href = url;
  a.download = `kept-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateImportData(parsed) {
  if (!parsed || typeof parsed !== "object") {
    return { valid: false, error: "Invalid JSON format: not an object" };
  }
  if (!parsed.version || parsed.version !== 1) {
    return { valid: false, error: "Unsupported version. Expected version 1." };
  }
  const requiredArrays = ["sessions", "bodyLogs", "fuelLogs", "studySessions", "cleanLog", "runs", "fees"];
  for (const arr of requiredArrays) {
    if (!Array.isArray(parsed[arr])) {
      return { valid: false, error: `Missing required data list: ${arr}` };
    }
  }
  if (!parsed.plan || !Array.isArray(parsed.plan.split)) {
    return { valid: false, error: "Missing plan or workout split" };
  }

  const summary = {
    sessions: parsed.sessions.length,
    studySessions: parsed.studySessions.length,
    cleanDays: parsed.cleanLog.filter((c) => c.status === "clean").length,
    runs: parsed.runs.length,
    bodyLogs: parsed.bodyLogs.length,
  };

  return { valid: true, summary, data: parsed };
}
