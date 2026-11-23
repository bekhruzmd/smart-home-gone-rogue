# Setup

Everything here uses free tiers: Supabase Free, Vercel Hobby.

## 1. Install

Requires Node.js 20 or newer (tested with Node 26).

```bash
npm install
```

## 2. Create the Supabase project

1. Go to <https://supabase.com>, then **New project**. Pick any name and region and save the database password somewhere safe; the app doesn't need it.
2. When the project is ready, open **SQL Editor**, then **New query**.
3. Paste and **Run** each file **in this order**:
   1. `supabase/migrations/001_schema.sql`: tables, constraints, indexes
   2. `supabase/migrations/002_security.sql`: Row Level Security policies and grants
   3. `supabase/migrations/003_seed_functions.sql`: the demo-home functions
   4. `supabase/migrations/004_apply_home_plan.sql`: atomic saves and activity history

   Each should finish with "Success. No rows returned". All four are safe to run again.
4. Check under **Table Editor**: five tables (`homes`, `rooms`, `devices`, `automation_rules`, `activity_logs`), each with a "RLS enabled" label.

> There is no seed data to insert by hand. The first time an account signs in, the app calls `create_demo_home()`, which creates that user's home with 4 rooms, 6 devices, 6 rules and 2 log entries.

## 3. Set up sign-in

**Authentication → Sign In / Providers → Email** must be enabled (it is by default).

For a smooth demo, create your presentation account ahead of time:

- **Option A (recommended):** **Authentication → Users → Add user → Create new user**. Enter an email and password and tick **Auto Confirm User**.
- **Option B:** use **Create one** on the app's sign-in page. With "Confirm email" switched on (the default), you must click the link in the confirmation email before you can sign in.

## 4. Environment variables

In Supabase, go to **Project Settings → API Keys** (or **Data API**) and copy:

- the **Project URL**, e.g. `https://abcd1234.supabase.co`
- the **publishable** key (`sb_publishable_…`) **or** the legacy **anon public** key. Both work.

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://abcd1234.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

> ⚠️ **Never** use the `service_role` / secret key here. Anything starting with `VITE_` is bundled into the JavaScript that every visitor downloads. The anon/publishable key is designed to be public; RLS is what protects the data.
>
> `.env` is listed in `.gitignore`, so it isn't committed.

## 5. Run locally

```bash
npm run dev
```

Open the URL it prints (normally <http://localhost:5173>) and sign in. You should see the "gone rogue" house: alarm alert, unlocked doors, 90 °F.

Other commands:

```bash
npm test
```

```bash
npm run build
```

```bash
npm run preview
```

- `npm test` runs the 27 unit tests (automation engine, modes, security, emergency).
- `npm run build` makes the production build in `dist/`.
- `npm run preview` serves that production build locally.

## 6. Deploy to Vercel

1. Push the project to a GitHub repository. `.env` stays out because of `.gitignore`.
2. <https://vercel.com>, then **Add New… → Project**, then import the repository. Vercel detects **Vite** automatically (build `npm run build`, output `dist`).
3. Under **Environment Variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same values as your `.env`.
4. **Deploy.** If you change environment variables later, redeploy: Vite bakes them in at build time.
5. Back in Supabase: **Authentication → URL Configuration → Site URL**, set to your Vercel URL (e.g. `https://smart-home-gone-rogue.vercel.app`), so confirmation emails link to the live site.

No `vercel.json` is needed. The app uses hash URLs (`/#/activity`), so every route is the same `index.html`.

## 7. Optional: re-run the RLS proof locally

This needs PostgreSQL installed locally; it does not touch Supabase.

```bash
createdb shgr_test
```

```bash
psql -d shgr_test -f supabase/tests/local_auth_stub.sql
```

```bash
for f in supabase/migrations/*.sql; do psql -d shgr_test -f "$f"; done
```

```bash
psql -d shgr_test -f supabase/tests/local_rls_check.sql
```

Each line commented `expect …` in the check file should print that exact error. Running the check a second time on the same database reuses the homes it created, so start from a fresh database for clean numbers.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Supabase is not configured" screen | `.env` missing or misnamed. The variables must start with `VITE_`. Restart `npm run dev`. |
| "Loading your home failed: Could not find the function public.create_demo_home" | `003_seed_functions.sql` wasn't run. |
| "permission denied for table …" | `002_security.sql` wasn't run, or was run before `001`. Run all four again in order. |
| "Email not confirmed" | Confirm via the email link, or create the user with **Auto Confirm User** (step 3). |
| Works locally, blank data on Vercel | Environment variables are missing in Vercel. Add them and **redeploy**. |
