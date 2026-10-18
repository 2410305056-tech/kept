# Self Tracker — Build Spec

**Working name:** Kept (changeable)
**Owner:** single user (Yash)
**Status:** decisions frozen 18 Oct 2026 · ready for Antigravity handoff
**Stack:** React 19 + Vite + Tailwind CSS · localStorage · optional Supabase sync

---

> **Implementation status — 19 Oct 2026.** The shipped app deliberately deviates from the
> frozen decisions below. This block supersedes any conflicting line.
>
> - **Cloud sync is optional, not forbidden.** Local-first remains the default. Without
>   `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` there is no network at all. With them, a signed-in
>   user gets background pull/push. See `supabase/README.md`.
> - **Sound is opt-in**, off by default (`settings.soundEnabled`), persisted across reloads.
> - **Clean extras are opt-in** (`settings.cleanExtras`). Friction Hold and the Vulnerability Clock
>   are hidden by default; the daily page is the two-button clean/slip record.
> - **Study keeps optional tags/protocols** and an editable target (`settings.studyTargetHours`).
> - **Progression allows one rep of grace:** with N prescribed sets, N−1 at the top of the range and
>   one at `repHigh − 1` still adds weight. Two short sets hold.
> - **Running unlocks on a rising 3-day average**, not a single pair of weigh-ins.
> - **Charts accept tap** (pointer) in addition to hover.
> - **Export reminder:** `settings.lastExportAt` drives the "last export" line.
> - **Docs source of truth:** the root `*.md` files. The former `docs/` duplicates were removed.

---

## 1. What this is

A private, single-user website that tracks four things: **gym, running, study, clean (no porn)**.

The home screen is a **calendar**. Each day shows what was done. Each category has its own page.
The Gym page does not just record — it **executes a real 12-week plan**: it knows which workout today is,
which exercises, which sets, which starting weights, and what weight to add next session.

The product is a record, not a coach. No scores, no badges, no praise, no social.

---

## 2. Locked decisions

| Decision | Choice |
|---|---|
| Home screen | Month calendar. Click a day → that day's full record |
| Navigation | Top bar / bottom nav: Calendar · Gym · Running · Study · Clean · Progress |
| Gym logging | **Every set**: weight (kg) × reps, per exercise |
| Gym plan | **Editable** — exercises, sets, rep ranges, weights all editable in-app |
| Study | **Time only** — start/stop timer + manual entry. No subjects, no syllabus |
| Clean | **One daily mark** (clean / slip) + streak. Nothing else |
| Overall performance | Charts + heatmaps. **No score, no level, no ranking** |
| Storage | localStorage. Local JSON export/import |
| Devices | Phone and laptop (mobile-first, responsive) |
| Deployment | Static hosting (Vercel/Netlify/Pages). Optional Supabase sync — see `supabase/README.md` |

### Explicit non-goals (do not build)

Social / sharing / friends · XP / badges / levels / confetti · AI coach or chat ·
browser notifications · body progress photos · cloud sync / accounts / login · dark-light theme toggle · multi-user.

---

## 3. Screens

### 3.1 Calendar (home, `/`)

- Month grid, Mon–Sun, arrows to change month, "Today" button.
- Each day cell: date number + **4 small marks** in fixed order:
  `G` gym (a session was logged) · `R` run (a run was logged) · `S` study (≥1 session) · `C` clean (marked clean).
  Filled mark = done. Empty = not done. Slip day → C shown as a hollow/× mark, never red-shaming.
- Today is outlined. Future days are muted and not clickable for logging.
- Click a day → **day detail panel** (drawer on mobile, side panel on desktop):
  - Gym: workout name (e.g. "Push A") + total sets + total volume (kg) + list of exercises with sets/reps/weight
  - Study: total minutes, list of sessions
  - Clean: status
  - Run: distance + time
  - Empty state: "Nothing logged"
  - Button: "Log gym" / "Log study" / etc., linking to the right page for that date.

### 3.2 Gym (`/gym`) — tabs: Today · Plan · Log · Progress · Body · Fuel · Fees

