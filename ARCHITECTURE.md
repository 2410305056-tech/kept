# Frontend and backend organization

Kept is a local-first React/Vite application with an optional Supabase backend. The frontend and backend are currently separated by responsibility, but are not yet separate top-level packages. The root-level Vite setup and GitHub Pages deployment rely on the current layout.

## Frontend

- `index.html` — Vite entry point.
- `src/` — React application, UI, routes, browser state, and client-side logic.
  - `src/components/`, `src/routes/`, `src/gym/` — application UI.
  - `src/context/`, `src/hooks/` — React context and hooks.
  - `src/lib/` — browser-side application logic, local persistence, and integrations.
- `src/index.css` — application styles.
- `public/` — static assets, PWA manifest, icons, and service worker.
- `vite.config.js` — Vite and GitHub Pages configuration.

## Backend

The backend is optional and is hosted by Supabase; this repository does not contain a separate server process.

- `supabase/schema.sql` — database schema and access controls.
- `supabase/reset.sql` — cloud-data reset utility.
- `supabase/README.md` — setup and operating instructions.
- `src/lib/cloud.js` and `src/lib/syncMerge.js` — browser-side client and sync logic that connect to the hosted backend when configured.
- `.env.example` — names of the optional public build-time configuration variables.

Configure cloud sync with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never put a Supabase `service_role` secret in frontend code or a browser bundle.

## Shared project files

- `package.json`, `package-lock.json` — dependencies and scripts.
- `tests/` — automated checks.
- `.github/workflows/` — CI and GitHub Pages deployment.
- `README.md`, `DESIGN.md`, `SPEC.md`, `HANDOFF.md`, `PROMPT.md`, `ULTIMATE_PROMPT.md`, `LICENSE`, `.gitignore`, `.oxlintrc.json` — project-wide documentation, licensing, and configuration.

## Physical folder layout

The code remains at the repository root for now: Vite, its scripts, and the Pages workflow are configured around that layout. Moving files into top-level `frontend/` and `backend/` packages requires updating imports, asset paths, build configuration, tests, and deployment together. This document records the current frontend/backend boundaries without suggesting that a standalone application server exists.
