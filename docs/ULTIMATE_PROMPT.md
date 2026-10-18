# ULTIMATE PROMPT — Kept

Paste this entire file into Antigravity, in the `selftracker` workspace that contains
`SPEC.md`, `DESIGN.md`, `HANDOFF.md`, and `PROMPT.md`.

---

## 0. THE BRIEF IN ONE PARAGRAPH

Build **Kept**, a private, single-user web app that tracks four promises — gym, running, study,
clean — and executes a real 12-week gym plan. The home screen is a calendar of the truth. Each
pillar has one page. The gym page knows what today's workout is, which sets to do, what weight to
use, and what to add next time. It is a precision instrument: dark, fast, quiet, one accent,
monospace numbers, three signature motion moments, and nothing else. No accounts, no cloud, no
social, no gamification. localStorage only. It must feel like a paid product built by someone with
30 years of taste, and it must never lose a logged set.

---

## 1. FIVE THINGS TO REMEMBER

1. **The plan is the product.** The 12-week gym plan is not decoration — it drives today's screen,
   set counts, suggested weights, and the calendar.
2. **One tap is the design.** Logging a set must never require a form, a modal, or more than two taps.
3. **Truth, not praise.** No scores, no badges, no "great job". Charts and marks only.
4. **Motion explains; it never decorates.** Three moments show off. Everything else is 90–320 ms.
5. **Never lose data.** Write-through, debounce 150 ms, flush on pagehide, recover timers.

If you forget everything else, build those five.

---

## 2. READ ORDER AND CONFLICT PRIORITY

Read fully, in this order: `SPEC.md`, `DESIGN.md`, `HANDOFF.md`, then this prompt.

Conflict priority, highest first:
1. Non-goals and hard rules (§3 below, SPEC §2).
2. Data model, seed plan, and logic (SPEC §5–§7, §13–§15 below).
3. Visual and motion contract (DESIGN.md, §6–§11 below).
4. This prompt's implementation guidance.
5. Your own preference.

Never silently drop a requirement. If two requirements truly conflict, pick the more restrained
option and record it in the final report.

---

## 3. HARD RULES — violating any of these fails the task

**Never build:** social/sharing/friends · XP, badges, levels, confetti · AI coach/chat · browser
notifications · progress photos · cloud sync/accounts/login · light/dark theme toggle · multiple users.

**Always:**
- localStorage only. Zero network requests after first load.
- CSS 3D only. No Three.js, no WebGL, no 3D library.
- No chart library. Hand-rolled SVG.
- No CDN, no Google Fonts, no analytics.
- The gym plan is editable in-app; never read-only.
- No fake data: sessions, study, clean, runs start empty. Only the plan is seeded.
- Never use red (`--danger`) for a missed habit, a slip, or a broken streak.
- One accent color per view.
- Every number: mono font, tabular figures.
- Minimum tap target 44×44 px, 8 px apart.
- Respect `prefers-reduced-motion`; provide an in-app toggle.
- Correct at 320, 390, 768, 1440 px, at 200% zoom, keyboard-only.

---

## 4. ENVIRONMENT AND STACK

Windows workspace. Node 20+ assumed. Check `node -v` first; if missing, stop and say so.

```bash
npm create vite@latest . -- --template react
# keep the existing .md files when prompted
npm i react-router-dom motion tailwindcss @tailwindcss/vite \
      @fontsource-variable/geist @fontsource-variable/geist-mono
```

- React 18 or 19 — whatever Vite installs. Do not downgrade.
- **JavaScript/JSX only. No TypeScript.**
- Tailwind v4 with `@tailwindcss/vite`. Fall back to 3.4 only if v4 breaks; note it.
- `react-router-dom` with `HashRouter` (safe for static hosting and local preview).
- `motion` for springs/layout. No other animation library.
- Fonts via `@fontsource-variable/*` (self-hosted, no network at runtime).
- Ask before adding any other dependency.

Required scripts: `dev`, `build`, `preview`.

---

## 5. FILE TREE — create exactly this

```
src/
  main.jsx
  App.jsx
  index.css
  routes/
    CalendarPage.jsx  GymPage.jsx  StudyPage.jsx
    CleanPage.jsx     RunningPage.jsx  ProgressPage.jsx
  gym/
    GymToday.jsx  GymPlan.jsx  GymLog.jsx  GymProgress.jsx
    BodyTab.jsx   FuelTab.jsx  FeesTab.jsx
  components/
    ui/       Button.jsx IconButton.jsx Input.jsx Stepper.jsx Tabs.jsx Card.jsx
              Sheet.jsx Toast.jsx EmptyState.jsx Stat.jsx Checkbox.jsx
              Chip.jsx ProgressRing.jsx
    calendar/ MonthGrid.jsx DayCell.jsx DayPanel.jsx
    charts/   LineChart.jsx BarChart.jsx Heatmap.jsx Sparkline.jsx
    layout/   AppShell.jsx Rail.jsx BottomNav.jsx PageHeader.jsx
  hooks/      useStore.js useTilt.js useReducedMotion.js useNow.js
  lib/        store.js dates.js logic.js seed.js exportImport.js format.js
```

Rules: components < 200 lines. No inline styles except dynamic CSS variables (`style={{ '--rx': ... }}`).
Semantic HTML. No index files re-exporting everything.