**Today (default)**
- Header: `Mon 19 Oct · Week 1 of 12 · Push A · 7:00 pm`
- If rest day: show "Rest day" and the next session.
- Exercise list in plan order, each with sets × rep range and RIR target.
- Each set row: `Set 1 [weight kg] [reps] [✓]`. Pre-filled with the suggested weight (see §5.2).
- Weight input: numeric, step 0.5, tap to edit. Reps input: numeric, 0–50.
- "Add set" / remove set per exercise.
- Notes field per session.
- `Finish session` → saves session, computes duration + total volume, returns to Calendar with the day marked.
- Everything is saved automatically as it is typed (no lost work on refresh).

**Plan (editable — the app must NOT hardcode the plan as read-only)**
- Weekly split: 7 rows, each editable (day, name, rest toggle).
- Per day: list of exercises with fields `name`, `sets`, `repLow`, `repHigh`, `rir`, `startWeightKg`, `incrementKg`, `note`.
- Add / edit / remove / reorder exercises.
- Phases: Foundation (wk 1–4), Build (wk 5–7), Deload (wk 8), Push (wk 9–12). Editable week ranges and per-phase set adjustments.
- Plan start date, end date, test date — editable.
- "Reset to original 12-week plan" button (restores the seed data in §7).

**Log**
- Reverse-chronological list of sessions. Each row: date · workout name · sets · volume.
- Click → expand full exercise/set detail. Delete session allowed.

**Progress**
- Per exercise: current working weight (last logged), best set, small sparkline of the last 6 sessions.
- Targets list with progress bars: weight, lift targets, first chin-up.
- No composite score.

**Body**
- Weigh-in form (weight, optional waist). Monday is the expected day.
- Chart: weight over time with a **target band** (68–69.5 kg by 11 Jan 2027) and a **healthy-rate band** (0.25–0.4 kg/week).
- Rate indicator: <0.25 = "add food", 0.25–0.4 = "on track", >0.5 = "hold calories".
- Waist field every 2 weeks. No photos.

**Fuel**
- Today's checklist: calories (target 2850–2950), protein g (min 110, max 145), water L (2.5–3.5).
- Shows which food-ramp step this week is (1–4), with the item to add.
- "Post-gym meal" checkbox; keep unchecked state visible after 8 pm.
- Sample day is displayed as a static reference (collapsible).

**Fees**
- Gym membership: amount, due day, list of payments (date, amount, paid-through). Total spent this year.

### 3.3 Running (`/running`)

- **Locked state** until **16 Nov 2026 (week 5)** AND body weight is rising (last two weigh-ins increasing).
  Show a lock card: "Unlocks week 5 · weight must be rising · 29 days". No logging before that.
- After unlock: log a run (date, minutes, km optional). Pace auto-computed (min/km).
- Weekly total + km chart. Sunday easy run 20–30 min is shown as the planned session.
- Placeholder for a future 1600 m test block and best time.

### 3.4 Study (`/study`)

- Big timer: Start / Pause / Finish. Elapsed time displayed large. Runs while the tab is open.
- Manual entry: date + minutes (for study done offline).
- Today total, week total, all-time total.
- Daily target: **editable, default 2 h** (used only for display and the calendar mark).
- Chart: hours per day (last 30) + a month heatmap.

### 3.5 Clean (`/clean`)

- Two buttons: `Clean today` / `I slipped`. One mark per day; can be changed the same day.
- Streak counter: consecutive clean days (a slip resets the current streak).
- **Monthly clean-day %** displayed as the primary number (does not reset).
- Month calendar of marks + streak history (best streak).
- No urge log, no triggers, no notes. (Schema leaves room to add later.)

### 3.6 Progress (`/progress`)

"Overall performance" = four independent charts, **no combined score**:
- Gym sessions per week + completion % vs plan
- Study hours per week
- Clean days per week (%)
- Running km per week
- A 4-row habit heatmap (Gym / Run / Study / Clean) for the current year
- Export data (JSON) / Import data (JSON) / Clear data (double-confirm)

