# Kept — Design System & Motion Spec

Companion to `SPEC.md`. This file is the visual and interaction contract.
An engineer should be able to build the entire UI from this without asking a design question.

**Thesis:** a private training ledger. It should feel like a precision instrument —
machined surfaces, engraved numbers, one light source, one accent. Motion is mechanical,
not playful. The tool disappears; the habit remains.

> **Interaction additions (19 Oct 2026):** charts pin their tooltip on tap; sound is off by
> default; Clean shows two buttons unless Clean Extras is enabled; cloud sync status lives in
> Progress → Data & Preferences and never appears in the main navigation.

---

## 1. Ten design laws

1. **The grid is the design.** If it looks wrong, the spacing is wrong — not the colors.
2. **One accent, once per screen.** Accent marks the single next action.
3. **Type does the work.** No decorative borders, blobs, or gradients pretending to be hierarchy.
4. **Motion explains cause and effect.** If an animation doesn't answer "what just happened?", delete it.
5. **Depth comes from light, not from drop shadows everywhere.** One light source, top-front.
6. **Contrast before color.** If it isn't readable in grayscale, it isn't designed.
7. **Consistency beats novelty.** Every press, drawer, and tab behaves the same way.
8. **Speed is a feature.** 60 fps, instant input, no spinners on local data.
9. **Accessibility is craft, not compliance.** Keyboard, focus, reduced motion, 44 px targets.
10. **Restraint at the top, richness in the details.** Calm layout; virtuoso micro-interactions.

---

## 2. Brand

- **Name:** Kept (placeholder).
- **Signature motif:** the **spine** — a 1 px vertical rule that runs down the content edge,
  like the binding of a logbook, with 4 tick marks for the four pillars.
- **Second motif:** calendar days are **keycaps** — they sit on the surface, press down 1 px,
  and lift 2 px on hover.
- **Voice:** second person, factual, no praise. "4 of 6 sessions this week." Never "Great job!".
- **Logo:** wordmark in mono, letter-spaced `+0.18em`, with the accent dot after it: `KEPT·`

---

## 3. Color tokens

```css
:root {
  --bg:          #08080A;   /* page */
  --surface-1:   #101013;   /* cards */
  --surface-2:   #16161A;   /* hover / input */
  --surface-3:   #1D1D22;   /* pressed / empty heatmap */
  --line:        #26262C;   /* 1px borders */
  --line-strong: #34343C;   /* focus-adjacent, active borders */
  --text-1:      #ECECEF;
  --text-2:      #A0A0A8;
  --text-3:      #6A6A73;   /* non-essential only, never body copy */
  --accent:      #C8F65C;   /* lime — the only accent */
  --accent-ink:  #0B0C06;   /* text on accent */
  --accent-soft: rgba(200,246,92,.12);
  --warn:        #F2C14E;   /* due / missed */
  --danger:      #FF6B6B;   /* errors only — never a missed habit */
  --scrim:       rgba(4,4,6,.72);
}
```

Rules:
- **Never** use `--danger` for a slip, a missed day, or a broken streak. Missed = `--surface-3`.
- The four pillars are **not** color-coded. They are distinguished by glyph and label.
- Accent budget: one primary action per view, plus the current/active indicator.
- Text contrast: `--text-1` 17:1, `--text-2` 7:1, `--accent` 15:1 on `--bg`.

**Texture:** fixed full-viewport SVG grain (`feTurbulence`, baseFrequency .8) at **3% opacity**,
`pointer-events:none`, `mix-blend-mode:overlay`. Adds physicality without noise.
**Vignette:** radial gradient from transparent 60% to `rgba(0,0,0,.35)` at 100%, fixed.

---

## 4. Typography

```css
--font-sans: "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
--font-mono: "Geist Mono", ui-monospace, "SFMono-Regular", Consolas, monospace;
```

