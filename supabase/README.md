# Supabase setup

The app is local-first. Cloud sync is optional and only activates when the
build has Supabase credentials.

## 1. Create the project

Create a free project at <https://supabase.com>. Wait for the database to
finish provisioning.

## 2. Create the schema

Open **SQL Editor → New query**, paste the contents of
[`schema.sql`](./schema.sql), and run it once.

This creates:

- `kept_state` — one JSONB document per user, protected by row-level security.
- `push_kept_state()` — atomic compare-and-set writes with a revision number.
- Read-only views: `kept_sessions`, `kept_body_logs`, `kept_study_sessions`,
  `kept_clean_log`, `kept_runs`, `kept_fees`.

## 3. Get the public keys

**Project Settings → API**:

- Project URL → `VITE_SUPABASE_URL`
- `anon` / public key → `VITE_SUPABASE_ANON_KEY`

The anon key is safe in a browser bundle; RLS limits every user to their own
row. **Never** put the `service_role` key in the app or the repository.

### Email code template

Supabase's default Magic Link email contains only a link, while the app verifies
a 6-digit code. Open **Authentication → Email Templates → Magic Link** and make
sure the body includes `{{ .Token }}`, for example:

```html
<h2>Your Kept code</h2>
<p style="font-size:24px;letter-spacing:6px">{{ .Token }}</p>
```

Free-tier projects using the default mailer **cannot** change this template.
The app therefore also accepts the default magic link: open it on the same
device you want to sign in. If you later add custom SMTP, include `{{ .Token }}`
and the in-app code field will work too.

## 4. Build with the keys

Local:

```bash
copy .env.example .env.local
# edit .env.local with the two values
npm run build
npm run preview
```

Hosting (Netlify, Vercel, Cloudflare Pages): add the same two variables to the
build environment. For GitHub Pages, add them as repository **Actions
variables** (Settings → Secrets and variables → Actions → Variables); the
included workflow reads `vars.VITE_SUPABASE_URL` and
`vars.VITE_SUPABASE_ANON_KEY` at build time.

## 5. Sign in

Open **Progress → Data & Preferences → Cloud Sync**:

1. Enter your email and press **Send code**.
2. Enter the 6-digit code from the email.
3. On the first device, choose **Upload this device** (or it uploads
   automatically when there is no cloud copy).
4. On a phone, open the deployed site, add it to the home screen, and sign in
   with the same email. A fresh device pulls the cloud copy automatically.

Once linked, changes upload about a second after you stop editing, and the app
pulls on load/foreground when this device has no unsynced edits. Conflicts are
revision-checked; the app reports them instead of silently overwriting.

## 6. Erase cloud data

Run [`reset.sql`](./reset.sql) in the SQL Editor. It deletes every
`kept_state` row and prints the remaining count. Device-local data is
unaffected.