---

## 6. DESIGN TOKENS — paste into `src/index.css`

```css
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
  --e2:inset 0 1px 0 rgba(255,255,255,.06), 0 2px 8px rgba(0,0,0,.50),
       0 12px 32px -12px rgba(0,0,0,.80);
  --e3:inset 0 1px 0 rgba(255,255,255,.08), 0 24px 64px -16px rgba(0,0,0,.85);

  --d-micro:90ms; --d-fast:140ms; --d-base:200ms; --d-slow:320ms; --d-hero:600ms;
  --ease-out:cubic-bezier(.16,1,.3,1);
  --ease-in-out:cubic-bezier(.65,0,.35,1);
  --ease-exit:cubic-bezier(.4,0,1,1);
  --ease-press:cubic-bezier(.2,.7,.2,1);

  --perspective:1200px; --tilt-max:5deg;
}
```

Body: `background:var(--bg); color:var(--text-1); font-family:var(--font-sans);`
`-webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;`

Two fixed overlays, both `pointer-events:none`, `position:fixed; inset:0`:
- Grain: inline SVG `feTurbulence` (`baseFrequency .8`), opacity `.03`, `mix-blend-mode:overlay`.
- Vignette: `radial-gradient(circle at 50% 40%, transparent 55%, rgba(0,0,0,.35) 100%)`.

---

## 7. TYPOGRAPHY

| Token | Spec |
|---|---|
| display-xl | `clamp(56px,9vw,104px)/.92`, weight 500, tracking −.035em |
| display | `clamp(36px,5vw,56px)/1.0`, weight 500, tracking −.03em |
| h1 | 28/34, 500, −.02em |
| h2 | 20/28, 500, −.01em |
| body | 15/24, 400 |
| small | 13/20, 400 |
| label | 11/16, 500, uppercase, +.08em |

All numerals: `font-family:var(--font-mono); font-variant-numeric:tabular-nums;`
Never weight 700+ on display numbers. Max line length 68ch. No centered paragraphs.

---

## 8. LAYOUT

- Desktop ≥1024: left rail 72 px (4 pillar glyphs + labels, active = accent 2 px left tick),
  content max-width 1080 px, padding 32 px, 12-col grid, gutter 24.
- Tablet 768–1023: 8-col, gutter 20, padding 24, rail collapses to 64.
- Mobile <768: top bar 56 px (title + today), bottom nav 64 px + `env(safe-area-inset-bottom)`,
  5 items (Calendar, Gym, Study, Clean, Progress), padding 16, 4-col, gutter 16.
- Spacing values only: 4 8 12 16 24 32 48 64 96.
- Radius only: 4 chips · 8 inputs · 12 cards · 16 sheets · 999 pills.
- Elevation: `--e1` rest, `--e2` interactive, `--e3` sheet / lifted week.
- No horizontal scroll at any width.

---

## 9. MOTION CONTRACT

| Interaction | Exact spec |
|---|---|
| Page enter | opacity 0→1, translateY 8px→0, 320 ms `--ease-out`; children stagger 8 ms, max 8 |
| Page exit | opacity→0, 120 ms `--ease-exit` |
| Tab change | 120 ms crossfade + 4 px directional slide; active pill `layoutId` spring |
| Month change | 240 ms directional slide (next=left, prev=right); cells stagger 8 ms |
| Day → panel | shared-element FLIP, 320 ms; scrim 200 ms; panel content stagger 40 ms |
| Mobile panel | bottom sheet, spring `{stiffness:320, damping:30}`, drag-to-dismiss |
| Press | scale .98, 90 ms `--ease-press` |
| Set checked | check path draw 180 ms; row flash `--accent-soft` → 0 over 400 ms; row scale .99→1; one 1 px accent ring pulse; `navigator.vibrate?.(10)` |
| Number change | translateY(40%) + blur(4px) → settle, 420 ms; digits stagger 18 ms |
| Chart mount | stroke-dashoffset draw 600 ms, **once per mount** |
| Heatmap mount | rows 20 ms stagger, cells 6 ms, total ≤400 ms |
| Toast | 180 ms in, 3 s hold, 140 ms out, one at a time |
| Focus ring | instant, never animated |

Animate only `transform` and `opacity`. Never `width`, `height`, `top`, `box-shadow`, or `filter`
on large surfaces. `will-change` only during an interaction.

Reduced motion: durations 0.01 ms, no transforms, no tilt/parallax, odometer = instant text,
charts render complete.

---

## 10. 3D CONTRACT

```css
.depth { transform-style: preserve-3d; perspective: var(--perspective); }
```

- Z layers: marks `translateZ(6px)`, floating action `translateZ(12px)`, sheet `translateZ(24px)`.
- Tilt: pointer-driven, clamp ±5°, spring return `{260, 26}`.
- Tilt allowed only on: calendar grid (desktop), progress week tablets, gym session card.
- Never tilt inputs, tables, or text being edited.
- Pointer light, hover-capable devices only:
  `radial-gradient(160px circle at var(--mx) var(--my), rgba(255,255,255,.06), transparent 60%)`.
- All 3D inside `@media (hover:hover) and (pointer:fine)`, disabled under reduced motion.

---

## 11. COMPONENT CONTRACTS