Self-host `Geist` + `Geist Mono` (OFL) as subset `woff2` (`font-display: swap`).
**No CDN, no Google Fonts request.** If the files cannot be added, fall back to system stacks — never block render.

| Token | Size / line | Weight | Tracking | Use |
|---|---|---|---|---|
| `display-xl` | `clamp(56px, 9vw, 104px)` / .92 | 500 | −0.035em | streak, hero number |
| `display` | `clamp(36px, 5vw, 56px)` / 1.0 | 500 | −0.03em | page hero |
| `h1` | 28 / 34 | 500 | −0.02em | screen title |
| `h2` | 20 / 28 | 500 | −0.01em | section |
| `body` | 15 / 24 | 400 | 0 | copy |
| `small` | 13 / 20 | 400 | 0 | meta |
| `label` | 11 / 16 | 500 | +0.08em, uppercase | field labels, tabs |
| `mono` | 13 / 20 | 400 | 0 | data, timestamps |

- **All numbers** use `--font-mono` with `font-variant-numeric: tabular-nums`.
- Hero numbers use weight 500, never 700+.
- Max line length 68ch. Paragraphs never centered.

---

## 5. Space, grid, radius, elevation

- Base unit **4 px**. Scale: `4 8 12 16 24 32 48 64 96`.
- Desktop: 12-column grid, max content **1080 px**, gutter 24, page padding 32.
- Tablet: 8-column, gutter 20, padding 24.
- Mobile: 4-column, gutter 16, padding 16, bottom nav 64 + safe-area inset.
- Radius: `4` chips · `8` inputs/small · `12` cards · `16` sheets · `999` pills.
  **Never** mix a 20 px card with an 8 px input.
- Elevation (single top light source):
  ```css
  --e1: inset 0 1px 0 rgba(255,255,255,.04), 0 1px 2px rgba(0,0,0,.50);
  --e2: inset 0 1px 0 rgba(255,255,255,.06), 0 2px 8px rgba(0,0,0,.50), 0 12px 32px -12px rgba(0,0,0,.80);
  --e3: inset 0 1px 0 rgba(255,255,255,.08), 0 24px 64px -16px rgba(0,0,0,.85);
  ```
- `--e1` at rest, `--e2` interactive/hover, `--e3` sheets and the lifted week.

---

## 6. 3D model

CSS 3D only. **No Three.js, no WebGL** — this is a daily tool that must stay under the JS budget
and hit 60 fps on a mid-range phone. Depth is achieved with perspective, layered Z, and light.

```css
--perspective: 1200px;
--tilt-max: 5deg;
```

- `.depth` → `transform-style: preserve-3d; perspective: var(--perspective);`
- Child layers: marks `translateZ(6px)`, floating action `translateZ(12px)`, sheet `translateZ(24px)`.
- **Tilt:** pointer-driven, max ±5°, spring back on leave (stiffness 260, damping 26).
  Only on: calendar grid (desktop), progress week tablets, gym session card.
- **Never** tilt inputs, tables, text blocks, or anything that moves while typing.
- **Pointer light:** on hover-capable devices, a 160 px radial highlight follows the cursor:
  ```css
  background: radial-gradient(160px circle at var(--mx) var(--my), rgba(255,255,255,.06), transparent 60%);
  ```
- **Press:** `translateY(1px) scale(.985)` + inset shadow, 90 ms.
- **Hover lift:** `translateY(-2px)`, 160 ms, `--e1 → --e2`.
- All 3D effects require `@media (hover:hover) and (pointer:fine)` **and** are disabled under
  `prefers-reduced-motion: reduce`.

---

## 7. Motion system

```css
--d-micro: 90ms;   /* press, check */
--d-fast: 140ms;   /* exit, tooltip */
--d-base: 200ms;   /* hover, tab */
--d-slow: 320ms;   /* page, drawer */
--d-hero: 600ms;   /* chart draw, odometer */
--ease-out:    cubic-bezier(.16,1,.3,1);
--ease-in-out: cubic-bezier(.65,0,.35,1);
--ease-exit:   cubic-bezier(.4,0,1,1);
--ease-press:  cubic-bezier(.2,.7,.2,1);
```

