# Live Demo Script (about 3½ minutes)

**Before you start, 10 minutes ahead:**

- [ ] Open the live Vercel URL in Chrome. Sign in with the demo account (created with "Auto Confirm User").
- [ ] Click **Restart demo** twice, so the house is in its "gone rogue" starting state: red alarm alert, 3 active issues, 90 °F.
- [ ] In a second tab, open the Supabase dashboard **Table Editor** on the `devices` table, then `homes`.
- [ ] Browser zoom at 110–125 % so the room can read it. Close other tabs and silence notifications.
- [ ] Have `npm run dev` ready in a terminal as the backup (see the end of this file).

Say the **bold** lines; the rest are actions.

---

### 1. Open the dashboard (20 s)

> **"This is Smart Home Gone Rogue 2.0. Like the original assignment, the house starts out of control. But now every value on this screen comes from a PostgreSQL database in Supabase."**

- Point at the red **Security alert** and the **3 active issues**: alarm sounding, doors unlocked, 90 °F.
- Click **Acknowledge alert**.

> **"Acknowledging is a database write. The alert is a column called `alarm_triggered`, so if I hadn't acknowledged it, it would still be here after a refresh."**

### 2. Adjust room lighting (25 s)

- Turn the **Living Room** switch on, then drag its slider to **35 %**.

> **"The room cell goes from grey (dark) to white (lit) according to brightness. The slider waits until I stop dragging, then saves once: one UPDATE to the devices table and one row in the activity log."**

- Click **All on**, then **All off** (master control).

### 3. Change temperature (20 s)

- Click the **Comfort 72°** preset. The issue counter on the yellow placard drops.
- Type **120** in "Set exact temperature" and click **Set**. A red error appears and nothing is saved.

> **"Validation happens twice: here in React, and again as a CHECK constraint in the database. Even a hand-made API request couldn't save 120."**

- Type **70** and click **Set**. Then click **Cool**.

### 4. Activate Away Mode (25 s)

- Click **Away**.

> **"One click: both doors lock, the alarm arms, the thermostat goes to an energy-saving 78, and the 'Away Mode: lights off' automation rule turns off every light."**

### 5. Show the automatic changes (20 s)

- Point at the room cards: lights off, **Locked** badges. Point at Security: **Armed**.
- Open the **Automations** tab and show the rule rows: WHEN / AND / THEN.

> **"Rules are rows in the database; their actions are plain JavaScript functions. No AI: same input, same output, and it's unit tested."**

- *(Optional, +20 s)* Switch off **Away Mode: lights off**, go back, click **Home**, turn a light on, click **Away**: the lights stay on. Switch the rule back on.

### 6. Simulate an intrusion (20 s)

- On the dashboard, keep **Back Door** selected and click **Simulate intrusion**.

> **"This is clearly labelled as a simulation. Because the system is armed, two rules fire: the alarm triggers and every light goes to 100 %."**

### 7. Show the alarm response (15 s)

- Point at the red alert banner and "Alarm sounding". *(If sound is on in the header, it beeps.)*
- Click **Acknowledge alert**.

> **"Acknowledging silences it, but the system stays armed."**

### 8. Show the activity log (25 s)

- **Activity** tab. Click the **Security** filter chip, then **Automation**, then **All**.

> **"Each filter is a new database query: `WHERE event_type = 'security'`. The intrusion entries have the 'Simulated' tag, stored in a boolean column."**

### 9. Refresh to prove persistence (15 s)

- Press **⌘R / Ctrl+R**. Everything is the same: Away mode, locks, temperatures, history.

> **"Nothing is stored in the browser. That all came back from Supabase."**

### 10. Show the database (30 s)

- Switch to the Supabase tab. Open **Table Editor → devices** and point at `brightness`, `is_locked`, `is_on`. Then **homes**: `mode = away`, `alarm_armed = true`. Then **activity_logs**.

> **"Five tables with foreign keys back to `homes`, and `homes` links to the logged-in user. Row Level Security means my account can only ever read or change rows where `user_id` matches my login."**

### 11. Emergency override (30 s, if time allows)

- Back on the dashboard, scroll to **Emergency override**. Choose **Fire alarm**, click **Activate**, then **Confirm**.
- Point at the striped banner: doors **Unlocked**, lights 100 %, HVAC off, mode buttons greyed out.

> **"This came from the original assignment's emergency override. Now it's a real saved state: doors unlock so people can get out, lights go to full, HVAC stops, and every automation pauses until someone explicitly restores normal operation."**

- Type **I control this house** and click **Restore normal operation**. The house goes back to Home Mode.

---

## Backup plan

| Problem | What to do |
|---|---|
| **Wi-Fi is slow** | Every click updates the screen immediately and saves in the background ("Saving…" in the header). Keep going and point at the header turning back to "Saved". |
| **A save fails** | The app shows a red message and reloads the last saved state. Say: *"This is the error handling: it never pretends a failed write succeeded."* Click the control again. |
| **Vercel site down / no internet, but Supabase reachable through a hotspot** | Run `npm run dev` locally and open `http://localhost:5173`. Same code, same database. |
| **No internet at all** | You can't demo live persistence. Instead: (1) run `npm test` and walk through the 27 passing tests (modes, intrusion, emergency); (2) show screenshots or a screen recording made beforehand (**record one the day before!**); (3) open `supabase/migrations/*.sql` and the Architecture diagram. |
| **Supabase project paused** (free projects pause after about a week idle) | Supabase dashboard → **Restore project**. It takes a few minutes, so open the dashboard **the day before** to keep it awake. |
| **Forgot the password** | Supabase → Authentication → Users → create a new user with Auto Confirm. A new account gets a fresh demo home automatically. |
| **State is messy mid-demo** | **Restart demo** (two clicks) restores the rogue starting state and keeps the history. |
