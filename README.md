# Smart Home Gone Rogue 2.0

A full-stack, **simulated** smart home dashboard built with React + Vite, Supabase (PostgreSQL, Auth, Row Level Security) and Vercel. It expands the Lecture 18 class assignment "Smart Home Gone Rogue", which is preserved unchanged in [`original/`](original/).

No real devices, sensors or emergency services are connected. Everything is a simulation, and simulated security events are labelled as such.

## Features

- **Dashboard:** 4 rooms, lighting, door locks, thermostat, alarm, home mode, active-issue counter, recent activity
- **Lighting:** per-room on/off and brightness (0–100 %), master on/off, glow that follows brightness
- **Security:** lock/unlock doors, arm/disarm, **Simulate intrusion**, persistent alert with acknowledge, security history
- **Climate:** target 55–90 °F (±, typed input with validation), Eco/Comfort/Sleep presets, Heat/Cool/Auto/Off
- **Modes:** Home, Away and Night change locks, alarm, temperature and (via rules) lighting
- **Automation rules:** 6 deterministic WHEN / AND / THEN rules stored in the database, each with an enable/disable switch
- **Activity history:** every change logged to the database, with filters by event type
- **Emergency override:** unlocks doors, lights 100 %, HVAC off, pauses automation; restoring requires typing "I control this house"
- **Accounts:** Supabase email/password sign-in; RLS keeps each user's home private

## Quick start

```bash
npm install
```

```bash
cp .env.example .env
```

Fill in `.env` from your Supabase project, and run all four SQL files in order in `supabase/migrations/` (see [SETUP](presentation/SETUP.md)). Then:

```bash
npm run dev
```

```bash
npm test
```

```bash
npm run build
```

## Documentation

| File | Contents |
|---|---|
| [presentation/SETUP.md](presentation/SETUP.md) | Supabase, environment variables, running, Vercel deployment |
| [presentation/ARCHITECTURE.md](presentation/ARCHITECTURE.md) | diagrams, data flow, schema, automation engine, emergency override, decisions |
| [presentation/ORIGINAL_VS_FINAL.md](presentation/ORIGINAL_VS_FINAL.md) | what changed compared to the original assignment |
| [presentation/PRESENTATION_GUIDE.md](presentation/PRESENTATION_GUIDE.md) | 5–7 minute talk plan |
| [presentation/DEMO_SCRIPT.md](presentation/DEMO_SCRIPT.md) | step-by-step live demo and backup plan |
| [presentation/TECHNICAL_QA.md](presentation/TECHNICAL_QA.md) | 30 likely questions with answers |

## Project layout

```
src/components  reusable UI (SystemCard from the original, RoomCard, ThermostatPanel…)
src/pages       Dashboard, Automations, Activity, Login
src/hooks       useSmartHome (state + actions), useAuth, …
src/services    all Supabase calls
src/lib         automation engine (pure, tested), modes, constants
src/styles      design tokens + component styles
supabase/       SQL migrations and an RLS check script
original/       the original Lecture 18 assignment, unchanged
```
