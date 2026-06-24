# Pathway — Vercel Ready Build

Static WebGL laser puzzle game.

## Included

- `index.html` — app shell
- `style.css` — responsive UI, no-old-bar glass reflection loader, glass styling
- `main.js` — WebGL renderer, 30 levels, audio, SFX, victory effects
- `manifest.json` — web app metadata
- `icon.svg` — browser/app icon
- `music/rotating-puzzle-room.mp3` — background music
- `vercel.json` — Vercel configuration
- `package.json` — build metadata and local start script

## Vercel settings

Use these if Vercel asks:

- Framework Preset: `Other`
- Build Command: `npm run build`
- Output Directory: `.`
- Install Command: default

## Deploy through Vercel dashboard

1. Upload these files to a GitHub repository.
2. Open Vercel and choose **Add New Project**.
3. Import the repository.
4. Use the settings above.
5. Deploy.

## Deploy through Vercel CLI

```bash
npm install -g vercel
vercel
vercel --prod
```

## Local test

```bash
npm run build
npm start
```

Then open the local URL printed by `serve`.

## Audio note

Music starts after the player clicks **Set the Beam**. This is intentional because browsers block autoplay audio until user interaction.
