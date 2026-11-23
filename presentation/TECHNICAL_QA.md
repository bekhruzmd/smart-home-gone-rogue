# Technical Q&A: likely questions and answers

Every answer refers to the actual code. File paths are relative to the project root.

---

### React

**1. What is a component? Show me one you reused.**
A function that takes **props** and returns JSX describing part of the UI. `src/components/SystemCard.jsx` is carried over from the original assignment. It renders the card frame (icon, title, status badge), and `children` fills in the controls. It's reused for Climate, Security, Recent activity, the Rules list, Recent rule runs and the Activity page. `RoomCard` is rendered four times, once per room, from `rooms.map(...)` in `LightingPanel.jsx`. `BrightnessSlider` is reused with different props: 0–100 % for lights and 55–90 °F for the thermostat.

**2. What's the difference between props and state?**
**State** is data a component owns and can change. When it changes, React re-renders. **Props** are read-only inputs passed from a parent. The home's state (`home`, `rooms`, `devices`, `rules`, `logs`) lives in the `useSmartHome` hook inside `SmartHomeApp` (`src/App.jsx`). It's passed down as props: `DashboardPage` gets `state` and `actions`, `RoomCard` gets one `room`, `light` and `lock`. A child can't change props. It calls a function prop like `actions.toggleLight(id)`, and the owner updates its state.

**3. Which hooks did you use and why?**
- `useState`: component state, e.g. the typed temperature in `ThermostatPanel`.
- `useEffect`: side effects. Loading data when the user changes (`useSmartHome`), subscribing to auth changes (`useAuth`), listening to `hashchange` (`useHashRoute`), re-querying when the activity filter changes (`ActivityPage`).
- `useRef`: values that persist between renders *without* re-rendering. `stateRef` (latest state for quick successive clicks), the slider's debounce timer, the AudioContext.
- `useCallback`: keeps `load`, `run` and `notify` the same function between renders, so effects that depend on them don't re-run.
- **Custom hooks** (`useSmartHome`, `useAuth`, `useNotifications`, `useHashRoute`, `useAlarmSound`) group related state and effects so components stay simple.

**4. What is a custom hook? Why is `useSmartHome` one?**
A function whose name starts with `use` and that calls other hooks. `useSmartHome` holds the state, loads it from Supabase, and exposes `actions` (`setMode`, `toggleLight`, `simulateIntrusion`…). Every page uses the same logic without copying it, and components never import Supabase.

**5. How do event handlers work in your app?**
JSX attributes like `onClick`, `onChange` and `onSubmit` receive functions. For example:
- In `ModeSelector`: `onClick={() => onSelect(m.id)}`.
- In `ThermostatPanel` the form uses `onSubmit={submitTyped}`, which calls `e.preventDefault()` so the browser doesn't reload the page, then validates and calls `actions.setThermostat`.
- `BrightnessSlider`'s `onChange` updates local state on every movement but only calls `onCommit` 400 ms after the last change (a debounce with `setTimeout` / `clearTimeout`).

**6. Where do you use conditional rendering?**
- `AlarmAlert` returns `null` unless `home.alarm_triggered`.
- `EmergencyBanner` returns `null` unless `emergency_active`.
- `AuthGate` in `App.jsx` shows `LoginPage` or the app depending on `user`.
- `EmergencyOverride` shows the *activate* controls or the *restore* form.
- `ActivityPage` shows loading, error or the list depending on `status`.
- Smaller examples: `{lock && <button…>}` in `RoomCard`, and the ternaries for badge text.