**Button** — `variant: primary|ghost`, `size: md|lg`, `disabled`, `loading`(no spinner; label dims).
h44 (lg 48/56), radius 10, 13/500 label +.04em. Primary: accent bg, accent-ink text.
Ghost: 1 px `--line`. Disabled: opacity .35, no pointer events.

**IconButton** — 40×40, radius 10, 24 px glyph, 1.5 px stroke, `aria-label` required.

**Input** — h44, `--surface-2`, 1 px `--line`, radius 8, 16 px text. Focus: accent border +
2 px accent ring at 20%. Error: `--danger` border + message below, `aria-invalid`. No layout shift.

**Stepper** — h44, grid `44px 1fr 44px`: `−` / value / `+`. Mono 16, tabular. Long-press repeats
after 400 ms every 80 ms. `min`/`max`/`step` props; clamp, never wrap. Commit on blur/Enter.

**Tabs** — aria `role="tablist"`, arrow-key navigation, active pill `--surface-2` with `layoutId`.

**Card** — `--surface-1`, 1 px `--line`, radius 12, padding 20, `--e1`. Clickable: hover
`translateY(-2px)` + `--e2`; active 1 px down.

**Sheet** — mobile: bottom, radius 16 top, drag handle 36×4, max-height 88vh, focus trap,
Esc closes, restores focus, scrim click closes. Desktop: right panel 360 px, translateX 24→0.

**Toast** — bottom 16 + safe area, `--surface-2`, radius 10, 13 px, one at a time, optional
single action (Undo), auto-dismiss 3 s, `role="status"`.

**EmptyState** — 24 px glyph, one line `--text-2`, one ghost action. No illustrations.

**Stat** — label 11 caps muted, value mono 40/500, optional delta chip 11.

**Checkbox** — 20×20, radius 4, 1.5 px `--line-strong`; checked = accent fill + ink check path
drawn 180 ms; `aria-checked`, keyboard Space.

**Chip** — radius 4, `--accent-soft`, accent text, mono 11, 2/8 padding.

**ProgressRing** — 2 px stroke, accent, 600 ms draw on mount, track `--surface-3`.

**Charts** — accent line 1.5 px, area gradient 12%→0, horizontal grid only at 4% opacity,
3 time ticks, no y-axis on mobile, crosshair + mono tooltip on hover, dashed baseline + "No data yet"
when empty. Never fake a line.

---

## 12. SCREENS — layout, states, behavior

### 12.1 `/` CalendarPage

**Default:** header (month + year display, `‹`/`›` IconButtons, "Today" ghost, phase chip
"Week N · Phase"). Weekday row caps 11 muted. Grid 7 columns, gap 8 (desktop 12).
**DayCell:** aspect 1/1 mobile, 1/0.72 desktop; date top-left mono 12; 4 marks bottom-left (5 px
dots mobile, 14 px glyphs desktop, 6 px gap): gym, run, study, clean.
Done = filled accent. Not done = 1 px outline `--text-3`. Slip = outline with diagonal strike,
never red. Today = accent 1 px border + accent date. Out-of-month = 30% opacity, still clickable.
Selected = `--surface-2` + `--line-strong`.
**States:** default · selected · today · out-of-month · slip · future (muted, not loggable).
**Behavior:** click/Enter opens DayPanel; Esc closes; arrow keys move; Home = today.
**DayPanel:** date heading, then one row per pillar with real data:
gym (workout name, sets, volume, exercise list), study (minutes, sessions), clean (status),
run (km, time, pace). Empty: "Nothing logged" + one ghost action linking to the right route.
Desktop = inline right column 360 px; mobile = Sheet.
**Month change:** directional slide; never reload data.

### 12.2 `/gym` GymPage

Tabs: **Today (default) · Plan · Log · Progress · Body · Fuel · Fees**.

**Today**
- Sticky header: `Mon 19 Oct · Week 1 of 12 · Push A · 7:00 pm`; timer (elapsed) and `Finish` primary.
- Rest day: "Rest day" + next session preview; no logging.
- Exercise block: name 15/500; meta `4 × 6–8 · RIR 2` mono 13 `--text-2`; note in small.
- Set rows: grid `44px 1fr 1fr 44px` = set number · weight Stepper · reps Stepper · Checkbox.
  Prefill weight from suggestion; reps empty; `Enter` on reps commits and checks the set.
- Suggested chip next to the exercise: `↑ 22.5`, `↓ 18`, `= 20`, `· start`; tooltip explains why.
- "Add set" per exercise; remove set via long-press or a small `×` on hover/focus.
- Notes textarea per session, autosaved.
- Rest timer: after a check, countdown 150 s compound / 75 s isolation in the sticky header;
  tap to skip; `aria-live` announces only start/end.
- Finish: computes duration + total volume, saves, navigates to `/`, toast "Session saved".
- If a session already exists today: reopen it (idempotent), do not create a second.
- Empty suggested weight (`startWeightKg: null`): show "Find your weight" chip and the ramp-up
  instruction from the plan.

**Plan** — accordion per day (Mon–Sun). Each exercise row editable inline: name, sets, repLow,
repHigh, rir, startWeightKg, incrementKg, note, `bump` toggle. Add/remove/reorder.
Phase cards editable (week ranges). Destructive "Reset to original plan" requires confirm.
Edits affect future suggestions only; past sessions keep their denormalized names.

