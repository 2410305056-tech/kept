> **Historical generation prompt — 19 Oct 2026.** The app is built. Where this file says
> "no cloud", "no sound", or "no extras", the Implementation Status block in `SPEC.md`
> and the shipped code win. Do not remove existing features on a rebuild.

You are the entire product team — a 30-year product designer, a senior front-end engineer, and a QA engineer — building "Kept", a private single-user habit and training tracker, in this workspace.

STEP 0 — READ BEFORE ANY CODE
Read these files completely, in order: SPEC.md, DESIGN.md, HANDOFF.md.
They are the source of truth. This prompt restates the critical parts so you can build without guessing. If this prompt and a document disagree, SPEC.md and DESIGN.md win.

1. PRODUCT

- Four pillars: GYM, RUNNING, STUDY, CLEAN (no porn).
- Home is a month calendar. Each day shows four marks (gym / run / study / clean). Click a day → a panel showing everything done that day.
- Each pillar has its own route. The Gym route executes a real 12-week plan (19 Oct 2026 → 10 Jan 2027, test day 11 Jan 2027): it shows today's workout, logs every set as weight × reps, and pre-fills the next weight using the owner's progression rule.
- Single user. No accounts, no backend. Data lives in localStorage. Zero network requests after load.

2. HARD RULES — never violate

- Do NOT build: social/sharing, XP/badges/levels/confetti, AI chat, browser notifications, progress photos, cloud sync, light/dark toggle, multiple users.
- Never use red for a missed habit or a slip. Missed = --surface-3. Red is for errors only.
- One accent color per view. Numbers are mono with tabular figures.
- The gym plan must be editable in-app; never hardcode it read-only.
- No fake data. Seed only the plan; sessions, logs, and charts start empty.
- CSS 3D only (perspective / translateZ / rotateX-Y). No Three.js, no WebGL.
- No chart library. Hand-roll SVG charts.
- No CDN, no external fonts, no analytics.
- Respect prefers-reduced-motion and provide an in-app "Reduce motion" toggle.
- Must work at 320, 390, 768, 1440 px, at 200% zoom, and with keyboard only.

3. STACK (exact)

- Vite + React (18 or 19, whatever the template installs — do not downgrade).
- JavaScript / JSX only. NO TypeScript.
- Tailwind CSS v4 with @tailwindcss/vite (fall back to 3.4 only if v4 breaks).
- react-router-dom with HashRouter.
- motion (the framer-motion successor) for springs and layout transitions.
- @fontsource-variable/geist and @fontsource-variable/geist-mono (self-hosted).
- No other dependency without asking.

Commands:
  npm create vite@latest . -- --template react
  npm i react-router-dom motion tailwindcss @tailwindcss/vite @fontsource-variable/geist @fontsource-variable/geist-mono

4. FILE TREE — create exactly this

src/
  main.jsx
  App.jsx
  index.css
  routes/
    CalendarPage.jsx
    GymPage.jsx
    StudyPage.jsx
    CleanPage.jsx
    RunningPage.jsx
    ProgressPage.jsx
  gym/
    GymToday.jsx
    GymPlan.jsx
    GymLog.jsx
    GymProgress.jsx
    BodyTab.jsx
    FuelTab.jsx
    FeesTab.jsx
  components/
    ui/        Button, IconButton, Input, Stepper, Tabs, Card, Sheet, Toast,
               EmptyState, Stat, Checkbox, Chip, ProgressRing
    calendar/  MonthGrid, DayCell, DayPanel
    charts/    LineChart, BarChart, Heatmap, Sparkline
    layout/    AppShell, Rail, BottomNav, PageHeader
  hooks/       useStore, useTilt, useReducedMotion, useNow
  lib/         store.js, dates.js, logic.js, seed.js, exportImport.js, format.js
  data/        (nothing — seed lives in lib/seed.js)

Keep every component under 200 lines. No inline styles except dynamic CSS custom properties.

5. DESIGN TOKENS — put in src/index.css

