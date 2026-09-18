# Pathway

Static WebGL light-reflection puzzle built around rotating glass lenses to route a beam from a source cell to a target bulb.

## Links

- Play: https://joenasr.itch.io/pathway
- Deployment: https://pathway-game.vercel.app/

## Repository scope

Pathway is a client-side browser game with no application framework and no rendering library dependency. The game engine uses the browser's WebGL API directly.

```text
.
├── index.html
├── style.css
├── main.js
├── manifest.json
├── icon.svg
├── music/
│   └── rotating-puzzle-room.mp3
├── fonts/
├── package.json
├── vercel.json
├── README.md
├── README.txt
└── *_REPORT.md
```

`main.js` contains the renderer, shaders, level definitions, beam simulation, lens interaction, animation state, audio synthesis, progression logic, and victory effects.

## Runtime architecture

| Area | Implementation |
| --- | --- |
| Rendering | Raw WebGL 1 context |
| Game loop | `requestAnimationFrame` |
| Level count | 30 |
| Puzzle data | Embedded JavaScript objects in `main.js` |
| Input | Pointer events on the canvas |
| Music | Local MP3 asset |
| SFX | Web Audio API synthesis |
| UI | HTML + CSS overlay around the WebGL canvas |
| Persistence | `localStorage` for audio preference only |
| Deployment | Static files / Vercel |

## Puzzle model

Each level defines:

- a square grid size;
- one source cell with an initial beam direction;
- one target/bulb cell;
- a collection of rotatable glass lenses;
- an initial orientation for each lens;
- the intended solved orientation;
- optional lens roles such as route lenses and decoys;
- title, objective, and visual theme.

The current build contains **30 authored level definitions**.

Late levels increase route length, lens count, and decoy density rather than changing the core optical rule set.

## Lens states

Every lens uses one of two diagonal orientations.

Rotating a lens performs a 90° visual turn and toggles its logical reflection state after the rotation animation completes.

The reflection mapping is:

```text
orientation 0:
right -> up
up    -> right
left  -> down
down  -> left

orientation 1:
right -> down
down  -> right
left  -> up
up    -> left
```

Lens interaction is disabled while the selected lens is already animating and after a level has been solved.

## Beam simulation

`recalculateBeam()` evaluates the optical route after lens state changes.

The algorithm:

1. starts at the level source cell and source direction;
2. advances one grid cell at a time;
3. records each travelled segment;
4. checks whether the next cell is the target;
5. changes direction when the beam enters a lens cell;
6. terminates when the beam reaches the target, exits the grid, or repeats an already visited `cell + direction` state.

The repeated-state check prevents infinite loops in cyclic mirror configurations.

The traversal guard is also bounded by `grid × grid × 3` iterations.

A level is solved only when the simulated beam enters the target cell.

## Level progression

The 30 current level titles are:

```text
01  First Reflection
02  Corner Bloom
03  Moon Turn
04  Glass Stair
05  Quiet Loop
06  Soft Return
07  Botanical Fork
08  Long Crescent
09  Ink Circuit
10  Full Pathway
11  Prism Wake
12  Petal Relay
13  Pearl Descent
14  Sky Filament
15  Blush Detour
16  Quiet Cascade
17  Orchid Return
18  Glass Tide
19  Velvet Gate
20  Final Resonance
21  Crystal Fold
22  Moon Lattice
23  Opal Spiral
24  Aurora Weave
25  Glass Constellation
26  Prism Labyrinth
27  Lunar Relay
28  Opal Switchback
29  Velvet Keyhole
30  Solar Crown
```

Levels 19–30 contain the densest route structures and larger decoy sets. The current data includes explicit decoy lens roles to create plausible but non-solution reflections.

Completing a level exposes the next-level control. On Level 30, the control reloads Level 30 rather than advancing beyond the authored set.

## Controls

