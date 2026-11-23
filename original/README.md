# Smart Home Gone Rogue
React + Vite classroom simulation for Lecture 18.

Run: `npm install`, then `npm run dev`. Build: `npm run build`.

Use the four system cards to control lights, doors, climate, and alarm. Enable Sound for door tones and the repeating alarm tone. The issue counter updates from current state. Safe climate range: 68–76°F.

Emergency override: enter `I control this house`, choose Reveal code, enter `2026`, and choose Restore all systems. Restart demo resets the four problems.

Customizations: purple/dark blue theme and SMART HOME CONTROL CENTER heading.

SystemCard is reused four times with different title, icon, status, issue, className, and children props. App owns state; click and change events update it.

This is a classroom simulation, not secure authentication or real home automation.
