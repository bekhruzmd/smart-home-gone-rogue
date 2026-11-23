# Presentation Guide (5–7 minutes)

Timings are for 6 minutes. **If you only have 5:** cut section 6 to one sentence and skip the optional parts of the demo. **If you have 10:** do the whole demo, including the emergency override, and open one source file (section 5).

---

## 1. Introduction and purpose (0:00–0:30)

> "My final project is **Smart Home Gone Rogue 2.0**, a full-stack smart home dashboard built with React, Vite and a Supabase PostgreSQL database, deployed on Vercel. Everything is simulated: no real hardware. The goal was to take a one-file class exercise and turn it into a real application with persistence, automation, security and testing."

## 2. What the original assignment did (0:30–1:00)

Have `original/src/App.jsx` ready to show briefly if asked.

> "The original, from Lecture 18, was one 31-line React component. It had four cards (lights, doors, climate, alarm), each a single true/false value in `useState`, plus an emergency override where you typed 'I control this house' to reveal the code 2026. It had a nice reusable `SystemCard` component, but if you refreshed the page, everything reset, because nothing was saved."

## 3. What I added (1:00–1:45)

Say these five in one breath each:

1. **Real persistence:** a Supabase database with five related tables. Every change survives refresh.
2. **Real rooms and devices:** four rooms, brightness sliders, two door locks, a thermostat with presets and heat/cool modes.
3. **Home, Away and Night modes** and a **rule-based automation engine** you can switch on and off.
4. **Security simulation:** arm/disarm, a Simulate Intrusion button, alerts and a filterable activity log.
5. **Accounts and security:** Supabase login and Row Level Security, so each user only sees their own house. Plus **27 automated tests**.

> "And I kept the original's ideas: `SystemCard`, the issue counter, the 'I control this house' phrase, Restart demo and the alarm sound."

## 4. Live demo (1:45–4:15)

Follow **DEMO_SCRIPT.md** steps 1–10, the short version:

lighting to 35% → Comfort preset + invalid 120 → **Away** → Simulate intrusion → acknowledge → Activity filters → **refresh** → Supabase table editor.

## 5. Technical architecture (4:15–5:00)

Show the diagram in **ARCHITECTURE.md** (§1).

> "There are three layers. **Components** only display data and call actions. The **`useSmartHome` hook** owns the state. For every action it asks the **automation engine**, a set of pure JavaScript functions, for a *plan*: what the house should look like next, which columns to update, and what to log. The hook updates the screen immediately and then the **service layer** saves the plan to Supabase. If the save fails, I show the error and reload from the database, so the UI never lies."

> "The engine has no React and no network code, which is why I could write 27 unit tests for it."

## 6. Database (5:00–5:30)

> "The `homes` table has one row per user, linked to Supabase's `auth.users`. Rooms, devices, rules and logs all have a foreign key to `homes`. CHECK constraints stop bad values like 150 % brightness. Row Level Security policies only allow rows where `user_id` equals the logged-in user, the activity log is append-only, and users can only update specific columns. I tested this with a SQL script that logs in as two different users."

## 7. Challenges and lessons learned (5:30–6:15)

Pick two:

- **Silent RLS failures.** An UPDATE blocked by Row Level Security doesn't return an error; it just changes zero rows. I ask for the updated rows back and treat zero as a failure.
- **Optimistic UI vs. honesty.** Updating the screen first feels instant, but I had to decide what happens when the save fails. My rule is: reload the truth from the database.
- **The slider spammed the database.** Each drag fired dozens of updates, so I debounced it to save once, 400 ms after you stop.
- **Modes vs. rules.** At first modes did everything. Moving mode lighting into rules made the automation feature real: you can switch it off and see the difference.
- **React StrictMode** runs effects twice in development, which could create two demo homes at once. I fixed it in SQL with `ON CONFLICT DO NOTHING`.

## 8. Conclusion (6:15–6:30)

> "So the project went from a 31-line in-memory demo to a deployed full-stack app with a relational database, authentication, Row Level Security, a tested automation engine and an activity history. All the code is mine to explain. Thank you, and I'm happy to take questions."

---

### Delivery tips

- Talk while the page loads; never stand in silence.
- When you click something, **say what will happen first**, then click. If it doesn't happen, you've still explained it.
- Keep **TECHNICAL_QA.md** open on your phone or a printout.
- If a question is outside what you built, say so honestly: "I didn't implement that; here's how I would…"
