# Kept — Training Ledger & Four Promises

Kept is a **local-first, single-user** training ledger for a structured 12-week muscle-building plan and four promises: **Gym, Running, Study, and Clean Living**.

The **source and GitHub Pages demo are public**. Your training data is not: it stays in this browser (`localStorage` key `kept.v1`) unless you opt into your own Supabase project. There are no other users, no shared feed, and no server-side ledger in the default build.

It is built as a precision instrument: dark, fast, quiet, monospace numerals, hand-rolled SVGs, and CSS 3D physics. It makes zero network requests unless cloud sync is configured.

**Live:** <https://2410305056-tech.github.io/kept/>  
**License:** [MIT](LICENSE)

---

## Architecture & Technology Stack

- **Framework:** React 19 + Vite
- **Routing:** `react-router-dom` with `HashRouter` (static hosting & local preview compatible)
- **Styling:** Tailwind CSS v4 + `@tailwindcss/vite` + Pure CSS Custom Properties
- **Motion:** `motion` (spring layout, directional slides, FLIP panel transitions)
- **Typography:** Self-hosted `@fontsource-variable/geist` and `@fontsource-variable/geist-mono`
- **Graphics & Visuals:** Hand-crafted SVG charts (LineChart, BarChart, Heatmap, Sparklines, ProgressRing). No external chart libraries.

---

## Local Development & Production

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Compile production bundle
npm run build

# Preview production build locally (verify 0 network requests)
npm run preview
```

---

## Data Model & Persistence

- **Local-first:** every write goes to `localStorage` under `kept.v1` first. The app is fully usable offline and without an account.
- **Optional cloud sync:** set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` at build time, run `supabase/schema.sql`, then sign in from Progress → Data & Preferences. Changes upload ~1.2 s after you stop editing; the app pulls on load/foreground when this device has no unsynced edits. Without those variables, no network request is made. Setup: [`supabase/README.md`](supabase/README.md).
- **Write-Through Persistence:** All mutations update in-memory state and trigger a debounced 150ms write-through.
- **Safety Flushes:** Flushes to persistent storage immediately on `pagehide` and `visibilitychange (hidden)`.
- **Multi-Tab Synchronization:** Automatically synchronizes state changes across tabs via the `storage` event.
- **Test Override:** Supports `?date=YYYY-MM-DD` query parameter for deterministic temporal testing without modifying the host clock.

---

## Export, Backup & Recovery

- **Export:** Navigate to **Progress → Data & Preferences → Export JSON**. Downloads an atomic, pretty-printed snapshot named `kept-YYYY-MM-DD.json`.
- **Import:** Select **Choose JSON File** in **Progress → Data & Preferences**. The system validates version compatibility and array schemas before displaying an import confirmation summary.
- **Reset:** To restore the original factory plan and clear history, type `CLEAR` into the destructive reset field. Past denormalized exercise names in saved history remain immutable.
- **Export reminder:** the export card shows how long ago the last JSON backup was taken and warns after 7 days.

---

## Behavior Defaults

- **Sound is off by default** (`settings.soundEnabled`). Toggle it in the Gym rest bar or Progress → Data & Preferences.
- **Clean Extras are off by default** (`settings.cleanExtras`). The daily Clean page shows only *Clean today* / *I slipped*. Enable Friction Hold and the Vulnerability Clock in Progress.
- **Charts accept tap:** on a phone, tap a bar, point, or heatmap cell to pin its value; tap empty space to clear.
- **Progression grace:** with N prescribed sets, N−1 at the top of the range plus one at `repHigh − 1` still adds weight. Two short sets hold.
- **Running unlock:** compares the average of the last three weigh-ins with the previous three. Unlocks on/after 16 Nov 2026.

---

## Testing

```bash
npm test        # logic matrix (13 checks)
npm run build
npm run lint
```

Logic, seed, dates, and import validation are covered by `npm test`. Calendar FLIP, rest-timer feel, and chart taps are exercised on the live Pages build; they are not in the Node matrix.

---

## Deployment

Every push to `main` builds and deploys to GitHub Pages:
<https://2410305056-tech.github.io/kept/>

To enable cloud sync in the deployed build, add repository Actions variables
(**Settings → Secrets and variables → Actions → Variables**):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Without them the deployed app is local-only on each device. The GitHub Pages
workflow uses the `kept/` base path; local development stays at `/`.
