# Pathway — Final Safe View Layout Fix

## Issue fixed
Desktop and landscape layouts could place the playground too low or crop large late-game boards because board position was based on fixed viewport percentages instead of the actual space left between the HUD and the bottom controls.

## Changes
- Replaced percentage-based board placement with a safe-frame layout calculator.
- The board now centers inside the usable gameplay rectangle between the top HUD and bottom controls.
- Scale now fits the complete playground inside the available viewport instead of enforcing a minimum size that can crop the board.
- Landscape HUD was compressed into a compact top pill to give the board more vertical room.
- Very short landscape screens hide secondary HUD text to protect gameplay visibility.
- Desktop and landscape HUD/button centering now uses CSS `translate` instead of relying on `transform`, avoiding animation-based centering drift.

## Preserved
- 30 rebuilt levels
- solver-verified intended solutions
- music/SFX changes
- single start screen
- removed loading/start-preview artifacts
- Vercel static structure

## Verification
- JavaScript syntax passed.
- `npm run build` passed.
- JSON files valid.
- CSS brace balance passed.
- ZIP integrity passed.
