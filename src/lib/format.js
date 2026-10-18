import { parse } from "./dates.js";

export const formatDisplayDate = (k) => {
  if (!k) return "";
  const d = parse(k);
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
};

export const formatWeight = (kg) => {
  if (kg == null || isNaN(kg)) return "—";
  return Number(kg).toFixed(1).replace(/\.0$/, "");
};

export const formatMinutes = (mins) => {
  if (mins == null || isNaN(mins)) return "0m";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const formatSecondsToTimer = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export const formatPace = (minutes, km) => {
  if (!km || km <= 0 || !minutes || minutes <= 0) return "—";
  const paceDec = minutes / km;
  const pMin = Math.floor(paceDec);
  const pSec = Math.round((paceDec - pMin) * 60);
  return `${pMin}:${String(pSec).padStart(2, "0")} /km`;
};

export const formatCurrency = (amt) => {
  if (amt == null) return "₹0";
  return `₹${Number(amt).toLocaleString("en-IN")}`;
};