Springs (Motion/Framer): `{ stiffness: 260, damping: 26 }` for layout and tilt return.
Stagger: **8 ms**, max 8 items, total never above 120 ms.

| Interaction | Spec |
|---|---|
| Page enter | opacity 0→1 + translateY(8px→0), `--d-slow`, `--ease-out`; content stagger 8 ms |
| Page exit | opacity 1→0, 120 ms, `--ease-exit` |
| Tab change | content 120 ms crossfade + 4 px directional slide; active pill uses `layoutId` spring |
| Month change | 240 ms directional slide (next = left, prev = right); cells stagger 8 ms |
| Day cell open | **shared-element FLIP** cell→panel, 320 ms; scrim 200 ms; panel content stagger 40 ms |
| Button press | scale .98, 90 ms, `--ease-press` |
| Set logged | row scale .99→1, check path draw 180 ms, ring pulse 1.06→1, accent flash 8%→0 over 400 ms |
| Number change | odometer: `translateY(40%) + blur(4px)` → settle, 420 ms, digit stagger 18 ms |
| Chart mount | path draw via `stroke-dashoffset`, 600 ms, **once per mount only** |
| Heatmap mount | rows stagger 20 ms, cells 6 ms, total ≤ 400 ms |
| Drawer (mobile) | bottom sheet, spring `{320, 30}`, drag-to-dismiss, scrim fade 200 ms |
| Drawer (desktop) | right panel 360 px, translateX 24px→0 + fade, 320 ms |
| Toast | 180 ms in, 3 s hold, 140 ms out; only one at a time |
| Focus ring | instant — never animated |

**Reduced motion:** all durations → 0.01 ms, transforms removed, tilt/parallax disabled,
odometer becomes instant text swap, chart draws fully. Opacity may remain.

**Performance:** animate only `transform` and `opacity`. Never animate `width`, `height`,
`top`, `box-shadow`, `filter` on large surfaces. Use `will-change` only during an interaction,
then remove it. `backdrop-filter` only on the sheet scrim (never on cards).

---

## 8. Three signature moments

These are the only places where the interface is allowed to show off.

### 8.1 Pulling the day out of the ledger
Calendar cell → day panel with a **FLIP shared-element transition**: the cell's rectangle
expands into the panel, its content crossfades, the scrim fades in behind.
On mobile it becomes a bottom sheet that rises with a spring and can be dragged down.
The cell that opened keeps a `--line-strong` border and a subtle inner shadow — like a card
pulled halfway out of a drawer.

### 8.2 The set locks in
When a set is checked: the checkbox's check **draws** (180 ms), the row's background flashes
`--accent-soft` and decays, the row settles from `scale(.99)`, and a 1 px accent ring pulses
outward once. Optional `navigator.vibrate(10)` on mobile. No confetti, no sound.
Finishing a session raises the accent ring on the header once and returns to the calendar,
where the day's G mark fills with the same 180 ms draw.

### 8.3 The week lifts
On the Progress page, 12 week tablets are stacked in perspective. The current week sits
**+24 px Z** with an accent edge; past weeks recede to `opacity .55` and `translateZ(0)`;
future weeks are outlines. On desktop, pointer tilt moves the stack ±5°. Entering the viewport
animates the tablets settling into place once (stagger 40 ms). On mobile it renders flat.

---

## 9. Components