:root {
  --bg:#08080A; --surface-1:#101013; --surface-2:#16161A; --surface-3:#1D1D22;
  --line:#26262C; --line-strong:#34343C;
  --text-1:#ECECEF; --text-2:#A0A0A8; --text-3:#6A6A73;
  --accent:#C8F65C; --accent-ink:#0B0C06; --accent-soft:rgba(200,246,92,.12);
  --warn:#F2C14E; --danger:#FF6B6B; --scrim:rgba(4,4,6,.72);

  --font-sans:"Geist Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono:"Geist Mono Variable", ui-monospace, "SFMono-Regular", Consolas, monospace;

  --r-xs:4px; --r-sm:8px; --r-md:12px; --r-lg:16px; --r-full:999px;

  --e1:inset 0 1px 0 rgba(255,255,255,.04), 0 1px 2px rgba(0,0,0,.50);
  --e2:inset 0 1px 0 rgba(255,255,255,.06), 0 2px 8px rgba(0,0,0,.50), 0 12px 32px -12px rgba(0,0,0,.80);
  --e3:inset 0 1px 0 rgba(255,255,255,.08), 0 24px 64px -16px rgba(0,0,0,.85);

  --d-micro:90ms; --d-fast:140ms; --d-base:200ms; --d-slow:320ms; --d-hero:600ms;
  --ease-out:cubic-bezier(.16,1,.3,1);
  --ease-in-out:cubic-bezier(.65,0,.35,1);
  --ease-exit:cubic-bezier(.4,0,1,1);
  --ease-press:cubic-bezier(.2,.7,.2,1);

  --perspective:1200px; --tilt-max:5deg;
}

Body: background var(--bg), color var(--text-1), font-family var(--font-sans), antialiased.
Add a fixed SVG grain overlay (feTurbulence, opacity .03, pointer-events:none, mix-blend-mode:overlay)
and a fixed radial vignette (transparent 60% → rgba(0,0,0,.35) 100%).

TYPOGRAPHY
  display-xl clamp(56px,9vw,104px)/.92, weight 500, tracking -.035em
  display    clamp(36px,5vw,56px)/1.0, weight 500, tracking -.03em
  h1 28/34 · h2 20/28 · body 15/24 · small 13/20
  label 11/16, uppercase, tracking +.08em
  Every number: font-family var(--font-mono), font-variant-numeric: tabular-nums.

6. LAYOUT

- Desktop: left rail 72px (4 pillar glyphs + labels, active = accent left tick), content max 1080px, padding 32px, 12-col grid, gutter 24.
- Mobile: top bar 56px (title), bottom nav 64px + safe-area, 5 items (Calendar, Gym, Study, Clean, Progress), padding 16px, 4-col grid, gutter 16.
- Spacing only from: 4 8 12 16 24 32 48 64 96.
- Radius only: 4 / 8 / 12 / 16 / 999. Never mix.
- Minimum tap target 44×44 with 8px separation.

7. MOTION

Page enter: opacity 0→1 + translateY(8px→0), 320ms ease-out, content stagger 8ms (max 8 items).
Page exit: opacity→0, 120ms.
Tab change: 120ms crossfade + 4px directional slide; active pill uses layoutId spring.
Month change: 240ms directional slide (next=left, prev=right), cells stagger 8ms.
Day cell → DayPanel: shared-element FLIP, 320ms; scrim 200ms; panel content stagger 40ms.
Mobile: the same panel is a bottom Sheet, spring {stiffness:320, damping:30}, drag-to-dismiss.
Button press: scale .98, 90ms.
Set checked: check path draws 180ms; row background flashes accent-soft and decays 400ms;
row settles scale .99→1; one 1px accent ring pulse; navigator.vibrate?.(10).
Number changes: odometer effect, translateY(40%)+blur(4px)→settle, 420ms.
Chart mount: stroke-dashoffset draw, 600ms, once per mount.
Heatmap mount: rows stagger 20ms, cells 6ms, total ≤400ms.
Toast: 180ms in, 3s, 140ms out; only one at a time.
Focus ring: instant, never animated.

