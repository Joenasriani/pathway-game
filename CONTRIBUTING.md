# Contributing to Pathway

Pathway is a browser-based WebGL reflection puzzle game. The goal is to improve the playable game without losing its original artwork, controls, sound, visual style, or 30 authored levels.

## Start here
1. Play the current build: https://pathway-game.vercel.app/
2. Read README.md for the game structure, lens states, and beam simulation.
3. Clone the repository and serve its static files locally (for example `npx serve .`).
4. Before proposing a change, run `npm test` and `npm run build`. These are source-level checks, **not** substitutes for browser gameplay testing.
5. For a code change, play the affected levels with mouse and touch controls, and note which devices/browsers were actually tested.

## Useful contributions
- Reproducible rendering, input, audio, and progression bug fixes
- Puzzle validation, regression tests, and level-editor prototypes
- Optional new levels without rewriting the existing authored levels
- Accessibility and responsive touch improvements
- Performance improvements supported by measurements
- Android and iOS feasibility investigations and device test reports

For mobile-specific work, see MOBILE_ROADMAP.md. Native packaging is **not yet implemented or approved** in this repo.

## Pull requests
Keep each change focused. Explain the problem, the code changed, test commands and results, and visual/gameplay evidence when appropriate. Do not claim a device was tested unless it was. Do not modify existing puzzle solutions, music, fonts, or visual identity incidentally.

## Assets and licenses
The source repository is public but has no verified repository-wide open-source license yet. **Public access is not a grant of permission to reuse or redistribute the code or assets.** Before accepting contributed code, agree on the licensing terms with the maintainer.

The soundtrack `music/rotating-puzzle-room.mp3` has unverified origin and permissions. Do not reuse, sublicense, replace, or redistribute it independently. The font and other asset rights also require confirmation. See ASSET_RIGHTS.md.

Use GitHub issues to propose work or report bugs. Do not submit copyrighted third-party material without documented rights.