**Log** — reverse chronological; row: date · workout · sets · volume. Expand for full detail.
Delete session with confirm. Empty state.

**Progress** — per exercise: current working weight, best set, 6-session sparkline (80×24).
Targets with progress bars: weight 68–69.5, DB bench 30–32.5×3×10, squat 60–70×3×8,
deadlift 115–120×3×5, OHP 35–40×3×8, leg press ≥150×3×12, first chin-up (0/1).

**Body** — weigh-in (weight required, waist optional), Monday prompt badge. Weight chart with
a hatched 68–69.5 target band and a 0.25–0.4 kg/week healthy band. Rate verdict:
<0.25 "add ~200–250 kcal", 0.25–0.4 "on track", >0.5 "hold calories". Waist every 2 weeks.
No photos. Empty state with the first weigh-in action.

**Fuel** — three ProgressRings (kcal 2850–2950, protein 110–145, water 2.5–3.5 L), numeric inputs,
week's ramp step card, post-gym meal checkbox, sample day collapsible (static).
After 20:00 unchecked → a dot badge on the Fuel tab.

**Fees** — payment list (date, amount, paid-through), due-day field, total this year, add/delete.

### 12.3 `/study`

Hero timer: display-xl mono, Start/Stop 56 px accent circle, `Pause` ghost.
Persisted across reload via `activeTimer.startedAt`; if elapsed > 12 h on load, ask to discard.
Manual entry: date + minutes (1–1440). Today / week / all-time stat row.
30-day bar chart + month heatmap. Daily target editable, default 2 h (display only; no score).
Empty state: "Start your first session".

### 12.4 `/clean`

Hero current streak display-xl; "Best N days" small mono beneath.
Two 48 px buttons: `Clean today` (accent) / `I slipped` (ghost). One mark per day; last write wins.
Undo for 5 s via toast. Month grid of marks; slip is hollow with a strike, never red.
Monthly clean-day % as a mono stat. No urge log, no notes.

### 12.5 `/running`

**Locked** (< 2026-11-16, or fewer than 2 weigh-ins, or weight not rising): Lock card with
striped hairline background, lock glyph, countdown days, the exact condition, link to Body.
No inputs.
**Unlocked:** log date, minutes, optional km → pace auto (`min/km`), weekly km chart,
Sunday easy 20–30 min shown as planned. Empty state.

### 12.6 `/progress`

1. Week tablets: 12 stacked in perspective; current +24 px Z with accent edge; past opacity .55;
   future outlined. Desktop tilt ±5°. Enter animation once (stagger 40 ms). Mobile flat.
2. 2×2 charts: gym sessions/week, study hours/week, clean %/week, running km/week.
3. Year heatmap: 4 rows (Gym, Run, Study, Clean), 11 px cells, 3 px gap, radius 3.
4. Data & preferences: Export JSON · Import JSON · Clear (type CLEAR) · Reduce-motion toggle. Show last export time.

---

## 13. DATA MODEL — localStorage key `kept.v1`

```js
{
  version: 1,
  profile: { name: "Yash", heightCm: 183, startWeightKg: 65, startWaistCm: null },
  plan: {
    name: "12-Week Muscle-Building Plan",
    startDate: "2026-10-19", endDate: "2027-01-10", testDate: "2027-01-11",
    phases: [
      { key:"foundation", name:"Foundation", startWeek:1, endWeek:4 },
      { key:"build",      name:"Build",      startWeek:5, endWeek:7 },
      { key:"deload",     name:"Deload",     startWeek:8, endWeek:8 },
      { key:"push",       name:"Push",       startWeek:9, endWeek:12 }
    ],
    split: [ /* 7 entries, index 0 = Monday; see §15 */ ],
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
  sessions: [{
    id, date, dayName, week, phase, startedAt, finishedAt,
    exercises:[{ exerciseId, name, sets:[{ weightKg, reps, rir, done }] }],
    notes, totalVolume
  }],
  bodyLogs: [{ date, weightKg, waistCm }],
  fuelLogs: [{ date, kcal, proteinG, waterL, postGymMeal }],
  studySessions: [{ id, date, startAt, endAt, minutes, source:"timer"|"manual" }],
  activeTimer: { startedAt: null },
  cleanLog: [{ date, status:"clean"|"slip" }],
  runs: [{ id, date, minutes, km }],
  fees: [{ id, datePaid, amount, paidThrough }],
  settings: {
    studyTargetHours: 2, reminders: true,
    reduceMotion: false, hadTestDayNotice: false
  }
}
```

Rules:
- Day keys are local `YYYY-MM-DD`. **Never** use `toISOString()` for a day key (timezone bug).
- Timestamps (`startedAt`, `finishedAt`) may be ISO.
- Ids: `crypto.randomUUID()`.
- Sessions denormalize exercise `name` so plan edits never rewrite history.

---

## 14. LOGIC — implement exactly

```js
// src/lib/dates.js
export const pad = n => String(n).padStart(2, "0");
export const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
export const addDays = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return key(d); };
export const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
export const weekdayIndex = k => (parse(k).getDay() + 6) % 7; // Monday = 0
```

