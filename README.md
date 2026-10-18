# Kept — Private Training Ledger & Four Promises

Kept is a private, single-user training ledger designed to execute a structured 12-week muscle-building plan and track four core promises: **Gym, Running, Study, and Clean Living**.

It is built as a precision instrument: dark, fast, quiet, monospace numerals, hand-rolled SVGs, CSS 3D physics, and zero external network requests after load.

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

## Data Model & Local Persistence

- **Zero Cloud Sync / Zero Accounts:** All data lives exclusively on the user's machine in `localStorage` under key `kept.v1`.
- **Write-Through Persistence:** All mutations update in-memory state and trigger a debounced 150ms write-through.
- **Safety Flushes:** Flushes to persistent storage immediately on `pagehide` and `visibilitychange (hidden)`.
- **Multi-Tab Synchronization:** Automatically synchronizes state changes across tabs via the `storage` event.
- **Test Override:** Supports `?date=YYYY-MM-DD` query parameter for deterministic temporal testing without modifying the host clock.

---

## Export, Backup & Recovery

- **Export:** Navigate to **Progress → Data & Preferences → Export JSON**. Downloads an atomic, pretty-printed snapshot named `kept-YYYY-MM-DD.json`.
- **Import:** Select **Choose JSON File** in **Progress → Data & Preferences**. The system validates version compatibility and array schemas before displaying an import confirmation summary.
- **Reset:** To restore the original factory plan and clear history, type `CLEAR` into the destructive reset field. Past denormalized exercise names in saved history remain immutable.