Animate ONLY transform and opacity. Never width, height, top, box-shadow, or filter on large surfaces.
With prefers-reduced-motion: durations 0.01ms, no transforms, no tilt, odometer becomes a text swap,
charts render complete.

8. 3D

- .depth { transform-style:preserve-3d; perspective:var(--perspective); }
- Layers: marks translateZ(6px), floating action translateZ(12px), sheet translateZ(24px).
- Tilt max ±5°, pointer-driven, spring return {260,26}. Only on: calendar grid (desktop),
  progress week tablets, gym session card.
- NEVER tilt inputs, tables, or text being edited.
- Pointer light on hover-capable devices only:
  radial-gradient(160px circle at var(--mx) var(--my), rgba(255,255,255,.06), transparent 60%).
- All 3D behind @media (hover:hover) and (pointer:fine), disabled under reduced motion.

9. COMPONENTS — build these before screens

Button (h44,r10,accent,grotesk 13/500) · GhostButton (1px line) · IconButton (40×40)
Stepper (44h, − value +, long-press repeat) · Input (44h, surface-2, r8, accent focus ring)
Tabs (caps label, surface-2 pill, layoutId) · Card (surface-1, 1px line, r12, p20, hover lift 2px)
Sheet (bottom, r16 top, drag handle 36×4, max 88vh) · Toast · EmptyState · Stat (label 11 + mono 40)
Checkbox (20px, r4, accent fill + ink check drawn 180ms) · Chip (r4, accent-soft)
ProgressRing (2px stroke, accent, draw 600ms)
LineChart / BarChart / Heatmap / Sparkline — hand-rolled SVG, accent only, 1px gridlines at 4%,
no vertical grid, 3 time ticks, crosshair + tooltip, empty state is a dashed baseline + "No data yet".

10. ROUTES

"/" CalendarPage
  Header: month + year, ‹ › buttons, "Today" ghost, phase chip ("Week 3 · Build").
  Grid 7 cols, Mon–Sun. Cell: date top-left mono 12; marks bottom row (4 × 5px dots mobile,
  14px glyphs desktop); done = filled accent, not done = 1px outline --text-3, slip = outline
  with diagonal strike (never red). Today = accent border + accent date. Out-of-month = 30% opacity.
  Click day → DayPanel (desktop 360px right column, mobile Sheet): per-pillar rows with details,
  or "Nothing logged" + one ghost action.
"/gym" GymPage — tabs: Today(default) · Plan · Log · Progress · Body · Fuel · Fees
  Today: sticky header `Week 3 of 12 · Push A · 7:00 pm`, Finish primary. Exercise blocks:
  name 15/500, `4 × 6–8 · RIR 2` mono 13 muted. Set rows grid `44px 1fr 1fr 44px`:
  set no. · weight Stepper · reps Stepper · Checkbox. "Add set" per exercise. Notes field.
  Suggested-weight chip next to each exercise (`↑ 22.5`, tooltip explains the rule).
  Rest timer after each check: 2:00 countdown in the sticky header, tap to skip.
  Plan: accordion per day, inline edit (name, sets, repLow, repHigh, rir, startWeightKg,
  incrementKg, note), add/remove/reorder, "Reset to original plan".
  Log: reverse-chronological sessions, expandable detail, delete.
  Progress: per exercise current working weight, best set, 6-session sparkline; targets with bars.
  Body: weigh-in form, weight chart with a 68–69.5 kg target band and 0.25–0.4 kg/week healthy band,
  rate verdict (<0.25 add food / 0.25–0.4 on track / >0.5 hold), waist every 2 weeks, no photos.
  Fuel: kcal/protein/water rings, week's ramp step, post-gym meal checkbox, sample day collapsible.
  Fees: amount, due day, payment list, total this year.
"/study"
  Hero timer in display-xl mono, Start/Stop 56px accent circle. Today/week/all-time stat row.
  30-day bar chart + month heatmap. Manual entry (date + minutes). Daily target editable, default 2h.
  Persist the running timer across reloads (store startedAt).
