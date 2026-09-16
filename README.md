# Pathway

Pathway is a 30-level WebGL light-reflection puzzle. Rotate glass lenses, redirect the beam and align each optical path until the bulb is illuminated.

**Play:** https://pathway-game.vercel.app/  
**itch.io:** https://joenasr.itch.io/pathway  
**Creator:** Joe Nasr  
**Canonical creator identity:** https://joe-nasr-signals.vercel.app/v2/

## Game

Pathway is built around a single spatial mechanic: changing the angle of glass elements changes the beam route. Each level asks the player to read the scene, rotate the available lenses and construct a valid light path.

- Genre: puzzle / logic
- Platform: web browser
- Rendering: WebGL
- Levels: 30
- Input: mouse and touch
- Status: playable browser build

## Source structure

- `index.html`: game shell and search metadata
- `style.css`: responsive interface and visual system
- `main.js`: WebGL renderer, level logic, audio, effects and progression
- `manifest.json`: web app metadata
- `icon.svg`: browser/app icon
- `music/rotating-puzzle-room.mp3`: background music

## Run locally

```bash
npm run build
npm start
```

Music begins after player interaction because browser autoplay policies prevent automatic audio playback before input.