**7. Why is there a `key` prop on lists and on `SmartHomeApp`?**
In lists (`rooms.map`, `logs.map`) the `key` (the row's database id) lets React match items between renders. On `<SmartHomeApp key={user.id}>` it forces a fresh component when a different user signs in, so no state leaks between accounts.

**8. What does "optimistic update" mean in your app?**
In `useSmartHome.run()`, the screen is updated with `plan.nextState` **before** the database confirms. That's why clicks feel instant. If `applyPlan` throws, the hook shows the error and calls `load()` to reload the real data. The UI never stays in a state the database rejected.

---

### JavaScript and async

**9. Explain async/await in your code.**
Supabase calls return Promises. `async` functions let me write `const data = await supabase.from('homes')…` as if it were synchronous. While waiting, the browser stays responsive. Errors are handled with `try/catch` (e.g. `useSmartHome.run`).

**10. Why `Promise.all`?**
In `fetchHomeData` the five SELECT queries don't depend on each other, so `Promise.all` runs them in parallel: one round trip of waiting instead of five.

**11. Supabase doesn't throw errors. How do you make sure failures aren't hidden?**
supabase-js returns `{ data, error }` instead of throwing. `unwrap()` in `homeService.js` throws a real `Error` when `error` is set. The database function raises an error if a target home, device or rule is unavailable.

---

### Database and Supabase

**12. Describe your tables.**
Five tables (`supabase/migrations/001_schema.sql`):
- `homes`: one per user; mode, alarm, thermostat and emergency settings.
- `rooms`
- `devices`: lights and locks, with `type` deciding which columns are used.
- `automation_rules`
- `activity_logs`

**13. Primary and foreign keys?**
Every table has an `id` primary key: UUIDs, except `activity_logs.id`, an auto-incrementing identity. Foreign keys: `homes.user_id → auth.users.id` (UNIQUE, so one home per user), and `rooms.home_id`, `devices.home_id`, `devices.room_id`, `automation_rules.home_id`, `activity_logs.home_id`. They all use `ON DELETE CASCADE`, so deleting a home removes everything in it.

**14. Where are the CRUD operations?**
- **Create:** `INSERT` into `activity_logs` in `applyPlan`. Homes, rooms, devices and rules are created by the SQL function `create_demo_home()`, called with `supabase.rpc`.
- **Read:** `fetchHomeData`, `fetchActivity` (with a `WHERE event_type` filter).
- **Update:** `apply_home_plan` for homes, devices and rules.
- **Delete:** only inside `reset_demo_home()`, which deletes and re-seeds rooms, devices and rules. Users can't delete rows directly, on purpose: the activity log is an append-only audit trail.

**15. How does the frontend talk to the database? Is it an API?**
Yes. Supabase generates a **REST API** from the tables (PostgREST). `supabase.from('devices').update({ brightness: 35 }).eq('id', id)` becomes an HTTPS `PATCH /rest/v1/devices?id=eq.…` request carrying my login token (a JWT). Postgres runs the matching `UPDATE`, with Row Level Security applied. `supabase.rpc('create_demo_home')` calls a SQL function through the same API.

**16. What is Row Level Security and how did you configure it?**
RLS makes Postgres filter **every** query by a policy. In `002_security.sql`:
- `homes` rows are visible and updatable only when `user_id = auth.uid()`, the id inside the logged-in user's JWT.
- Child tables allow rows only when `home_id` belongs to one of those homes.
- Column grants limit updates to specific columns, e.g. `is_on`, `brightness` and `is_locked` on devices.
- `activity_logs` has SELECT and INSERT policies but no UPDATE or DELETE.
- Signed-out users (`anon`) get nothing.

`supabase/tests/local_rls_check.sql` proves it: user 2 can't see or write user 1's data.

**17. The anon key is visible in the browser. Isn't that a security problem?**
No. The anon/publishable key is designed to be public. It only identifies the project. What it can do is limited by RLS and grants, and without signing in it can do nothing in this app. The dangerous key is the **service_role** key, which bypasses RLS. It isn't used anywhere in this project. `.env` is git-ignored, and only `VITE_` variables reach the browser.

**18. Why are rooms and devices created by a SQL function instead of from React?**
So users don't need INSERT permission on those tables. If the browser could insert devices, a modified request could create junk. `create_demo_home()` runs as `SECURITY DEFINER` (with the owner's rights) but only for `auth.uid()`, so it can only create *your* home. It uses `ON CONFLICT (user_id) DO NOTHING` so two simultaneous calls (React StrictMode runs effects twice in development) can't create two homes.

---

### Automation and app logic

**19. How do automation rules execute?**
In `src/lib/automationEngine.js`:
1. An event happens, e.g. `planModeChange(state, 'away')` or `planIntrusion`.
2. `runRules(draft, 'mode_away')` returns immediately if the emergency override is active.
3. Otherwise it takes the **enabled** rules with that `trigger_event`, sorted by `sort_order`, and checks any `condition` (e.g. `alarm_armed`).
4. It runs the matching function from the `ACTIONS` map (e.g. `all_lights_off`).
5. Changes go into a *draft* copy, so later rules see earlier ones. A log entry is written only if something actually changed.