---

## 4. Design direction

**The full visual and motion contract is `DESIGN.md`. Build to that file, not to this summary.**

- **Dark "training log"**: near-black, machined surfaces, engraved mono numerals, one lime accent.
- Motion is mechanical: 90 ms presses, 320 ms page/panel transitions, springs for layout, CSS 3D depth
  (no WebGL). Three signature moments: day-panel FLIP, set-lock, week-lift.
- Mobile-first: bottom nav on phone, left rail on desktop; 44 px minimum targets.
- Self-hosted OFL fonts (Geist / Geist Mono), no CDN, no analytics. System fallback if unavailable.
- Grain + vignette at low opacity for physicality; hierarchy must survive a grayscale screenshot.
- Reduced motion honored everywhere; no confetti, sound, XP, or decorative gradients.

---

## 5. Logic

### 5.1 Week / phase

```
week = floor(daysBetween(plan.startDate, today) / 7) + 1   // clamp 1..12
phase = week <= 4 ? 'Foundation' : week <= 7 ? 'Build' : week === 8 ? 'Deload' : 'Push'
dayType = split[weekday(today)]                            // Sunday = rest
```

### 5.2 Suggested weight (the core rule)

For each exercise, look at the most recent session for that exercise:

- Hit the **top of the rep range on all working sets** with RIR ≤ 2 → suggest `lastWeight + incrementKg`
  (2.5 kg upper body, 5 kg lower body — stored per exercise).
- Missed the **bottom of the rep range on 2 consecutive sessions** → suggest `lastWeight × 0.9` (rounded to 2.5 kg).
- Otherwise → suggest `lastWeight`.
- Never logged → suggest `startWeightKg` from the plan.

Show the suggestion pre-filled, with a small chip `↑ +2.5` or `↓ -10%` and the reason on tap. The user can always override.

### 5.3 Phase volume changes

- Foundation (1–4): base sets from plan.
- Build (5–7) and Push (9–12): +1 set on lateral raises, rear-delt fly, incline press. Last set of each isolation exercise → RIR 0–1.
- Deload (8): every exercise = 2 sets, same weights.
- Push (9–12): optional Friday "7-set lateral raise" toggle.
- Test day (11 Jan 2027): show a "Test day" banner and a report of start vs current lifts, weight, waist, sessions completed.

### 5.4 Calendar marks

- Gym: any session saved on that date.
- Run: any run saved on that date.
- Study: total minutes > 0.
- Clean: status = clean.

### 5.5 Streaks

```
current = consecutive clean days ending today or yesterday
best    = longest run in history
monthly% = clean days / days elapsed in month
```

### 5.6 In-app reminders (no browser notifications)

Small badges only:
- Monday: "Weigh-in due" (if no weight logged this week)
- Every 2 weeks: "Waist measurement due"
- After 8 pm with no post-gym meal checked: dot on Fuel
- Week 8: "Deload week" banner
- 11 Jan: "Test day"

---

## 6. Data model (localStorage key `kept.v1`)