```js
// src/lib/logic.js
export const round2_5 = n => Math.round(n / 2.5) * 2.5;

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
    .filter(s => s.exercises.some(e => e.exerciseId === exId))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) return null;
  const s = sorted[sorted.length - 1];
  return { session: s, entry: s.exercises.find(e => e.exerciseId === exId) };
}

export function suggestWeight(ex, sessions) {
  const last = lastLogged(ex.id, sessions);
  const sets = last?.entry.sets.filter(s => s.done && s.reps > 0) ?? [];
  if (!sets.length) return { weight: ex.startWeightKg, reason: "start" };

  const w = Math.max(...sets.map(s => s.weightKg));
  const allTop = sets.every(s => s.reps >= ex.repHigh && (s.rir ?? ex.rir) <= 2);

  // consecutive sessions where the bottom of the range was missed
  const hist = sessions
    .filter(s => s.exercises.some(e => e.exerciseId === ex.id))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-2);
  const missCount = hist.filter(s => {
    const e = s.exercises.find(x => x.exerciseId === ex.id);
    return e.sets.filter(x => x.done).some(x => x.reps < ex.repLow);
  }).length;

  if (missCount >= 2) return { weight: round2_5(w * 0.9), reason: "down" };
  if (allTop)         return { weight: w + ex.incrementKg, reason: "up" };
  return { weight: w, reason: "hold" };
}

// Deload keeps the last weight — never add load in week 8.
export function suggestForWeek(ex, sessions, week) {
  const base = suggestWeight(ex, sessions);
  if (week !== 8) return base;
  const last = lastLogged(ex.id, sessions);
  const sets = last?.entry.sets.filter(s => s.done) ?? [];
  return sets.length
    ? { weight: Math.max(...sets.map(s => s.weightKg)), reason: "deload" }
    : base;
}

export function cleanStats(log, today) {
  const map = new Map(log.map(x => [x.date, x.status]));
  let cur = 0;
  let d = map.get(today) === "clean" ? today : addDays(today, -1);
  while (map.get(d) === "clean") { cur++; d = addDays(d, -1); }

  let best = 0, run = 0;
  const days = [...log].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 0; i < days.length; i++) {
    const isClean = days[i].status === "clean";
    const consecutive = i > 0 && diffDays(days[i - 1].date, days[i].date) === 1;
    run = isClean ? (consecutive ? run + 1 : 1) : 0;
    if (run > best) best = run;
  }

  const mp = today.slice(0, 7);
  const elapsed = Number(today.slice(8, 10));
  const cleanDays = log.filter(x => x.date.startsWith(mp) && x.status === "clean").length;
  return { current: cur, best, monthlyPct: Math.round((cleanDays / elapsed) * 100) };
}

export function runningUnlocked(bodyLogs, today) {
  if (today < "2026-11-16") return false;
  const last = [...bodyLogs].sort((a, b) => a.date.localeCompare(b.date)).slice(-2);
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
```

Derived rules:
- `weekNumber` clamps at 12. After `endDate`, show a "Cycle complete" banner; logging still allowed.
- Week 8: 2 sets, last weights (never progress).
- Weeks 5–7 and 9–12: `bump` exercises gain 1 set; last isolation set RIR 0–1 is a display cue.
- Rest default: 150 s compound, 75 s isolation (`ex.isIsolation`).
- Total volume = Σ(weightKg × reps) over done sets.

---

## 15. SEED PLAN — `src/lib/seed.js`