**20. Is it deterministic? How do you know?**
Yes: no randomness, no timers, no AI, a fixed sort order. Same state in gives the same plan out. A test checks exactly that (`'is deterministic: same input gives the same plan'`), and another checks that the input state isn't mutated. `planEmergency` takes the current time as a parameter so it's testable too.

**21. What do your tests cover? Did they run?**
`src/lib/automationEngine.test.js` has 27 Vitest tests, run with `npm test`:
- all three modes
- a disabled rule not running
- intrusion while armed, while disarmed, and with the alarm rule disabled
- acknowledge
- arming locks the doors
- emergency activation, automation paused during an emergency, the wrong restore phrase rejected, and restore
- brightness and temperature validation
- no database write when nothing changes
- the issue counter

**22. What does the emergency override do, and why?**
`planEmergency`:
- sets `emergency_active`, the reason and the time
- unlocks every door (evacuation and responder access)
- sets every light to 100 % (visibility)
- turns HVAC off (don't spread smoke or gas)
- logs an `emergency` event

While it's active, `runRules` does nothing and mode changes throw an error. Leaving it requires typing "I control this house" (`planRestoreNormal`). That clears the emergency and re-applies Home Mode.

**23. How do you handle invalid input?**
Three layers:
1. **UI:** `ThermostatPanel` validates the typed value with `validateTemperature` and shows an inline error. Sliders have min and max.
2. **Engine:** `planThermostat` and `planBrightness` throw on invalid values, so nothing is sent.
3. **Database:** CHECK constraints (`target_temp between 55 and 90`, `brightness between 0 and 100`, allowed enum values) reject anything that slips through.

The login form checks the email format and a 6-character minimum password.

---

### Frontend vs. backend, deployment, security

**24. What's frontend and what's backend here?**
- **Frontend:** the React app (UI, state, automation logic) running in the browser, built by Vite and served by Vercel as static files.
- **Backend:** Supabase. PostgreSQL stores the data, the auto-generated REST API, Supabase Auth issues login tokens, and RLS policies and SQL functions enforce the rules.

There is no custom Node server. Logic that must be trusted, like who owns what, valid ranges and the append-only log, is enforced in the database, not in React.

**25. Isn't putting automation logic in the browser risky?**
For this simulated app, the worst a user can do by tampering with the browser is change *their own* home's lights or locks, which they're allowed to do anyway. RLS and column grants stop them touching anyone else's data or changing device types. In a real product with real hardware, I'd move the rule engine to the server, e.g. a Supabase Edge Function or a database trigger, so it runs even when nobody has the dashboard open.

**26. How is it deployed?**
Vercel builds the Vite project (`npm run build` → `dist/`) and serves it. The Supabase URL and anon key are set as Vercel **environment variables**, which Vite bakes into the bundle at build time. Hash-based routing (`#/activity`) means no server rewrite rules are needed. Steps are in `presentation/SETUP.md`.

**27. How does the alert still show after a refresh?**
It isn't React-only state. It's the `alarm_triggered` column in `homes`. On load, `fetchHomeData` reads it, and `AlarmAlert` renders while it's true. Acknowledging sets it to false in the database.

**28. What would you improve next?**
- Run the multi-row saves in a single database transaction, e.g. one SQL function per action, so a network drop can't leave half the changes saved.
- Supabase Realtime, so two open tabs update each other.
- Let users create their own rules.
- Move automation server-side.
- Add component tests with React Testing Library.

---

### Original vs. final

**29. What's actually new, compared to the original?**
See `ORIGINAL_VS_FINAL.md`. In short, the original was one 31-line component with nine `useState` values in memory. The final has:
- a 5-table relational database with authentication and RLS
- per-room devices
- three modes
- a rule engine
- simulated security events
- a filterable activity history
- a real emergency state
- error handling
- 27 tests
- deployment

I kept `SystemCard`, the issue counter, the 55–90 °F range and 68–76 °F comfort zone, the "I control this house" phrase, Restart demo and the alarm sound.

**30. Why did you keep the restore phrase if it isn't secure?**
In 2.0 it's a *confirmation*, not a password. It stops someone ending an emergency by accident with one click. The phrase is shown on screen on purpose. Real security is the sign-in plus Row Level Security.
