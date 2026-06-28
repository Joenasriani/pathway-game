# Pathway — Beam Layer Fix

## Request
Keep the beam animation below the battery/source.

## Change
Adjusted the WebGL draw order so all beam layers render before the battery/source:

- static beam path
- crescendo travelling beam
- victory beam/particles
- battery/source drawn after those layers
- solved bulb remains on top after solve

## Files changed
- `main.js`

## Gameplay impact
- No level data changed.
- No UI layout changed.
- No music/SFX timing changed.
- Only visual stacking order changed.

## Verification
- JavaScript syntax passed.
- `npm run build` passed.
- JSON files valid.
- CSS brace check passed.