| Component | Spec |
|---|---|
| **Button / primary** | h44, radius 10, accent bg, ink text, label 13/500 +0.04em; press scale .98; disabled opacity .35 |
| **Button / ghost** | h44, 1 px `--line`, transparent, hover `--surface-2` |
| **Icon button** | 40×40, radius 10, 24 px glyph, 1.5 px stroke |
| **Stepper input** | 44 px tall; `−` / number / `+`; mono 16; long-press repeats; commit on blur |
| **Text input** | h44, `--surface-2`, 1 px `--line`, radius 8; focus border `--accent`, 2 px ring at 20% |
| **Segmented tabs** | label caps, active pill `--surface-2`, 160 ms, `layoutId` indicator |
| **Card** | `--surface-1`, 1 px `--line`, radius 12, padding 20; clickable cards lift 2 px |
| **Keycap (calendar day)** | aspect 1/1 mobile, 1/0.72 desktop; date top-left mono 12; 4 marks bottom row; presses 1 px |
| **Mark (pillar)** | 5 px dot mobile / 14 px glyph desktop; done = filled accent; not done = 1 px outline `--text-3`; slip = outline with diagonal strike, never red |
| **Sheet** | mobile bottom, radius 16 top, drag handle 36×4, max-height 88vh |
| **Toast** | bottom 16 + safe area, `--surface-2`, radius 10, 13 px, auto-dismiss 3 s |
| **Empty state** | 24 px glyph, one line `--text-2`, one ghost action |
| **Lock card** | `--surface-1` with 45° hairline stripes at 2% opacity, lock glyph, countdown in mono |
| **Stat** | label caps 11, value mono 40/500, delta chip 11 |
| **Heatmap** | 11 px cells, 3 px gap, radius 3; 5 steps: `--surface-3`, accent 15/35/60/85/100% |
| **Streak ring** | 2 px stroke, accent, circumference draw 600 ms, track `--surface-3` |
| **Line chart** | 1.5 px line, area gradient accent 12%→0, horizontal grid only at 4% opacity, no y-axis labels on mobile; crosshair + mono tooltip on hover |
| **Checkbox** | 20 px, 1.5 px border, radius 4; checked = accent fill + ink check (path draw 180 ms) |
| **Nav** | desktop left rail 72 px: 4 pillar glyphs + labels, active = accent left tick; mobile bottom bar 64 px, 5 items (Calendar, Gym, Study, Clean, Progress) |

**Interaction rules**
- Every clickable has hover, focus-visible, active, and disabled states.
- Inputs never resize the layout. Number fields never show spinners.
- Destructive actions (Clear data) require typing `CLEAR`.
- No modals for anything that can be an inline edit.

---

## 10. Screen layout

**Calendar**
- Header: month + year (display), `‹ ›` icon buttons, "Today" ghost, 12-week phase chip.
- Weekday row: caps 11, `--text-3`, aligned to cells.
- Grid: 7 columns, 5–6 rows, 8 px gap (desktop 12). Outside-month days at 30% opacity.
- Today: 1 px accent border + date in accent. Selected: `--surface-2`.
- Marks bottom-left, 4 in a row, 6 px gap.
- Below the grid on desktop: the day panel inline (360 px right column); mobile: sheet.

**Gym**
- Sticky session header: workout name, `Week 3 of 12 · Push A`, timer, `Finish` primary.
- Exercise block: name (15/500), `4 × 6–8 · RIR 2` in mono 13 `--text-2`, note in `small`.
- Set rows: grid `44px 1fr 1fr 44px` = set no. · weight · reps · check. Divider 1 px every 4 rows.
- Suggested weight chip: `↑ 22.5` accent-soft, 4 px radius, tooltip explains the rule.
- Rest timer appears after a check: 2:00 countdown, tap to skip, lives in the sticky header.
- Plan tab: accordion per day; edit mode toggles inline fields — no modal.
- Progress: exercise rows with last weight, best set, sparkline 80×24.
- Body: weight chart with the target band as a hatched region, current weight as a big mono number.
- Fuel: three progress rings (kcal, protein, water) + checklist; rings draw once on mount.