```js
const ex = (name, sets, repLow, repHigh, rir, startWeightKg, incrementKg, opts = {}) => ({
  id: crypto.randomUUID(), name, sets, repLow, repHigh, rir,
  startWeightKg, incrementKg,
  isIsolation: !!opts.iso, bump: !!opts.bump, note: opts.note || ""
});

export const SEED_SPLIT = [
  { day: "Mon", name: "Push A", rest: false, exercises: [
    ex("Barbell overhead press", 4, 6, 8, 2, 20, 2.5, { note: "Empty bar, +2.5 kg per session" }),
    ex("Flat barbell bench", 3, 6, 8, 2, 45, 2.5, { note: "Expect 40–50 kg; dumbbell bench is your stronger lift" }),
    ex("Incline dumbbell press", 3, 8, 10, 2, 17.5, 2.5, { bump: true, note: "15–20 kg per hand" }),
    ex("Cable lateral raise (single arm)", 4, 12, 15, 1, 5, 1.25, { iso: true, bump: true, note: "Very light stack" }),
    ex("Overhead cable triceps extension", 3, 10, 12, 1, null, 1.25, { iso: true }),
    ex("Rope pushdown", 2, 12, 15, 1, null, 1.25, { iso: true })
  ]},
  { day: "Tue", name: "Pull A", rest: false, exercises: [
    ex("Lat pulldown", 4, 8, 10, 1, 40, 2.5, { note: "Chest high, 1s pause at the bottom" }),
    ex("Chest-supported T-bar row", 4, 8, 10, 1, 20, 2.5),
    ex("Close-grip low row", 3, 10, 12, 1, 35, 2.5),
    ex("Rear-delt fly", 3, 12, 15, 1, 5, 1.25, { iso: true, bump: true }),
    ex("Incline dumbbell curl", 3, 10, 12, 1, 8, 1.25, { iso: true }),
    ex("Hammer curl", 2, 10, 12, 1, 8, 1.25, { iso: true })
  ]},
  { day: "Wed", name: "Legs A", rest: false, exercises: [
    ex("Barbell squat", 4, 6, 8, 2, 20, 5, { note: "Rack safety arms set; bar, +5 kg per session" }),
    ex("45° leg press", 3, 10, 12, 1, 115, 5),
    ex("Romanian deadlift", 3, 8, 10, 2, 50, 5, { note: "Hips back, bar close to legs" }),
    ex("Seated leg curl", 3, 10, 12, 1, 30, 2.5, { iso: true }),
    ex("Leg extension", 3, 12, 12, 1, 25, 2.5, { iso: true }),
    ex("Standing calf raise", 4, 12, 15, 1, 40, 2.5, { iso: true, note: "Stretch bottom, pause top" })
  ]},
  { day: "Thu", name: "Push B", rest: false, exercises: [
    ex("Seated dumbbell overhead press", 4, 8, 10, 2, 9, 1.25),
    ex("Incline dumbbell press", 3, 8, 10, 2, 17.5, 2.5, { bump: true }),
    ex("Chest press machine", 3, 10, 12, 1, 40, 2.5),
    ex("Dumbbell lateral raise", 4, 15, 15, 1, 4.5, 1.25, { iso: true, bump: true }),
    ex("Cable chest fly", 3, 12, 15, 1, 10, 1.25, { iso: true }),
    ex("Triceps pushdown", 3, 10, 12, 1, 15, 1.25, { iso: true })
  ]},
  { day: "Fri", name: "Pull B", rest: false, exercises: [
    ex("Deadlift", 3, 5, 5, 2, 90, 5, { note: "Week 1 = form check, then +5 kg/week" }),
    ex("Neutral-grip lat pulldown", 3, 8, 10, 1, 40, 2.5),
    ex("Chin-up negatives", 3, 3, 5, 1, null, 0, { iso: true, note: "5 seconds to lower" }),
    ex("Wide cable row", 3, 10, 12, 1, 35, 2.5),
    ex("Face pull", 3, 15, 15, 1, 15, 1.25, { iso: true }),
    ex("Preacher curl", 3, 10, 12, 1, 12.5, 1.25, { iso: true }),
    ex("Cable lateral raise", 3, 15, 15, 1, 5, 1.25, { iso: true })
  ]},
  { day: "Sat", name: "Legs B + core", rest: false, exercises: [
    ex("45° leg press (high/wide)", 4, 10, 12, 1, 115, 5),
    ex("Seated leg curl", 3, 10, 12, 1, 30, 2.5, { iso: true }),
    ex("Dumbbell walking lunges", 3, 10, 10, 1, 8, 1.25, { note: "10 per leg" }),
    ex("Hip abductor", 3, 12, 15, 1, 30, 2.5, { iso: true }),
    ex("Hip adductor", 2, 12, 12, 1, 30, 2.5, { iso: true }),
    ex("Standing calf raise", 4, 15, 15, 1, 40, 2.5, { iso: true }),
    ex("45° hyperextension", 3, 12, 12, 1, null, 0, { iso: true }),
    ex("Hanging knee raise / cable crunch", 3, 12, 12, 1, null, 0, { iso: true })
  ]},
  { day: "Sun", name: "Rest", rest: true, exercises: [] }
];
```

Plan metadata: start `2026-10-19`, end `2027-01-10`, test `2027-01-11`, sessions 7:00–8:10 pm.

Rules to display in Plan:
- Warm-up 7–8 min + ramp sets 50% × 8, 70% × 5.
- RIR 2 on squat/deadlift/bench/OHP; 1–2 machines/cables; last isolation set 0–1 from week 5.
- Rest 2–3 min compound, 60–90 s isolation. Tempo 2–3 s down.
- Short on time: first 3 exercises. Missed day: resume next scheduled day, never double up.

Nutrition display (Fuel):
- Maintenance ≈ 2600–2700, target 2850–2950 kcal.
- Protein 110–145 g; water 2.5–3.5 L.
- 4-week ramp as seeded; post-gym meal is non-negotiable.
- Sample day is static text, collapsed by default.

Body: weigh Monday before eating, same clothes; waist every 2 weeks at the navel, relaxed.
Sleep 7–8 h, 11:30 pm on training nights (display in Body or Fuel as a small note).

---

## 16. PERSISTENCE, EXPORT, ERRORS

- Boot: read `kept.v1`; if absent or invalid → create from seed and show a one-time toast.
- Every mutation: update in memory → schedule a 150 ms debounced write.
- Flush on `pagehide`, `visibilitychange` (hidden), and before export.
- Multi-tab: listen to `storage`; if `kept.v1` changed externally, reload state.
- localStorage unavailable / quota exceeded: keep working in memory, show a persistent warn banner:
  "Storage unavailable — export your data now."
- Export: `kept-YYYY-MM-DD.json`, pretty-printed, includes `version`.
- Import: parse → validate (`version`, required arrays, date format) → confirm dialog with counts →
  replace atomically. Invalid file: toast error, state untouched.
- Clear: requires typing `CLEAR`; double confirmation; then reseed the plan and empty logs.
- Never throw a raw error to the UI. Use a toast with an action where recovery is possible.

