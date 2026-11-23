# Original vs. Final

**Sources for the "Original" column**

- **[Code]**: verified by reading the original repository, preserved unchanged in `original/`: `original/src/App.jsx` (31 lines), `original/src/App.css`, `original/README.md`, `original/package.json`.
- **[Notes]**: from my own exit-ticket notes for that assignment. They say "Lecture 18", the StackBlitz link and that the build passed.
- The original **assignment handout** from Dr. Holloman was **not** in the repository, so nothing below is based on it.

## Features

| Area | Original (Lecture 18) | Final (2.0) |
|---|---|---|
| Rooms | none; one whole-house value per system [Code] | Living room, bedroom, kitchen, bathroom, stored in a `rooms` table |
| Lighting | one on/off toggle for the whole house [Code] | per-room on/off, brightness slider 0–100 %, master on/off, glow that follows brightness |
| Doors | one lock/unlock toggle [Code] | front and back door as separate devices, lock all/unlock all, shown per room and in Security |
| Climate | slider 55–90 °F, comfort zone 68–76 °F [Code] | same slider, range and comfort zone **kept** (now debounced and saved), plus ± buttons, typed input with validation, Eco/Comfort/Sleep presets, Heat/Cool/Auto/Off |
| Alarm | "Silence / Trigger alarm" toggle [Code] | arm/disarm, alarm triggered vs. armed tracked separately, **Simulate Intrusion** with location, persistent alert you must acknowledge |
| Modes | none [Code] | Home / Away / Night, each changing locks, alarm and temperature, with lighting via rules |
| Automation | none [Code] | 6 database-stored rules (WHEN / AND / THEN), enable/disable switches, deterministic engine, rule-run log |
| Activity history | none; one status message line [Code] | `activity_logs` table, recent-activity panel, full page with filters by type, "Simulated" tags |
| Issue counter | counts 4 hard-coded problems [Code] | **kept**, now computed from database state (`homeStatus.js`) and listing each issue |
| Emergency override | phrase "I control this house", then reveal code 2026, then set four booleans back to safe values [Code] | real emergency **state**: unlocks doors, lights 100 %, HVAC off, pauses automation, blocks mode changes, logged, persistent banner; the phrase is **kept** as the explicit restore confirmation |
| Restart demo | resets the four booleans in memory [Code] | **kept** as `reset_demo_home()` SQL function; restores the rogue state in the database and keeps history |
| Sound | Web Audio tones and repeating alarm, toggle in header [Code] | **kept** (`useAlarmSound`): beeps while the alarm or emergency is active |
| Persistence | none; refresh resets everything [Code] | Supabase PostgreSQL; everything survives refresh and works across devices |
| Users | none [Code] | Supabase Auth email/password; each user has their own private home |
| Theme | purple/dark blue, "SMART HOME CONTROL CENTER" heading [Code][Notes] | light "posted safety signage" design: white ground, black rules, ISO safety colours (green safe, yellow hazard, red danger, blue active); the status counter became a posted sign that turns green when the house is fixed; "NOVA HOME OS" brand and "gone rogue" story **kept** |

## Technical improvements

| Topic | Original | Final |
|---|---|---|
| Structure | one `App.jsx` with all state and logic, plus one CSS file [Code] | `pages/`, `components/`, `hooks/`, `services/`, `lib/`, `styles/` (39 source files) |
| Reusable components | `SystemCard` reused 4× via props + children [Code][Notes] | `SystemCard` **kept** and reused 6×; plus `RoomCard` ×4, `Switch`, `BrightnessSlider` (lights and thermostat), `ActivityList`… |
| State | 9 `useState` booleans/strings in `App` [Code] | one custom hook (`useSmartHome`) owning database-backed state; small local UI state in components |
| Logic | inline in event handlers [Code] | pure, tested functions in `automationEngine.js` |
| Data | in memory | PostgreSQL with primary/foreign keys, CHECK constraints, indexes, triggers |
| Security | hard-coded code shown on screen (README says it isn't real security) [Code] | Auth + Row Level Security + column grants + append-only log; no secrets in code |
| Errors | none needed (no I/O) | loading screens, error screens, toasts, rollback by reloading on failed writes, error boundary |
| Validation | slider limits only [Code] | input validation in the UI **and** CHECK constraints in the database |
| Testing | manual (exit-ticket notes) [Notes] | 27 automated Vitest tests + SQL RLS check script |
| Accessibility | focus outlines, labels, `aria-live` overview, reduced-motion [Code] | all of that **kept**, plus `role="switch"`, `aria-pressed`, `role="alert"` banners, keyboard-operable everything, mobile layout |
| Deployment | StackBlitz [Notes] | Vercel + environment variables |

## Skills demonstrated

| Skill | Where in the final code |
|---|---|
| HTML semantics / accessibility | `<header>`, `<nav>`, `<main>`, `<ol>`/`<time>` in `ActivityList`, labelled form controls, `role="switch"` in `Switch.jsx` |
| CSS | design tokens (`styles/global.css`), grid layouts, custom range slider, gradient borders, responsive breakpoints, reduced-motion (`styles/app.css`) |
| JavaScript | pure functions, array methods (`filter`/`map`/`reduce`), async/await, `Promise.all`, closures (debounce) |
| React components & props | every file in `components/`; `SystemCard` children pattern |
| React state & hooks | `useState`, `useEffect`, `useRef`, `useCallback`; custom hooks in `hooks/` |
| Event handling | `onClick`, `onChange`, `onSubmit` with `preventDefault`, debounced slider |
| Conditional rendering | banners only when `alarm_triggered` / `emergency_active`; `AuthGate` login vs. app; emergency form vs. activate form |
| Database design | `supabase/migrations/001_schema.sql` |
| Database security | `supabase/migrations/002_security.sql`, `supabase/tests/local_rls_check.sql` |
| API integration | `services/*.js` (Supabase REST + RPC + Auth) |
| Testing | `src/lib/automationEngine.test.js` |
| Deployment | `presentation/SETUP.md` §6 |