"/clean"
  Hero streak display-xl. Best streak small mono. Two 48px buttons: "Clean today" (accent),
  "I slipped" (ghost). One mark per day, undoable 5s via toast. Month grid of marks.
  Monthly clean-day % as a mono stat.
"/running"
  Locked until 16 Nov 2026 AND last two weigh-ins increasing (SPEC §5.4). Lock card with
  countdown and the condition. After unlock: log date + minutes + optional km, auto pace,
  weekly km chart, Sunday easy run 20–30 min as the planned session.
"/progress"
  Section 1: 12 week-tablets in perspective; current week +24px Z with accent edge, past weeks
  opacity .55, future weeks outlined; desktop tilt ±5°, enter animation once.
  Section 2: 2×2 charts (gym sessions/week, study hours/week, clean %/week, km/week).
  Section 3: year heatmap, 4 rows.
  Section 4: Export / Import / Clear (typing CLEAR required).

11. DATA MODEL — localStorage key "kept.v1"

{
  version: 1,
  profile: { name, heightCm: 183, startWeightKg: 65, startWaistCm: null },
  plan: {
    name, startDate: "2026-10-19", endDate: "2027-01-10", testDate: "2027-01-11",
    phases: [
      { key:"foundation", name:"Foundation", startWeek:1, endWeek:4 },
      { key:"build",      name:"Build",      startWeek:5, endWeek:7 },
      { key:"deload",     name:"Deload",     startWeek:8, endWeek:8 },
      { key:"push",       name:"Push",       startWeek:9, endWeek:12 }
    ],
    split: [ /* 7 days, index 0 = Monday, see §12 */ ],
    nutrition: {
      kcalLow:2850, kcalHigh:2950, proteinMin:110, proteinMax:145,
      waterLow:2.5, waterHigh:3.5,
      ramp: [
        { week:1, item:"Post-gym meal (50 g peanuts + milk or sattu)", kcal:430, protein:20 },
        { week:2, item:"4 pm snack (roasted chana + banana)",          kcal:285, protein:11 },
        { week:3, item:"Mid-morning snack (peanuts + banana)",          kcal:330, protein:11 },
        { week:4, item:"Full menu",                                     kcal:0,   protein:0  }
      ]
    },
    targets: {
      weightKg:[68,69.5], waistGrowthCmMax:2,
      dbBenchKg:[30,32.5], squatKg:[60,70], deadliftKg:[115,120],
      ohpKg:[35,40], legPressKg:150, firstChinUp:true
    }
  },
  sessions: [{ id, date, dayName, week, phase, startedAt, finishedAt,
               exercises:[{ exerciseId, name, sets:[{ weightKg, reps, rir, done }] }],
               notes, totalVolume }],
  bodyLogs: [{ date, weightKg, waistCm }],
  fuelLogs: [{ date, kcal, proteinG, waterL, postGymMeal }],
  studySessions: [{ id, date, startAt, endAt, minutes, source:"timer"|"manual" }],
  activeTimer: { startedAt: null },
  cleanLog: [{ date, status:"clean"|"slip" }],
  runs: [{ id, date, minutes, km }],
  fees: [{ id, datePaid, amount, paidThrough }],
  settings: { studyTargetHours:2, reminders:true, reduceMotion:false, hadTestDayNotice:false }
}

Dates are local "YYYY-MM-DD" strings. Never store timezone-shifted ISO strings for day keys.

12. LOGIC — implement exactly (src/lib)

// dates.js
export const pad = n => String(n).padStart(2,"0");
export const key = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
export const parse = k => { const [y,m,d]=k.split("-").map(Number); return new Date(y,m-1,d); };
export const addDays = (k,n) => { const d=parse(k); d.setDate(d.getDate()+n); return key(d); };
export const diffDays = (a,b) => Math.round((parse(b)-parse(a))/86400000);
export const weekdayIndex = k => (parse(k).getDay()+6)%7;   // Mon=0

// logic.js
export const round2_5 = n => Math.round(n/2.5)*2.5;

export function weekNumber(plan, dateKey) {
  const d = diffDays(plan.startDate, dateKey);
  if (d < 0) return 1;
  return Math.min(12, Math.floor(d/7) + 1);
}

