// Source-level regression tests for Pathway's authored reflection puzzles.
// No WebGL or third-party packages required. Run: npm test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('main.js', 'utf8');
const start = source.indexOf('const levels = [');
assert(start >= 0, 'Cannot find authored level definitions');
const open = source.indexOf('[', start);
let depth = 0, end = -1, quote = null;
for (let i = open; i < source.length; i++) {
  const c = source[i];
  if (quote) {
    if (c === '\\') { i++; continue; }
    if (c === quote) quote = null;
    continue;
  }
  if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
  if (c === '[') depth++;
  if (c === ']' && --depth === 0) { end = i; break; }
}
assert(end > open, 'Unterminated level definitions');
const levels = vm.runInNewContext('(' + source.slice(open, end + 1) + ')', Object.create(null), { timeout: 1000 });

const directions = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] };
const reflections = [
  { right: 'up', up: 'right', left: 'down', down: 'left' },
  { right: 'down', down: 'right', left: 'up', up: 'left' }
];
function trace(level, orientationKey) {
  const mirrors = new Map(level.mirrors.map(m => [m.col + ',' + m.row, m[orientationKey]]));
  let { col, row, dir } = level.source;
  const seen = new Set();
  for (let step = 0; step <= level.grid * level.grid * 4; step++) {
    const key = col + ',' + row + ',' + dir;
    if (seen.has(key)) return false;
    seen.add(key);
    const [dc, dr] = directions[dir];
    col += dc; row += dr;
    if (col < 0 || row < 0 || col >= level.grid || row >= level.grid) return false;
    if (col === level.target.col && row === level.target.row) return true;
    const orientation = mirrors.get(col + ',' + row);
    if (orientation !== undefined) dir = reflections[orientation][dir];
  }
  return false;
}
assert.equal(levels.length, 30, 'Expected 30 authored levels');
for (const [i, level] of levels.entries()) {
  const tag = 'Level ' + (i + 1);
  assert.equal(level.id, i + 1, tag + ': incorrect ID/order');
  assert(Number.isInteger(level.grid) && level.grid > 1, tag + ': invalid grid');
  assert(directions[level.source.dir], tag + ': invalid source direction');
  const inside = p => Number.isInteger(p.col) && Number.isInteger(p.row) &&
    p.col >= 0 && p.row >= 0 && p.col < level.grid && p.row < level.grid;
  assert(inside(level.source) && inside(level.target), tag + ': source/target out of bounds');
  assert(!(level.source.col === level.target.col && level.source.row === level.target.row),
    tag + ': source overlaps target');
  const positions = new Set();
  for (const mirror of level.mirrors) {
    assert(inside(mirror), tag + ': mirror out of bounds');
    const key = mirror.col + ',' + mirror.row;
    assert(!positions.has(key), tag + ': overlapping mirrors');
    assert(key !== level.source.col + ',' + level.source.row, tag + ': mirror on source');
    assert(key !== level.target.col + ',' + level.target.row, tag + ': mirror on target');
    positions.add(key);
    assert([0, 1].includes(mirror.orientation) && [0, 1].includes(mirror.solution),
      tag + ': invalid mirror orientation');
  }
  assert(trace(level, 'solution'), tag + ': declared solution misses target');
  assert(!trace(level, 'orientation'), tag + ': starts already solved');
}
console.log('PASS: all 30 level definitions have valid geometry and unsolved starts; declared solutions reach the target.');