**Study**
- Timer as the hero: `display-xl` mono, center, with Start/Stop as a 56 px accent circle.
- Under it: today / week / all-time in a 3-column stat row.
- Heatmap month view + 30-day bar chart.

**Clean**
- Hero: current streak `display-xl`, with the best streak as a small mono line beneath.
- Two 48 px buttons: `Clean today` (accent) and `I slipped` (ghost). One-tap, undoable for 5 s via toast.
- Month grid of marks; slip days are hollow, **never red**.
- Monthly clean-day % as a mono stat.

**Progress**
- Section 1: week tablets (§8.3).
- Section 2: 2×2 chart grid (sessions, study hours, clean %, km).
- Section 3: year heatmap, 4 rows.
- Section 4: data & preferences — Export / Import / Clear, reduce-motion toggle.

---

## 11. Charts

- Hand-rolled SVG. **No chart library** (control + bundle size).
- Colors: line `--accent`, area accent 12% → transparent, grid `rgba(255,255,255,.04)`.
- 1 px gridlines, no vertical grid, no axis labels except 3 time ticks (`small`, `--text-3`).
- Hover: 1 px crosshair `--line-strong`, 4 px dot, tooltip on `--surface-2`.
- Empty data: dashed baseline + "No data yet" in `--text-3`. Never a fake line.
- Animate only on first mount; updates morph over 200 ms, no replay.

---

## 12. Accessibility

- WCAG AA: 4.5:1 body, 3:1 large; accent on bg passes AAA.
- Visible focus: 2 px `--accent` outline, 2 px offset. Never `outline: none` without replacement.
- 44×44 minimum targets; 8 px minimum spacing between adjacent targets.
- Calendar grid: roving tabindex, arrow keys, `Home` = today, `Enter` opens the day.
- Timer: `aria-live="polite"` announces at start/stop only, not every second.
- Marks carry `aria-label` ("Gym: done, 19 October"); do not rely on color.
- Reduced motion honored everywhere; add an in-app "Reduce motion" toggle in Progress → Data & preferences.
- Zoom to 200% must not break layout; no fixed heights on text blocks.
- Language: `lang="en"`; dates use `Intl.DateTimeFormat`.

---

## 13. Performance budget

| Metric | Budget |
|---|---|
| JS (gzip) | ≤ 130 KB |
| CSS (gzip) | ≤ 20 KB |
| Fonts | 2 files, subset, ≤ 60 KB total |
| LCP | < 1.5 s on a mid Android |
| Input latency | < 50 ms |
| Animation | 60 fps; no long tasks > 50 ms |
| Network after load | **zero requests** |

Rules: `content-visibility: auto` on long lists; memoize derived stats; localStorage writes debounced
to 150 ms but flushed on `pagehide`; no layout reads inside pointer handlers.

---

## 14. Anti-patterns (reject on sight)

- Confetti, emoji bursts, sound effects, XP bars.
- Glassmorphism cards, gradient blobs, neon glows.
- Red for a missed habit or a slip.
- Scroll-jacking, parallax on body text, tilt on inputs.
- Animating every list item on every render.
- Spinners or skeletons for local data.
- More than one accent color.
- Fake data in charts.
- Hover-only affordances that hide functionality on touch.
- A modal for an edit that fits inline.

---

## 15. Definition of done (UI)

1. Open on a 390 px phone and a 1440 px laptop — layout, type, spacing hold.
2. Every interactive element has hover / focus-visible / active / disabled.
3. Tab through the calendar with the keyboard; open a day with `Enter`.
4. Toggle OS reduced motion — no transforms, no tilt, no odometer.
5. Lighthouse: performance ≥ 95, accessibility ≥ 100, best practices ≥ 95.
6. All four signature interactions feel identical in timing on repeat.
7. Grayscale screenshot still reads: hierarchy is not carried by color.
8. No horizontal scroll at 320 px.
9. No network requests in DevTools after first load.
10. 200% zoom: no clipped text, no overlapping controls.
