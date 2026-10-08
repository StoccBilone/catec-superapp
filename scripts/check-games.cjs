const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function load(source, dependencies = {}) {
  const filename = path.resolve(__dirname, '..', source);
  const loaded = new Module(filename, module);
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = name => dependencies[name] || originalRequire(name);
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
  return loaded.exports;
}
const engine = load('src/games/2048/engine.ts');
const { moveGame, canMove, hasWon, newGame, decodeSavedGame } = engine;
const make = rows => ({
  tiles: rows.flatMap((row, r) => row.flatMap((value, c) => value ? [{ id: r * 4 + c + 1, value, row: r, column: c }] : [])),
  score: 0, moves: 0, nextId: 17, acknowledgedWin: false,
});
const oldTiles = result => result.game.tiles.filter(tile => tile.id < 17).sort((a, b) => a.row - b.row || a.column - b.column);

const fresh = newGame(() => 0);
assert.equal(fresh.tiles.length, 2);
assert.equal(new Set(fresh.tiles.map(tile => `${tile.row}:${tile.column}`)).size, 2);
assert.deepEqual(fresh.tiles.map(tile => tile.value), [2, 2]);
assert.ok(newGame(() => 0.99).tiles.every(tile => tile.value === 4));

const four = make([[2, 2, 2, 2]]);
const copy = JSON.stringify(four);
let result = moveGame(four, 'left', () => 0);
assert.deepEqual(oldTiles(result).map(tile => tile.value), [4, 4]);
assert.equal(result.gained, 8);
assert.equal(result.game.score, 8);
assert.equal(result.game.moves, 1);
assert.equal(JSON.stringify(four), copy, 'moves do not mutate the previous state');
assert.equal(result.game.tiles.length, 3, 'a valid move adds exactly one tile');
assert.deepEqual(oldTiles(moveGame(make([[2, 2, 4, 0]]), 'left', () => 0)).map(tile => tile.value), [4, 4], 'newly merged tiles cannot merge again in the same move');
result = moveGame(make([[2, 2, 2, 0]]), 'right', () => 0);
assert.deepEqual(oldTiles(result).map(tile => [tile.value, tile.column]), [[2, 2], [4, 3]]);
result = moveGame(make([[2, 0, 0, 0], [0, 0, 0, 0], [2, 0, 0, 0], [4, 0, 0, 0]]), 'up', () => 0);
assert.deepEqual(oldTiles(result).map(tile => [tile.value, tile.row]), [[4, 0], [4, 1]]);
result = moveGame(make([[2, 0, 0, 0], [0, 0, 0, 0], [2, 0, 0, 0], [4, 0, 0, 0]]), 'down', () => 0);
assert.deepEqual(oldTiles(result).map(tile => [tile.value, tile.row]), [[4, 2], [4, 3]]);
let randomCalls = 0;
const blocked = make([[2, 4, 8, 16]]);
result = moveGame(blocked, 'left', () => { randomCalls++; return 0; });
assert.equal(result.changed, false);
assert.equal(result.game, blocked);
assert.equal(randomCalls, 0, 'a blocked swipe never spawns');

const dead = make([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]]);
assert.equal(canMove(dead), false, 'diagonal matches cannot move');
dead.tiles[1].value = 2;
assert.equal(canMove(dead), true);
assert.equal(hasWon(moveGame(make([[1024, 1024, 0, 0]]), 'left', () => 0).game), true);
assert.equal(hasWon(make([[4096, 2, 0, 0]])), true);

const saved = { version: 1, game: fresh, best: 8 };
assert.deepEqual(decodeSavedGame(JSON.stringify(saved)), saved);
assert.equal(decodeSavedGame('{'), null);
assert.equal(decodeSavedGame(JSON.stringify({ ...saved, version: 2 })), null);
assert.equal(decodeSavedGame(JSON.stringify({ ...saved, game: { ...fresh, tiles: [fresh.tiles[0], fresh.tiles[0]] } })), null);
assert.equal(decodeSavedGame(JSON.stringify({ ...saved, game: { ...fresh, tiles: [{ ...fresh.tiles[0], value: 3 }, fresh.tiles[1]] } })), null);
assert.equal(decodeSavedGame(JSON.stringify({ ...saved, best: -1 })), null);

let seed = 208;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
let game = newGame(random);
for (let i = 0; i < 1000; i++) {
  const direction = ['left', 'right', 'up', 'down'][Math.floor(random() * 4)];
  const before = game.tiles.reduce((sum, tile) => sum + tile.value, 0);
  result = moveGame(game, direction, random);
  game = result.game;
  const difference = game.tiles.reduce((sum, tile) => sum + tile.value, 0) - before;
  assert.ok(result.changed ? difference === 2 || difference === 4 : difference === 0, 'merges conserve tile values');
  assert.ok(decodeSavedGame(JSON.stringify({ version: 1, game, best: game.score })), 'all generated states can be restored');
  if (!canMove(game)) game = newGame(random);
}

async function checkStorage() {
  const values = new Map();
  let rejectNext = false;
  const fakeStorage = {
    getItem: async key => values.get(key) || null,
    setItem: async (key, value) => {
      // Different I/O delays would reorder saves without the per-profile queue.
      await new Promise(resolve => setTimeout(resolve, JSON.parse(value).game.moves === 1 ? 20 : 1));
      if (rejectNext) { rejectNext = false; throw new Error('Disk unavailable'); }
      values.set(key, value);
    },
  };
  const { save2048, load2048 } = load('src/games/2048/storage.ts', {
    '@react-native-async-storage/async-storage': { __esModule: true, default: fakeStorage }, './engine': engine,
  });
  const first = { ...saved, game: { ...fresh, moves: 1 } };
  const last = { ...saved, game: { ...fresh, moves: 2 } };
  const savingFirst = save2048('one', first);
  const savingLast = save2048('one', last);
  assert.equal((await load2048('one')).game.moves, 2, 'reopening waits for all pending writes');
  await Promise.all([savingFirst, savingLast]);
  await save2048('two', first);
  assert.equal((await load2048('one')).game.moves, 2, 'profile data is isolated');
  rejectNext = true;
  await assert.rejects(save2048('one', first));
  await save2048('one', last);
  assert.equal((await load2048('one')).game.moves, 2, 'a failed write does not poison later saves');
}
checkStorage().then(() => console.log('Games OK: 2048 rules, four directions, blocked moves, win/loss, 1000 state transitions, restore and ordered per-profile saves.')).catch(error => { console.error(error); process.exitCode = 1; });