---

## 17. EDGE CASES — handle all of these

1. **Midnight rollover** while the page is open: `useNow()` ticks every 30 s; "today" changes,
   calendar and gym header recalculate without reload.
2. **Timezone/DST:** day keys from local date parts only. No `toISOString()` day keys.
3. **Future dates:** calendar cells are muted and cannot be logged.
4. **Before plan start:** week clamps to 1; Phase "Foundation"; no crash.
5. **After plan end:** "Cycle complete" banner; logging allowed; suggestions hold (no 13th week).
6. **Missing weigh-ins:** weight chart with 0 or 1 point; Running stays locked with an explanation.
7. **Deleting an exercise in Plan:** past sessions keep their denormalized names and data.
8. **Renaming an exercise:** history unchanged; future suggestions key off `exerciseId`.
9. **Changing rep range/weight:** affects only future suggestions.
10. **Second session same day:** open the existing one; never duplicate.
11. **Finish with zero done sets:** block with an inline message, keep the draft.
12. **Partial set (weight entered, reps 0):** not counted as done.
13. **Weight null:** show "Find your weight" and the ramp-up instructions; suggestion reason `start`.
14. **Decimal weights:** step 0.5, clamp 0–500; round display to 1 decimal.
15. **Reps:** integer 0–50.
16. **Slip + clean same day:** last write wins; undo restores the previous status.
17. **Streak across a month boundary:** computed by consecutive dates, not calendar month.
18. **Monthly % on the 1st:** denominator = 1, never divide by zero.
19. **Active timer > 12 h:** offer discard/resume on load.
20. **Timer + tab sleep:** compute from `startedAt`, not intervals.
21. **Very long notes:** scroll inside the textarea; never expand the layout.
22. **Import with missing optional fields:** default them; never crash.
23. **Many sessions:** lists virtualize? If > 300 sessions, paginate Log (100/page).
24. **Reduced motion on:** no FLIP, no tilt, no odometer; panels fade only.
25. **Keyboard-only:** calendar arrows, Enter opens, Esc closes, focus returns to the cell.
26. **Screen reader:** day panel announces date and contents; marks are labelled; toasts announced.
27. **320 px:** no horizontal scroll; header text truncates with ellipsis.
28. **200% zoom:** no clipped labels; grids reflow.
29. **Offline:** works fully (no network).
30. **Empty state everywhere:** no blank regions, no "undefined".

---

## 18. ACCESSIBILITY CONTRACT

- WCAG AA minimum; accent on bg is ~15:1.
- Visible focus: 2 px accent, 2 px offset; never removed.
- Calendar: roving tabindex, arrow keys, Home = today, Enter opens, Esc closes.
- Marks: `aria-label` e.g. "Gym: done, 19 October". Shape differs for done/not done/slip.
- Timer: `aria-live="polite"` at start/stop only.
- Sheet: focus trap, Esc, restore focus.
- Buttons and inputs: real `<button>` / `<input>`; no clickable divs.
- `lang="en"`; dates via `Intl.DateTimeFormat`.
- Form errors: `aria-invalid` + `aria-describedby`.
- No color-only meaning anywhere.

---

## 19. PERFORMANCE CONTRACT

| Metric | Budget |
|---|---|
| JS gzip | ≤ 130 KB |
| CSS gzip | ≤ 20 KB |
| Fonts total | ≤ 60 KB |
| LCP | < 1.5 s mid-range phone |
| Input latency | < 50 ms |
| Network after load | 0 requests |

- `content-visibility:auto` on long lists.
- Memoize derived stats; no recompute on every keystroke.
- No layout reads inside pointer handlers.
- `will-change` scoped to active interactions.
- No long tasks > 50 ms.

---

## 20. BUILD PROTOCOL

Work in phases. After each: run `npm run build`, fix errors, run `npm run dev`, verify the exit
condition, then continue **without asking for approval**.

**Phase 0 — Scaffold.** Vite app, Tailwind, fonts, tokens, grain, vignette, AppShell, routes
placeholder. *Exit:* both layouts render; no console errors; fonts loaded locally.

**Phase 1 — Router & Nav.** 6 routes, hash routing, active states, page transitions.
*Exit:* every nav item works; back/forward works.

**Phase 2 — Store.** Schema, seed, `useStore`, write-through, debounce, storage listener,
`?date=YYYY-MM-DD` test override (dev only, no UI), export/import/reset.
*Exit:* reload preserves state; export→clear→import identical.

**Phase 3 — Calendar.** MonthGrid, DayCell, marks, month nav, DayPanel with FLIP, mobile Sheet,
keyboard grid. *Exit:* marks reflect store; day panel opens/closes with focus restore.

**Phase 4 — Gym Today.** Workout resolution, set rows, steppers, check animation, rest timer,
suggestions, notes, Finish, existing-session reopen. *Exit:* tests 1–3 pass.

**Phase 5 — Plan editor.** Inline editing, add/remove/reorder, bump, reset. *Exit:* test 9 passes.

**Phase 6 — Gym Log / Progress / Body / Fuel / Fees.** *Exit:* each has a real empty state and charts.

**Phase 7 — Study.** Timer persistence, manual entry, stats, charts. *Exit:* test 7 passes.

