# Kept

Kept is a local-first personal progress ledger for training, running, study, and clean-living habits. Log what you did, review your weekly rhythm, and keep your personal records on your device by default. If you choose to configure the optional API, your entries can also sync to your own backend and PostgreSQL database.

> **Project identity note:** the GitHub description says Kept is a fitness and life-tracking app, but the prior `main` branch contained a salon demo and its README described that unrelated demo. No earlier Kept fitness implementation was present in the repository history I could inspect. This version implements the Kept concept from the repository’s stated purpose rather than claiming to restore source code that was not there.

## Features

- Track **gym workouts**, **runs**, **study sessions**, and **clean-living habits**.
- Dashboard totals, weekly activity, recent logs, and a current-day streak indicator based on saved entries.
- Add and delete personal entries; the UI is responsive and designed for quick logging.
- Local-first storage: the browser saves entries immediately in `localStorage`.
- Optional API sync: configure `VITE_API_URL` to send entries to the Node API. Local changes remain available if the API is offline.
- Backend health endpoint and persistent storage: PostgreSQL when `DATABASE_URL` is configured; JSON file storage for local development.

## Repository layout

```text
frontend/       Canonical React + Vite frontend (deploy this folder to Vercel)
backend/        Node.js HTTP API and storage adapters (deploy this folder to Render)
src/            Root-level compatibility entry points that re-export frontend sources
package.json    Convenience scripts for local development/build
README.md       Setup, deployment, architecture, and viva notes
```

The `frontend/` folder is the single source of truth for the UI. Root `src/` files are thin compatibility shims; they do not contain a second implementation.

## Run locally

Requires Node.js 20 or newer and npm.

```bash
# Terminal 1: start the API (file-backed storage by default)
cd backend
npm install
npm run dev

# Terminal 2: start the frontend
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open the Vite URL printed in the frontend terminal (normally `http://localhost:3000`). For local API integration, the example `.env.local` sets `VITE_API_URL=http://localhost:5001`; without it, Kept remains local-only. The backend listens on port 5001 by default and stores local API data in `backend/data/entries.json`.

To build the frontend:

```bash
cd frontend
npm run build
npm run preview
```

## API

All API responses are JSON. The backend validates entry type, title, date, and duration.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health and storage mode |
| `GET` | `/api/entries` | List saved entries, newest first |
| `POST` | `/api/entries` | Create or upsert an entry by client-generated ID |
| `DELETE` | `/api/entries/:id` | Delete an entry |

Example entry payload:

```json
{
  "id": "client-generated-uuid",
  "type": "run",
  "title": "Easy riverside run",
  "date": "2026-11-25",
  "durationMinutes": 32,
  "notes": "Comfortable pace"
}
```

## Deploy the backend to Render

1. Push this public repository to GitHub and create a **Web Service** on Render from it.
2. Set **Root Directory** to `backend`.
3. Set **Build Command** to `npm install` and **Start Command** to `npm start`.
4. Add a Render PostgreSQL database and set the service environment variable `DATABASE_URL` to its **internal** connection string. Set `NODE_ENV=production`.
5. Set `FRONTEND_ORIGIN` to your Vercel origin, for example `https://your-kept-app.vercel.app` (no trailing slash). `PORT` is supplied by Render; the server uses it.
6. Deploy, then test `https://your-api.onrender.com/api/health` and `https://your-api.onrender.com/api/entries`.

When `DATABASE_URL` is set, the API creates its `entries` table on startup and uses PostgreSQL. Without it, the API uses a local JSON file, which is suitable for development but **not durable across Render restarts/deploys** unless you separately attach and configure a persistent disk. Use PostgreSQL for a real deployment.

## Deploy the frontend to Vercel

1. Import the public GitHub repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Select the Vite framework preset; use `npm run build` as the build command and `dist` as the output directory.
4. Add the environment variable `VITE_API_URL=https://your-api.onrender.com` (the backend origin only, no `/api` suffix).
5. Add the Vercel site origin to the Render service's `FRONTEND_ORIGIN`, then redeploy the Render service if needed.
6. Deploy the frontend. Confirm the browser can open the API and that a newly created entry appears after a refresh.

Vite environment variables are compiled into the frontend at build time. If the API URL changes, redeploy the Vercel frontend. Keep secrets such as database credentials only in Render environment variables; never put them in `VITE_*` variables.

## Data and privacy trade-offs

- With no API URL configured, records stay in that browser’s local storage and do not leave the device.
- With API sync enabled, records are sent to the configured backend and stored in its database. Treat the API as your own private deployment, not as an authenticated multi-user service: this educational version has no login or per-user authorization. Do not enter sensitive health details or expose a shared database-backed instance as private personal storage.
- Local-first means the UI writes locally before attempting a network sync. If the API is down, logging still works on this device. When connectivity returns, reload the app to retry syncing local records.

## Viva guide

- **Frontend:** `frontend/src/App.jsx` renders the dashboard and manages activity form, filtering, and local state. `frontend/src/api.js` is the browser storage and optional HTTP-sync boundary.
- **Request flow:** the user submits a log → the frontend creates a UUID and saves the entry to `localStorage` immediately → if `VITE_API_URL` is configured it POSTs JSON to `/api/entries` → the Node API validates it and calls the storage adapter → PostgreSQL persists it (or the local JSON file is used in development) → the frontend updates its sync status.
- **Backend:** `backend/src/server.js` handles HTTP routes, CORS, body parsing, and validation; `backend/src/storage.js` isolates PostgreSQL and local-file persistence.
- **Deployment:** Vercel builds only `frontend/` and injects `VITE_API_URL` into the client bundle. Render runs `backend/` as a Node web service and supplies `DATABASE_URL` and `FRONTEND_ORIGIN` as server environment variables.
- **Trade-offs:** browser storage is simple and private by default but is limited to one browser/device; optional cloud sync enables persistence across reloads/devices but requires a database and currently does not include user accounts, conflict resolution, or encryption at rest managed by the app.

## Tests / checks

```bash
cd backend && npm test
cd ../frontend && npm run build
```