export function phaseForWeek(w) {
  if (w <= 4) return "foundation";
  if (w <= 7) return "build";
  if (w === 8) return "deload";
  return "push";
}

export function setsFor(ex, week) {
  if (week === 8) return Math.min(2, ex.sets);
  const bump = (phaseForWeek(week) === "build" || phaseForWeek(week) === "push") && ex.bump ? 1 : 0;
  return ex.sets + bump;
}

// Suggested weight — the owner's own rule.
export function suggestWeight(ex, sessions) {
  const hist = sessions
    .filter(s => s.exercises.some(e => e.exerciseId === ex.id))
    .sort((a,b) => a.date.localeCompare(b.date));
  if (!hist.length) return { weight: ex.startWeightKg, reason: "start" };

  const last = hist.at(-1).exercises.find(e => e.exerciseId === ex.id);
  const sets = last.sets.filter(s => s.done && s.reps > 0);
  if (!sets.length) return { weight: ex.startWeightKg, reason: "start" };

  const w = Math.max(...sets.map(s => s.weightKg));
  const allTop = sets.every(s => s.reps >= ex.repHigh && (s.rir ?? ex.rir) <= 2);

  const missCount = hist.slice(-2).filter(s => {
    const e = s.exercises.find(x => x.exerciseId === ex.id);
    return e?.sets.filter(x => x.done).some(x => x.reps < ex.repLow);
  }).length;

  if (missCount >= 2) return { weight: round2_5(w * 0.9), reason: "down" };
  if (allTop)         return { weight: w + ex.incrementKg, reason: "up" };
  return { weight: w, reason: "hold" };
}

export function cleanStats(log, today) {
  const map = new Map(log.map(x => [x.date, x.status]));
  let cur = 0, d = map.get(today) === "clean" ? today : addDays(today, -1);
  while (map.get(d) === "clean") { cur++; d = addDays(d, -1); }

  let best = 0, run = 0;
  const days = [...log].sort((a,b) => a.date.localeCompare(b.date));
  days.forEach((x, i) => {
    if (x.status === "clean" && (i === 0 || diffDays(days[i-1].date, x.date) === 1)) run++;
    else run = x.status === "clean" ? 1 : 0;
    best = Math.max(best, run);
  });

  const mp = today.slice(0,7);
  const elapsed = Number(today.slice(8,10));
  const cleanDays = log.filter(x => x.date.startsWith(mp) && x.status === "clean").length;
  return { current: cur, best, monthlyPct: Math.round(cleanDays / elapsed * 100) };
}

export function runningUnlocked(week, bodyLogs, today) {
  if (today < "2026-11-16") return false;
  const last = [...bodyLogs].sort((a,b) => a.date.localeCompare(b.date)).slice(-2);
  return last.length === 2 && last[1].weightKg > last[0].weightKg;
}

export function marksFor(date, state) {
  return {
    gym:   state.sessions.some(s => s.date === date),
    run:   state.runs.some(r => r.date === date),
    study: state.studySessions.some(s => s.date === date),
    clean: state.cleanLog.some(c => c.date === date && c.status === "clean"),
    slip:  state.cleanLog.some(c => c.date === date && c.status === "slip")
  };
}

// Phase volume: weeks 5–7 and 9–12 add +1 set to exercises flagged bump
// (lateral raises, rear-delt fly, incline press); week 8 = 2 sets everywhere.

13. SEED PLAN — src/lib/seed.js, exactly this content

startDate 2026-10-19 · endDate 2027-01-10 · testDate 2027-01-11 · sessions 7:00–8:10 pm.

Monday "Push A" (shoulders first):
  Barbell overhead press 4×6-8 rir2 20kg +2.5 (empty bar, +2.5/session)
  Flat barbell bench 3×6-8 rir2 45kg +2.5 ("expect 40–50")
  Incline dumbbell press 3×8-10 rir2 17.5kg +2.5 bump (15–20/hand)
  Cable lateral raise, single arm 4×12-15 rir1 5kg +1.25 bump
  Overhead cable triceps extension 3×10-12 rir1 null +1.25
  Rope pushdown 2×12-15 rir1 null +1.25

