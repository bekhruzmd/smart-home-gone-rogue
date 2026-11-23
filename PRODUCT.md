# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** a university student presenting the app live as a final project for a Web Systems course (USF), driving it with mouse and keyboard while explaining the code.
- **Audience:** the course professor and classmates watching the demo, on a classroom projector and/or a laptop screen shared over video. The design must read well in both settings.
- **Everyday user (simulated):** someone checking and controlling their home: lights per room, door locks, alarm, thermostat, home mode, and history.

## Product Purpose

Smart Home Gone Rogue 2.0 is a simulated smart-home control center. It expands the Lecture 18 assignment, where the house "went rogue" and the user had to restore four systems, into a full-stack app with a real database, accounts, modes, automation rules, simulated security events, an activity history and an emergency override. Success means every control visibly works live, persists after refresh, and the presenter can explain how it works.

## Positioning

A smart home that starts out of control and is brought back under control. The "gone rogue" starting state (alarm sounding, doors unlocked, 90 °F) and the restore/reset loop are the product's story, not a generic device grid.

## Operating Context

- Live demo of 5–7 minutes, following presentation/DEMO_SCRIPT.md.
- Shown on a projector in a lit room and on laptop screens; works at phone width too.
- Every device and security event is simulated and must be labelled as such.

## Capabilities and Constraints

- React 19 + Vite, plain JavaScript (no TypeScript), Supabase (PostgreSQL, Auth, RLS), deployed on Vercel. Free tiers only; no new paid services or heavy dependencies.
- Features that must keep working: per-room lights and brightness, master lights, door locks, arm/disarm, Simulate Intrusion with acknowledge, thermostat (55–90 °F, presets, heat/cool/auto/off), Home/Away/Night modes, six toggleable automation rules, filterable activity log, emergency override with "I control this house" restore, Restart demo, alarm sound, sign in/out.
- Button labels referenced by the demo script must stay recognizable.
- Code must stay simple enough for a student to explain.

## Brand Commitments

- Keep the "Smart Home Gone Rogue" story and framing from the original assignment.
- Keep the product name "NOVA HOME OS" in the header.
- The previous navy/blue/violet look is rejected: too dark and gloomy, and it looks generic. Everything else visual may change.

## Evidence on Hand

- Original assignment preserved in original/.
- No real customers, devices, or usage data; never invent them.

## Product Principles

1. Honest state: the screen never shows a change the database did not save.
2. Simulation is always labelled.
3. Every control does something; no decorative buttons.
4. Explainable over clever.

## Accessibility & Inclusion

Readable at projector distance: strong contrast, large state indicators, full keyboard operation, visible focus, reduced-motion support.