```js
{
  version: 1,
  profile: { name, heightCm: 183, startWeightKg: 65, startWaistCm: null },
  plan: {
    name, startDate: "2026-10-19", endDate: "2027-01-10", testDate: "2027-01-11",
    phases: [
      { key: "foundation", name: "Foundation", startWeek: 1, endWeek: 4 },
      { key: "build",      name: "Build",      startWeek: 5, endWeek: 7 },
      { key: "deload",     name: "Deload",     startWeek: 8, endWeek: 8 },
      { key: "push",       name: "Push",       startWeek: 9, endWeek: 12 }
    ],
    split: [ // index 0 = Monday
      { day: "Mon", name: "Push A", rest: false, exercises: [
        { id, name, sets, repLow, repHigh, rir, startWeightKg, incrementKg, isIsolation, note }
      ]},
      // ... Tue Pull A, Wed Legs A, Thu Push B, Fri Pull B, Sat Legs B + core, Sun Rest
    ],
    nutrition: {
      kcalLow: 2850, kcalHigh: 2950, proteinMin: 110, proteinMax: 145,
      waterLow: 2.5, waterHigh: 3.5,
      ramp: [
        { week: 1, item: "Post-gym meal (50 g peanuts + milk / sattu)", kcal: 430, protein: 20 },
        { week: 2, item: "4 pm snack (roasted chana + banana)", kcal: 285, protein: 11 },
        { week: 3, item: "Mid-morning snack (peanuts + banana)", kcal: 330, protein: 11 },
        { week: 4, item: "Full menu", kcal: 0, protein: 0 }
      ]
    },
    targets: {
      weightKg: [68, 69.5], waistGrowthCmMax: 2,
      dbBenchKg: [30, 32.5], squatKg: [60, 70], deadliftKg: [115, 120],
      ohpKg: [35, 40], legPressKg: 150, firstChinUp: true
    }
  },
  sessions: [{ id, date, dayName, week, phase, startedAt, finishedAt,
               exercises: [{ exerciseId, name, sets: [{ weightKg, reps, done }] }],
               notes, totalVolume }],
  bodyLogs: [{ date, weightKg, waistCm }],
  fuelLogs: [{ date, kcal, proteinG, waterL, postGymMeal }],
  studySessions: [{ id, date, startAt, endAt, minutes, source: "timer"|"manual" }],
  cleanLog: [{ date, status: "clean"|"slip" }],
  runs: [{ id, date, minutes, km }],
  fees: [{ id, datePaid, amount, paidThrough }],
  settings: { studyTargetHours: 2, reminders: true, hadTestDayNotice: false }
}
```

- One JSON blob is fine at this scale. Write-through on every change.
- Export downloads `kept-YYYY-MM-DD.json`; import validates `version` and confirms overwrite.
- Dates are local `YYYY-MM-DD` strings; never store timezone-shifted ISO timestamps for day keys.

---

## 7. Seed content (the user's actual 12-week plan)

Start **Mon 19 Oct 2026**, end **Sun 10 Jan 2027**, test **Mon 11 Jan 2027**.
Sessions 7:00–8:10 pm, 60–70 min. Sunday rest.

| Day | Workout | Exercises (sets × reps · notes) |
|---|---|---|
| Mon | Push A (shoulders first) | OHP 4×6–8 · bar 20 kg, +2.5/session · Flat barbell bench 3×6–8 · 40–50 kg · Incline DB press 3×8–10 · 15–20 kg/hand · Cable lateral raise single-arm 4×12–15 · light · Overhead cable triceps ext 3×10–12 · Rope pushdown 2×12–15 |
| Tue | Pull A | Lat pulldown 4×8–10 · Chest-supported T-bar row 4×8–10 · Close-grip low row 3×10–12 · Rear-delt fly 3×12–15 · Incline DB curl 3×10–12 · 7.5–10 kg · Hammer curl 2×10–12 |
| Wed | Legs A | Barbell squat 4×6–8 · bar, +5/session · 45° leg press 3×10–12 · 115 kg · Romanian deadlift 3×8–10 · 50 kg · Seated leg curl 3×10–12 · Leg extension 3×12 · Standing calf raise 4×12–15 |
| Thu | Push B | Seated DB OHP 4×8–10 · 8–10 kg/hand · Incline DB press 3×8–10 · Chest press machine 3×10–12 · DB lateral raise 4×15 · 4–5 kg · Cable chest fly 3×12–15 · Triceps pushdown 3×10–12 |
| Fri | Pull B | Deadlift 3×5 · 90 kg wk1, +5/week · Neutral-grip pulldown 3×8–10 · Chin-up negatives 3×3–5 (5 s lower) · Wide cable row 3×10–12 · Face pull 3×15 · Preacher curl 3×10–12 · Cable lateral raise 3×15 |
| Sat | Legs B + core | Leg press (high/wide) 4×10–12 · Seated leg curl 3×10–12 · DB walking lunges 3×10/leg · 8–10 kg · Hip abductor 3×12–15 + adductor 2×12 · Standing calf raise 4×15 · 45° hyperextension 3×12 · Hanging knee raise / cable crunch 3×12 |
| Sun | Rest | From week 5: optional easy 20–30 min jog, only if weight is rising |