Tuesday "Pull A":
  Lat pulldown 4×8-10 rir1 40kg +2.5 (1s pause at bottom)
  Chest-supported T-bar row 4×8-10 rir1 20kg +2.5
  Close-grip low row 3×10-12 rir1 35kg +2.5
  Rear-delt fly 3×12-15 rir1 5kg +1.25 bump
  Incline dumbbell curl 3×10-12 rir1 8kg +1.25 (per hand)
  Hammer curl 2×10-12 rir1 8kg +1.25

Wednesday "Legs A":
  Barbell squat 4×6-8 rir2 20kg +5 (rack safety arms)
  Seated leg press 3×10-12 rir1 115kg +5
  Romanian deadlift 3×8-10 rir2 50kg +5
  Seated leg curl 3×10-12 rir1 30kg +2.5
  Leg extension 3×12 rir1 25kg +2.5
  Standing calf raise 4×12-15 rir1 40kg +2.5 (pause top, stretch bottom)

Thursday "Push B":
  Seated dumbbell overhead press 4×8-10 rir2 9kg +1.25
  Incline dumbbell press 3×8-10 rir2 17.5kg +2.5 bump
  Chest press machine 3×10-12 rir1 40kg +2.5
  Dumbbell lateral raise 4×15 rir1 4.5kg +1.25 bump
  Cable chest fly 3×12-15 rir1 10kg +1.25
  Triceps pushdown 3×10-12 rir1 15kg +1.25

Friday "Pull B":
  Deadlift 3×5 rir2 90kg +5 (week 1 = form check)
  Neutral-grip lat pulldown 3×8-10 rir1 40kg +2.5
  Chin-up negatives 3×3-5 rir1 null +0 (5s lower)
  Wide cable row 3×10-12 rir1 35kg +2.5
  Face pull 3×15 rir1 15kg +1.25
  Preacher curl 3×10-12 rir1 12.5kg +1.25
  Cable lateral raise 3×15 rir1 5kg +1.25

Saturday "Legs B + core":
  Leg press, feet high and wide 4×10-12 rir1 115kg +5
  Seated leg curl 3×10-12 rir1 30kg +2.5
  Dumbbell walking lunges 3×10/leg rir1 8kg +1.25
  Hip abductor 3×12-15 rir1 30kg +2.5
  Hip adductor 2×12 rir1 30kg +2.5
  Standing calf raise 4×15 rir1 40kg +2.5
  45° hyperextension 3×12 rir1 null +0
  Hanging knee raise or cable crunch 3×12 rir1 null +0

Sunday: rest. From week 5, optional easy 20–30 min jog only if weight is rising.

Rules to display in the Plan tab:
  Warm-up 7–8 min + ramp sets 50%×8, 70%×5.
  RIR 2 on squat/deadlift/bench/OHP; 1–2 on machines/cables; last isolation set 0–1 in weeks 5+.
  Rest 2–3 min compound, 60–90 s isolation. Tempo 2–3 s down, controlled.
  Short on time: first 3 exercises. Missed day: resume next scheduled, never double up.

14. PERSISTENCE

- Read "kept.v1" once on boot; if missing, create from seed. Write-through on every change,
  debounced 150ms, flushed on "pagehide" and "visibilitychange".
- Export downloads kept-YYYY-MM-DD.json.
- Import validates version, shows a confirm, then replaces state atomically.
- Clear requires typing CLEAR.

15. ACCESSIBILITY

- Visible focus: 2px var(--accent), 2px offset. Never remove the outline.
- Calendar: roving tabindex, Arrow keys, Home = today, Enter opens the day.
- Marks: aria-label, e.g. "Gym: done, 19 October". Never color-only.
- Timer: aria-live="polite" at start/stop only, not every second.
- All controls keyboard reachable; 44×44 minimum.
- Lang "en"; dates via Intl.DateTimeFormat.

16. PERFORMANCE