- Click or tap a glass lens to rotate it.
- Use **Reset** to restore the current level's initial lens orientations.
- Use **Audio On / Audio Off** to control both background music and synthesized SFX.
- Use **Next Level** after a successful beam route.

Pointer interaction is evaluated against the projected screen-space radius of each lens.

## Rendering

The renderer writes custom vertex data into a streaming WebGL buffer and draws the board from geometric primitives generated in JavaScript.

The visual system includes:

- board/grid geometry;
- glass lens discs, edge rings, and highlights;
- source/battery visualization;
- target/bulb visualization;
- multi-layer beam lines;
- tap feedback;
- level themes;
- victory particles and completion animation.

Lens glass is constructed from layered circles, rings, highlights, and diagonal mirror lines rather than image assets.

Each of the 30 levels has its own theme definition, including beam, glass, target, glow, panel, and metadata colors.

## Solve animation

When the target is reached, the game switches from the normal beam representation to a travelling victory beam.

The completion beam:

- follows the already computed beam segments;
- advances according to total path length;
- uses outer, middle, and core beam layers;
- terminates exactly at the target;
- lights the bulb only at the end of travel.

The current victory travel duration is **1450 ms**.

The victory beam uses a linear travel clock so its visual endpoint and audio crescendo finish at the same time.

Rendering order keeps the source/battery above the travelling beam and preserves the solved bulb above the completed beam layers.

## Audio

Background music is loaded from:

```text
music/rotating-puzzle-room.mp3
```

Browser autoplay restrictions are handled by starting/unlocking audio after user interaction.

Sound effects are synthesized with the Web Audio API and include separate responses for:

- lens rotation;
- reset;
- level reveal;
- beam miss;
- solve-beam crescendo;
- bulb activation;
- level clear;
- level advance.

The solve-beam SFX is synchronized to the visual completion duration and rises in gain, pitch, filtering, and high-frequency/noise content until the beam reaches the bulb.

Audio preference is stored in `localStorage` under `pathwayAudioEnabled`, with backward compatibility for the older `pathwaySfxEnabled` key.

## Web application files

`manifest.json` defines Pathway as a fullscreen web application.

`index.html` contains the semantic UI shell, canvas, start screen, HUD, controls, result overlay, metadata, and background-music element.

`style.css` contains responsive layout and glass-interface styling.

Google Fonts are currently loaded remotely by `index.html`; rendering itself does not depend on an external JavaScript library.

## Local development

Install the small static-serving dependency through the existing npm workflow:

```bash
npm install
npm run build
npm start
```

`npm run build` does not bundle or transform source code. It verifies that the required static runtime files exist.

The start script runs:

```text
npx serve .
```

## Vercel deployment

The repository includes `vercel.json` with:

- `npm run build` as the build command;
- `.` as the output directory;
- clean URLs;
- immutable caching for music assets;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `/play` rewritten to `/index.html`.

No server-side runtime is required.

## Technical characteristics

- The game is fully client-side.
- The WebGL engine is implemented directly in JavaScript.
- Level data is embedded in `main.js` rather than external JSON.
- The source and target model is grid-based even though rendering is continuous screen-space geometry.
- Lens state is binary and deterministic.
- Reset recreates the current level from authored initial orientation data.
- There is no player-account or cloud-save system.
- Game progression itself is not persisted across reloads.
- Background music is a local repository asset.
- Fonts are partially remote.

## Historical reports

The repository contains implementation reports for specific past fixes, including:

- beam/audio synchronization;
- completion crescendo contour;
- beam/source draw ordering;
- late-level rebuilds;
- layout corrections.

These files are historical engineering records. The current runtime in `main.js` is the authoritative implementation.

## Verification boundary

The repository verifies a 30-level deterministic reflection engine, direct WebGL rendering, lens interaction, beam-loop protection, reset/progression behavior, synchronized completion effects, and static deployment configuration.

It does not by itself establish exhaustive accessibility, cross-browser, performance, or device certification.
