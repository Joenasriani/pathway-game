# Pathway — Beam Crescendo Up Fix

## User issue
The beam animation SFX was perceived as going downward during the solve animation.

## Fix
- Rebuilt `playVictoryBeamSfx()` so the beam sound rises in volume, pitch, filter brightness, and air/noise intensity until the travelling beam reaches the bulb.
- Removed the perceived downward contour during the beam animation.
- Delayed the laser-blade hum until after the beam travel crescendo finishes, so it cannot mask the upward beam rise.
- Adjusted the laser-blade hum itself to rise instead of falling.

## Preserved
- Beam animation still draws below the battery/source.
- Battery/source remains visually above the beam.
- Bulb remains on top when solved.
- Level data unchanged.
- Layout and safe-view scaling unchanged.
- Music unchanged.