- JS ≤130 KB gzip, CSS ≤20 KB gzip, fonts ≤60 KB total.
- Zero network requests after load.
- content-visibility:auto on long lists; memoize derived stats.
- localStorage writes debounced; no layout reads inside pointer handlers.
- LCP <1.5s on a mid-range phone; no long tasks >50ms.

17. BUILD PHASES — complete in order, run `npm run dev` after each, fix errors, continue automatically

Phase 0 Scaffold: Vite app in place (keep the .md files), Tailwind, fonts, tokens, grain, vignette,
  base AppShell with rail + bottom nav. Exit: both layouts render; no console errors.
Phase 1 Router: 6 routes with placeholder headers, active nav states, hash routing.
Phase 2 Store: schema, seed, useStore hook, write-through, export/import/reset, debug date override
  via `?date=YYYY-MM-DD` (for testing only, no UI).
Phase 3 Calendar: MonthGrid, DayCell (4 marks), month nav, DayPanel with FLIP (desktop panel),
  mobile Sheet, keyboard grid.
Phase 4 Gym Today: correct workout from date, set rows, steppers, check animation, rest timer,
  suggested weight, notes, Finish → session saved → calendar mark.
Phase 5 Gym Plan editor: inline editing, add/remove/reorder, bump flag, reset to seed.
Phase 6 Gym Log / Progress / Body / Fuel / Fees.
Phase 7 Study: timer persisted across reload, manual entry, stats, charts.
Phase 8 Clean: marks, undo toast, streak, best, monthly %.
Phase 9 Running: lock card + unlock logic, run logging, pace, weekly chart.
Phase 10 Progress: week tablets, 4 charts, year heatmap, data tools.
Phase 11 Polish: the three signature moments, reduced-motion toggle, empty states, accessibility pass,
  responsive QA.

18. ACCEPTANCE TESTS — run these yourself, do not guess

1.  ?date=2026-10-19 → "Week 1 of 12 · Push A". Exercise order starts with Barbell overhead press.
2.  Log OHP: 4 sets, 20 kg, 8/8/8/8 reps, RIR 2, all done → Finish → Log shows the session,
    calendar G mark fills, volume = 20×32 = 640 kg.
2b. Log a session as 8/8/7/6 → volume 580, and the next suggestion holds at 20 kg
    (the top of the range was not hit on every set).
3.  Open the next Monday → OHP pre-filled 22.5 kg with an "up" chip.
4.  ?date=2026-11-16 → Week 5; lateral raise sets increase by 1; Running unlocks if two weigh-ins
    are rising.
5.  ?date=2026-12-07 → Week 8; every exercise shows 2 sets.
6.  ?date=2027-01-11 → Test day banner with start-vs-current lifts.
7.  Study: start timer 2s, stop → today total updates, calendar S mark fills; reload mid-run →
    timer resumes from the stored startedAt.
8.  Clean: mark clean → streak 1; next day clean → 2; slip → current 0, best preserved,
    monthly % recalculates.
9.  Edit an exercise name in Plan → Today, Log, and Progress all show the new name after reload.
10. Export → Clear (type CLEAR) → Import → identical state.
11. 320px: no horizontal scroll. 200% zoom: no clipped text. Keyboard: open a day with Enter.
12. DevTools Network: no requests after first load.

19. REPORT WHEN DONE

- File tree actually created.
- Phases completed, with any deviations and why.
- Acceptance tests: pass/fail for each number above, with the evidence you observed.
- Anything not verified, stated plainly. Never claim a test you did not run.
- How to run: `npm run dev`, `npm run build`, `npm run preview`.

20. RULES OF ENGAGEMENT

- Do not ask questions the documents already answer. If genuinely blocked, ask once, precisely.
- Do not add dependencies, screens, settings, onboarding, or "nice to have" features.
- Do not stop between phases for approval; only stop if a spec contradiction blocks you.
- Keep components small and named exactly as in §4.
- Prefer semantic HTML; no div soup.
- If a visual result looks wrong, fix spacing and type before adding effects.
- When in doubt, choose the more restrained option.

START NOW: reply with a 10-line build plan and the file tree you will create, then begin Phase 0.
