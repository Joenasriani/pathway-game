// Guard the session music playlist against missing files and accidental regressions.
// Run with npm test. Does not claim real-device audio compatibility.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync('main.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const list = script.match(/const musicTracks\s*=\s*\[([\s\S]*?)\]/);
assert(list, 'Missing session music track list');
const names = [...list[1].matchAll(/['"]([^'"]+\.(?:mp3|m4a))['"]/gi)].map(m => m[1]);
assert(names.length >= 2, 'Expected multiple versions of the soundtrack');
assert.equal(new Set(names).size, names.length, 'Duplicate soundtrack references');
for (const name of names) {
  assert(name.startsWith('music/'), 'Unexpected audio path: ' + name);
  assert(fs.existsSync(path.join(process.cwd(), name)), 'Missing audio file: ' + name);
  assert(fs.statSync(name).size > 1000, 'Audio file unexpectedly small: ' + name);
}
assert(script.includes('selectSessionMusic();\n    startMusic({ restart: true });'),
  'New game must choose music before starting playback');
assert(html.includes('id="bgMusic"'), 'Background audio element missing');
console.log('PASS: all ' + names.length + ' music assets exist and random selection is hooked to game start.');
