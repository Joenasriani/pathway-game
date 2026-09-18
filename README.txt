PATHWAY — TECHNICAL RUN NOTES

Game type:
Static browser light-reflection puzzle using raw WebGL.

Current build:
- 30 authored levels
- grid-based beam simulation
- two-state rotatable lenses
- route and decoy lenses
- source-to-bulb objective
- local background music
- Web Audio API SFX
- static Vercel deployment

Controls:
- Tap/click a glass lens to rotate it 90 degrees.
- Reset restores the current level's authored starting state.
- Audio On / Audio Off controls music and SFX.
- Next Level advances after the bulb is successfully lit.

Beam rules:
- The beam advances one grid cell per simulation step.
- A lens redirects the incoming direction according to its current diagonal orientation.
- The level is solved when the beam enters the target cell.
- The simulation stops at the grid boundary or when a cell+direction state repeats.

Runtime files:
- index.html       HTML UI shell and canvas
- style.css        responsive interface styling
- main.js          WebGL renderer, 30 levels, beam engine, interaction, audio
- manifest.json    web-app metadata
- icon.svg         app/browser icon
- music/           local background-music asset
- package.json     static validation/start scripts
- vercel.json      deployment configuration

Local run:
  npm install
  npm run build
  npm start

Notes:
- npm run build validates required files; it does not bundle source.
- Rendering uses the browser WebGL API directly; no Three.js/Babylon rendering library is used.
- Google Fonts are loaded remotely.
- Music is unlocked after user interaction because of browser autoplay restrictions.
- Audio preference is stored locally; level progress is not persisted.
- The completion beam and crescendo SFX use the same 1450 ms solve clock.
