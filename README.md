# Pathway

**Historical name:** Rootlight  
**Status:** original 30-level WebGL light-reflection puzzle  
**Play:** https://pathway-game.vercel.app/  
**itch.io:** https://joenasr.itch.io/pathway  
**Creator:** Joe Nasr  
**Creator identity:** https://joe-nasr-signals.vercel.app/v2/

Pathway is a 30-level browser puzzle built around one spatial mechanic: rotating glass elements changes the route of a light beam. Each level asks the player to read the scene, change lens angles and construct a valid optical path until the target is illuminated.

Pathway and Rootlight refer to the same game lineage.

## Game

- Genre: puzzle / logic
- Platform: web browser
- Rendering: WebGL
- Levels: 30
- Input: mouse and touch
- Status: playable browser build

## Source structure

- `index.html`: game shell and search metadata
- `style.css`: responsive interface and visual system
- `main.js`: renderer, level logic, audio, effects and progression
- `manifest.json`: web app metadata
- `icon.svg`: browser/app icon
- `music/rotating-puzzle-room.mp3`: background music

## Run locally

```bash
npm run build
npm start
```

Music begins after player interaction because browser autoplay policies prevent automatic audio playback before input.

Existing branches and historical files are retained as development history.