**Phase 8 — Clean.** Marks, undo, streak, best, monthly %. *Exit:* test 8 passes.

**Phase 9 — Running.** Lock/unlock, logging, pace, chart. *Exit:* test 6 passes.

**Phase 10 — Progress.** Week tablets, 4 charts, year heatmap, data tools. *Exit:* all charts render.

**Phase 11 — Polish.** Signature moments, reduced-motion toggle, empty states, a11y pass,
responsive QA, performance check. *Exit:* §21 all pass; §22 self-review complete.

---

## 21. TEST MATRIX — run these, record evidence

| # | Setup | Expected |
|---|---|---|
| 1 | `?date=2026-10-19` | Week 1, phase foundation, workout "Push A", 6 exercises, first = Barbell overhead press |
| 2 | Log OHP 4 sets @20 kg, reps 8/8/8/8, RIR 2, all done, Finish | Volume = `20 × 32 = 640`; session in Log; calendar G fills |
| 2b | Log a different session as 8/8/7/6, all done | Volume = 580; the next suggestion **holds** at 20 kg (top of range not hit on every set) |
| 3 | Next Push A (2026-10-26) | OHP prefilled 22.5 kg, reason "up", chip `↑ 22.5` |
| 4 | `?date=2026-11-16` | Week 5; cable lateral raise = 5 sets; rear-delt fly = 4; incline press = 4; Running unlocks only if last two weigh-ins rise |
| 5 | `?date=2026-12-07` | Week 8; every exercise = 2 sets; suggestions = last weights, no increase |
| 6 | `?date=2027-01-11` | Test-day banner; start vs current lifts summary |
| 7 | Study: start 2 s, stop; reload mid-run | Today total updates; S mark fills; timer resumes from `startedAt` |
| 8 | Clean: clean today, clean yesterday, slip the day before | Current = 2, best = 2, monthly % = cleanDays/elapsed |
| 9 | Rename "Rope pushdown" → "Rope ext" and reload | Today, Log, Progress all show the new name; old sessions keep the old name |
| 10 | Export → Clear (type CLEAR) → Import | State identical; all marks and charts restored |
| 11 | 320 px / 200% zoom / keyboard only | No horizontal scroll; no clipping; day opens with Enter; Esc closes |
| 12 | DevTools Network after load | 0 requests |
| 13 | Reduced motion on | No transform animations; panels fade; no tilt |
| 14 | Two tabs open, edit in one | Other tab reflects the change within 1 s |
| 15 | Fill set with reps 0 | Not counted as done; volume unchanged |

Extra verification: `npm run build` clean; `npm run preview` matches dev behavior.

---

## 22. SELF-REVIEW PASS — after Phase 11, before reporting

Re-read `DESIGN.md` §15 and this section. Then audit your own build:

1. **Spacing:** every gap/margin is from the 4-pt scale. No 13 px, no 18 px.
2. **Type:** all numbers mono + tabular; no display weight > 500; no centered paragraphs.
3. **Color:** one accent per view; no red on missed habits; grayscale screenshot still reads.
4. **Motion:** every press/check/tab animates; durations match tokens; nothing replays on re-render.
5. **3D:** tilt only where allowed; disabled on touch and reduced motion; Z order correct.
6. **Empty states:** every page and every chart has one.
7. **Focus:** tab through the whole app; every control reachable; focus visible.
8. **Data:** no lost set on refresh mid-entry; timer survives reload; import round-trips.
9. **Copy:** no "undefined", no lorem, no praise language, no emoji.
10. **Performance:** bundle sizes measured; network tab clean.
11. **Mobile:** thumb-reachable primary actions; bottom nav respects safe area.
12. **Logic:** tests 1–15 pass.

Fix what fails. Do not report a failure as a pass.

---

## 23. DEFINITION OF DONE

- All 11 phases complete; `npm run build` clean.
- Test matrix 1–15 pass, with evidence.
- Design self-review 1–12 pass.
- No dependency beyond the approved list.
- No non-goal feature exists anywhere in the code.
- `README.md` with: what it is, how to run, how data is stored, how to export/back up.

---

## 24. REPORT FORMAT

Reply with:

1. **Built:** file tree actually created.
2. **Phases:** each phase, status, deviations and why.
3. **Tests:** table of 1–15 with pass/fail and the evidence you observed.
4. **Design self-review:** 1–12 with pass/fail.
5. **Not verified:** anything you could not check, stated plainly.
6. **Run:** `npm run dev` / `npm run build` / `npm run preview`.
7. **Next:** the single most valuable improvement, if any.

---

## 25. RULES OF ENGAGEMENT

- Do not ask questions the documents answer. If truly blocked, ask once, precisely.
- Do not add features, screens, settings, onboarding, or "nice to have" polish outside this brief.
- Do not stop between phases for approval.
- Do not paraphrase the measurements — implement them.
- Do not claim a test you did not run.
- When a visual result looks wrong, fix spacing and type before adding effects.
- When in doubt, choose the more restrained option.
- Keep the app usable if JavaScript in one chart fails: isolate errors per panel, never blank the page.
- Preserve the owner's data above all. A failed feature is acceptable; a lost session is not.

---

**START:** reply with a 10-line build plan and the exact file tree, then begin Phase 0.
