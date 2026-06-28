# Pathway — Beam Audio Sync Fix

## Issue
The beam crescendo sound was not landing with the visible beam animation.

## Root cause
The visual beam used an eased travel curve and the bulb/lamp SFX could trigger early when the beam head entered the bulb radius. The crescendo kept rising toward the full animation duration, so the sound and visual hit did not feel locked.

## Fix
- Changed the solve beam travel to a linear synced travel clock.
- Matched the crescendo envelope duration exactly to `state.victoryDuration`.
- Moved the crescendo peak to the exact beam-arrival time.
- Removed the early proximity-triggered lamp SFX.
- Bulb/lamp SFX now fires only when the beam travel completes.
- Kept the laser-blade hum delayed until after the beam crescendo.
- Preserved beam draw order below the battery/source.

## Preserved
- All 30 levels unchanged.
- Layout unchanged.
- Music unchanged.
- UI unchanged.
- Vercel structure unchanged.