**Session rules (display in Plan tab):**
- Warm-up 7–8 min + 2 ramp sets: 50% × 8, 70% × 5.
- RIR 2 on squat/deadlift/bench/OHP; RIR 1–2 on machines/cables; last isolation set RIR 0–1.
- Rest 2–3 min after big lifts, 60–90 s after isolation. Tempo: 2–3 s down, controlled.
- Short on time: do the first 3 exercises. Missed day: resume next scheduled day, never double up.

**Nutrition:** maintenance ≈ 2600–2700 → target 2850–2950 kcal; protein 110–145 g (min 110); water 2.5–3.5 L. Never skip the post-gym meal. Food budget ₹1,500/month.

**Body:** weigh Monday before eating, same clothes. Waist every 2 weeks at navel, relaxed. Target rate 0.25–0.4 kg/week.

**Sleep:** 7–8 h; 11:30 pm on training nights.

**Fees:** gym membership — user enters amount and due date.

---

## 8. Acceptance criteria

1. Open the site on a phone → calendar renders this month; today is outlined; the 4 marks reflect stored data.
2. Click today → day panel opens with everything logged (or empty state).
3. Gym → Today shows the correct workout for the date and week number (19 Oct 2026 = "Week 1 · Push A").
4. Enter 4 sets of OHP at 20 kg × 8 with RIR 2 → finish → session appears in Log and the calendar G mark fills.
5. Next Push A pre-fills 22.5 kg for OHP with an `↑ +2.5` chip.
6. Week 5 (16 Nov 2026) adds the extra sets automatically; week 8 drops every exercise to 2 sets.
7. Edit an exercise name in Plan → it changes everywhere (Today, Log, Progress) and survives reload.
8. Study timer counts up, Finish saves minutes, calendar S fills, weekly chart updates.
9. Clean: mark clean → streak = 1 → next day clean → 2. Mark slip → streak 0, monthly % recalculates.
10. Running page is locked before 16 Nov 2026 and explains why.
11. Export → JSON file downloads; Clear → Import restores identical state.
12. All data survives a full browser restart. No network requests after load.

---

## 9. Build order

1. App shell, routing, design tokens, localStorage store, seed plan.
2. Calendar + day panel.
3. Gym Today + per-set logging + save.
4. Gym Log + Progress + suggestion engine (§5.2).
5. Gym Plan editor (editable exercises and phases).
6. Study timer + charts.
7. Clean marks + streaks.
8. Body, Fuel, Fees.
9. Running lock + run logging.
10. Progress page (4 charts + heatmap), export/import, reminder badges.
11. Responsive polish, empty states, final QA against §8.

---

## 10. Handoff prompt for Antigravity

> Read `SPEC.md`, `DESIGN.md`, and `HANDOFF.md` fully before coding. Build the app in `SPEC.md`
> exactly, to the visual and motion contract in `DESIGN.md`. React 18 + Vite + Tailwind, localStorage
> only, no backend, no auth, no network calls. CSS 3D only — no Three.js, no chart library. Follow the
> build order in §9, apply the skill checklist in `HANDOFF.md`, and verify every acceptance criterion
> in §8 and every UI check in `DESIGN.md` §15 before declaring done. Seed the gym plan from §7 and keep
> it editable. Do not add anything from §2's non-goals.

---

## 11. Open assumptions (owner can veto)

1. **Name** "Kept" — placeholder.
2. **Dark theme** — light variant would be a token swap.
3. **Study daily target 2 h** — editable.
4. **In-app reminder badges only** — no browser notifications.
5. **No PIN** in v1; add later if the local device is shared.
6. **No photos** — body tracked by weight + waist only.
7. **Folder:** `selftracker/`.
