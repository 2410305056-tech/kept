import { diffDays, addDays } from "./dates.js";

export const round2_5 = (n) => Math.round(n / 2.5) * 2.5;

export function weekNumber(plan, dateKey) {
  const d = diffDays(plan.startDate, dateKey);
  if (d < 0) return 1;
  return Math.min(12, Math.floor(d / 7) + 1);
}

export function phaseForWeek(w) {
  if (w <= 4) return "foundation";
  if (w <= 7) return "build";
  if (w === 8) return "deload";
  return "push";
}

export function setsFor(ex, week) {
  if (week === 8) return Math.min(2, ex.sets);
  const p = phaseForWeek(week);
  const bump = (p === "build" || p === "push") && ex.bump ? 1 : 0;
  return ex.sets + bump;
}

export function lastLogged(exId, sessions) {
  const sorted = sessions
    .filter((s) => s.exercises.some((e) => e.exerciseId === exId))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) return null;
  const s = sorted[sorted.length - 1];
  return { session: s, entry: s.exercises.find((e) => e.exerciseId === exId) };
}

export function suggestWeight(ex, sessions, week = 0) {
  const last = lastLogged(ex.id, sessions);
  const sets = last?.entry?.sets?.filter((s) => s.done && s.reps > 0) ?? [];
  if (!sets.length) return { weight: ex.startWeightKg, reason: "start" };

  const w = Math.max(...sets.map((s) => s.weightKg));
  // Required set count is phase-aware: weeks 5-7 and 9-12 prescribe extra sets on bump lifts.
  const targetSets = week > 0 ? setsFor(ex, week) : ex.sets;
  const atTop = (s) => s.reps >= ex.repHigh && (s.rir ?? ex.rir) <= 2;
  const topCount = sets.filter(atTop).length;
  // One-rep grace: with 4-5 prescribed sets the final set often misses the top
  // by a single rep. Allow exactly one such set when every other set is at top.
  const graceFloor = Math.max(ex.repHigh - 1, ex.repLow);
  const grace =
    targetSets > 1 &&
    sets.length >= targetSets &&
    topCount === targetSets - 1 &&
    sets.every((s) => s.reps >= graceFloor && (s.rir ?? ex.rir) <= 2);
  const allTop = sets.length >= targetSets && (topCount === targetSets || grace);

  // consecutive sessions where the bottom of the range was missed
  const hist = sessions
    .filter((s) => s.exercises.some((e) => e.exerciseId === ex.id))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-2);
  const missCount = hist.filter((s) => {
    const e = s.exercises.find((x) => x.exerciseId === ex.id);
    return e?.sets?.filter((x) => x.done)?.some((x) => x.reps < ex.repLow);
  }).length;

  if (missCount >= 2) return { weight: round2_5(w * 0.9), reason: "down" };
  if (allTop) return { weight: w + ex.incrementKg, reason: "up" };
  return { weight: w, reason: "hold" };
}

// Deload keeps the last weight — never add load in week 8.
export function suggestForWeek(ex, sessions, week) {
  const base = suggestWeight(ex, sessions, week);
  if (week !== 8) return base;
  const last = lastLogged(ex.id, sessions);
  const sets = last?.entry?.sets?.filter((s) => s.done) ?? [];
  return sets.length
    ? { weight: Math.max(...sets.map((s) => s.weightKg)), reason: "deload" }
    : base;
}

export function cleanStats(log, today) {
  const map = new Map(log.map((x) => [x.date, x.status]));
  let cur = 0;
  let d = map.get(today) === "clean" ? today : addDays(today, -1);
  while (map.get(d) === "clean") {
    cur++;
    d = addDays(d, -1);
  }

  let best = 0;
  let run = 0;
  const days = [...log].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 0; i < days.length; i++) {
    const isClean = days[i].status === "clean";
    const consecutive = i > 0 && diffDays(days[i - 1].date, days[i].date) === 1;
    run = isClean ? (consecutive ? run + 1 : 1) : 0;
    if (run > best) best = run;
  }

  const mp = today.slice(0, 7);
  const elapsed = Math.max(1, Number(today.slice(8, 10)));
  const cleanDays = log.filter((x) => x.date.startsWith(mp) && x.status === "clean").length;
  return { current: cur, best, monthlyPct: Math.round((cleanDays / elapsed) * 100) };
}

export function runningUnlocked(bodyLogs, today) {
  if (today < "2026-11-16") return false;
  const logs = [...bodyLogs]
    .filter((l) => l && l.date <= today && Number.isFinite(Number(l.weightKg)))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (logs.length < 2) return false;

  const mean = (arr) => arr.reduce((acc, l) => acc + Number(l.weightKg), 0) / arr.length;
  const recent = logs.slice(-3);
  const prior = logs.slice(-6, -3);

  // Not enough history to smooth: compare the two most recent weigh-ins.
  if (!prior.length) {
    return Number(recent[recent.length - 1].weightKg) > Number(recent[0].weightKg);
  }

  // Compare 3-day averages so one water-weight dip does not flap the gate.
  return mean(recent) > mean(prior) + 0.05;
}

export function marksFor(date, state) {
  return {
    gym: state.sessions.some((s) => s.date === date),
    run: state.runs.some((r) => r.date === date),
    study: state.studySessions.some((s) => s.date === date),
    clean: state.cleanLog.some((c) => c.date === date && c.status === "clean"),
    slip: state.cleanLog.some((c) => c.date === date && c.status === "slip"),
  };
}
