export const pad = (n) => String(n).padStart(2, "0");
export const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (k) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (k, n) => {
  const d = parse(k);
  d.setDate(d.getDate() + n);
  return key(d);
};
export const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
export const weekdayIndex = (k) => (parse(k).getDay() + 6) % 7; // Monday = 0

export const formatDisplayDate = (k) => {
  if (!k) return "";
  const d = parse(k);
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
};
