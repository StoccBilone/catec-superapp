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
const island = load('src/games/island/engine.ts');
const { targetForDevice, createArena, createIslandGame, stepIsland, movePaddle, BALL_RADIUS } = island;
assert.equal(targetForDevice(393, 59, 'iPhone15,2', 'iPhone 14 Pro', true).kind, 'island');
assert.equal(targetForDevice(390, 47, 'iPhone14,7', 'iPhone 14', true).kind, 'notch');
assert.equal(targetForDevice(390, 47, 'iPhone17,5', 'iPhone 16e', true).kind, 'notch');
assert.equal(targetForDevice(393, 59, null, null, false).kind, 'capsule');
assert.equal(targetForDevice(375, 20, null, 'iPhone SE', true).kind, 'capsule');
assert.equal(targetForDevice(402, 62, null, 'Unknown iPhone', true).kind, 'island');
const target = targetForDevice(393, 59, 'iPhone15,2', 'iPhone 14 Pro', true);
const arena = createArena(393, 852, 34, target);
const originalIsland = createIslandGame(arena);
assert.equal(movePaddle(originalIsland, arena, -999).paddleX, arena.paddleWidth / 2 + 12);
assert.equal(movePaddle(originalIsland, arena, 9999).paddleX, arena.width - arena.paddleWidth / 2 - 12);
let contactGame = { ...originalIsland, x: arena.width / 2, y: target.y + target.height + BALL_RADIUS + 1, vx: 0, vy: -340 };
let hit = stepIsland(contactGame, arena, 1 / 60);
assert.equal(hit.hit, true);
assert.equal(hit.game.score, 1);
assert.ok(hit.game.vy > 0);
assert.equal(contactGame.score, 0, 'physics does not mutate the previous frame');
assert.equal(stepIsland(hit.game, arena, 1 / 60).game.score, 1, 'one contact scores once');
const fromAbove = stepIsland({ ...contactGame, y: target.y - BALL_RADIUS - 1, vy: 340 }, arena, 1 / 60);
assert.equal(fromAbove.hit, true, 'the ball cannot pass through the target from above');
assert.ok(fromAbove.game.vy > 0 && fromAbove.game.y > target.y + target.height, 'the target returns the ball into the playable field');
const corner = stepIsland({ ...contactGame, x: target.x - 5, y: target.y + target.height + 5, vy: -1 }, arena, 1 / 120);
assert.equal(corner.hit, false, 'the pill corners use curved collision geometry');
let paddleBounce = stepIsland({ ...originalIsland, x: originalIsland.paddleX + arena.paddleWidth * 0.25, y: arena.paddleY - BALL_RADIUS - 1, vx: 0, vy: 600 }, arena, 1 / 30);
assert.equal(paddleBounce.paddleHit, true);
assert.ok(paddleBounce.game.vy < 0 && paddleBounce.game.vx > 0, 'offset on paddle controls the rebound angle');
assert.equal(paddleBounce.game.score, 0);
assert.equal(stepIsland({ ...originalIsland, x: 8, y: 300, vx: -340, vy: -200 }, arena, 1 / 60).game.vx > 0, true);
assert.equal(stepIsland({ ...originalIsland, x: 20, y: 8, vx: 0, vy: -340 }, arena, 1 / 60).game.vy > 0, true, 'missing the island bounces off the top without scoring');
assert.equal(stepIsland({ ...originalIsland, x: 20, y: arena.height + BALL_RADIUS, vy: 340 }, arena, 1 / 60).game.ended, true);
const ended = { ...originalIsland, ended: true };
assert.equal(stepIsland(ended, arena, 1).game, ended);
assert.equal(stepIsland(originalIsland, arena, NaN).game, originalIsland);
assert.ok(Math.abs(stepIsland({ ...originalIsland, y: 500 }, arena, 20).game.y - 500) < 20, 'a suspended app never fast-forwards through the arena');
const notchArena = createArena(390, 844, 34, targetForDevice(390, 47, 'iPhone14,7', 'iPhone 14', true));
assert.equal(stepIsland({ ...createIslandGame(notchArena), x: 195, y: 40, vx: 0, vy: -340 }, notchArena, 1 / 60).hit, true);
let rally = createIslandGame(arena);
for (let i = 0; i < 5000 && !rally.ended; i++) {
  const aim = Math.atan2(arena.width / 2 - rally.x, arena.paddleY - target.y - target.height);
  const paddleOffset = aim / (Math.PI * 0.34) * arena.paddleWidth / 2;
  rally = movePaddle(rally, arena, rally.x - paddleOffset);
  rally = stepIsland(rally, arena, 1 / 120).game;
  assert.ok(Number.isFinite(rally.x) && Number.isFinite(rally.y));
  assert.ok(rally.x >= BALL_RADIUS && rally.x <= arena.width - BALL_RADIUS);
}
assert.ok(rally.score >= 5, 'a long rally stays playable');
assert.equal(rally.ended, false);

async function checkIslandStorage() {
  const values = new Map();
  const fake = { getItem: async key => values.get(key) || null, setItem: async (key, value) => { await new Promise(resolve => setTimeout(resolve, value === '1' ? 15 : 1)); values.set(key, value); } };
  const storage = load('src/games/island/storage.ts', { '@react-native-async-storage/async-storage': { __esModule: true, default: fake } });
  const a = storage.saveIslandBest('one', 1);
  const b = storage.saveIslandBest('one', 9);
  assert.equal(await storage.loadIslandBest('one'), 9);
  await Promise.all([a, b]);
  assert.equal(await storage.loadIslandBest('two'), 0, 'island records are private to each profile');
}
Promise.all([checkStorage(), checkIslandStorage()]).then(() => console.log('Games OK: 2048 rules and saves; Island model selection, curved collisions, score, paddle angles, walls, loss, long rally and records.')).catch(error => { console.error(error); process.exitCode = 1; });
const mazeEngine = load('src/games/maze/engine.ts');
const { makeMaze, newMarble, stepMarble, MARBLE_RADIUS } = mazeEngine;
for (const [stage, seed] of [112, 208, 304, 416, 512].entries()) {
  const size = [11,11,13,13,15][stage];
  const maze = makeMaze(seed, size);
  assert.deepEqual(maze, makeMaze(seed, size), 'stages are deterministic');
  for (let n = 0; n < maze.size; n++) assert.ok(maze.cells[0][n] && maze.cells[maze.size-1][n] && maze.cells[n][0] && maze.cells[n][maze.size-1], 'outer walls stay closed');
  const visited = new Set(['1,1']), queue = [[1, 1]];
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i];
    for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx=x+dx, nz=z+dz, key=`${nx},${nz}`;
      if (maze.cells[nz]?.[nx] === 0 && !visited.has(key)) { visited.add(key); queue.push([nx,nz]); }
    }
  }
  assert.ok(visited.has(`${Math.floor(maze.goal.x)},${Math.floor(maze.goal.z)}`), 'every stage has a route to the goal');
  assert.equal(visited.size, maze.cells.flat().filter(n => n === 0).length, 'all corridors are connected');
  let ball = newMarble(maze);
  for (let i=0;i<5000;i++) {
    ball = stepMarble(ball, maze, {x:Math.sin(i/93),z:Math.cos(i/67)},1/60).marble;
    assert.ok(Number.isFinite(ball.x) && Number.isFinite(ball.z));
    assert.equal(maze.cells[Math.floor(ball.z)][Math.floor(ball.x)], 0, 'marble never tunnels into a wall');
    for (let z=0;z<maze.size;z++) for(let x=0;x<maze.size;x++) if(maze.cells[z][x]) {
      const dx=ball.x-Math.max(x,Math.min(x+1,ball.x)), dz=ball.z-Math.max(z,Math.min(z+1,ball.z));
      assert.ok(Math.hypot(dx,dz)>=MARBLE_RADIUS-1e-8, 'marble cannot overlap walls');
    }
  }
  const start=newMarble(maze), collision=stepMarble({...start,vx:-3},{...maze},{x:-1,z:0},0.05);
  assert.deepEqual(start,newMarble(maze), 'physics leaves previous frame intact');
  assert.ok(collision.marble.x>=1+MARBLE_RADIUS);
  const finish=stepMarble({...start,...maze.goal},maze,{x:0,z:0},1/60).marble;
  assert.equal(finish.won,true); assert.equal(finish.vx,0); assert.equal(finish.vz,0);
  assert.equal(stepMarble(finish,maze,{x:1,z:1},1).marble,finish,'a completed game freezes');
  assert.equal(stepMarble(start,maze,{x:1,z:0},NaN).marble,start);
  assert.ok(stepMarble(start,maze,{x:1,z:0},10).marble.elapsed<=0.051,'background time is clamped');
}
const { multiply } = load('src/games/maze/renderer.ts', { './engine': mazeEngine });
const identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const transform=[2,0,0,0,0,3,0,0,0,0,4,0,5,6,7,1];
assert.deepEqual(multiply(identity,transform),transform);
assert.deepEqual(multiply(transform,identity),transform);
async function checkMazeStorage() {
  const values=new Map();
  const fake={getItem:async key=>values.get(key)||null,setItem:async(key,value)=>{await new Promise(resolve=>setTimeout(resolve,JSON.parse(value).level===1?15:1));values.set(key,value);}};
  const storage=load('src/games/maze/storage.ts',{'@react-native-async-storage/async-storage':{__esModule:true,default:fake}});
  const first={level:1,best:[1234,null,null,null,null]}, last={...first,level:2};
  const a=storage.saveMazeProgress('one',first), b=storage.saveMazeProgress('one',last);
  assert.deepEqual(await storage.loadMazeProgress('one'),last); await Promise.all([a,b]);
  assert.deepEqual(await storage.loadMazeProgress('two'),storage.emptyProgress());
  values.set('@catec_maze_v2:one',JSON.stringify({...last,best:[-1]}));
  assert.deepEqual(await storage.loadMazeProgress('one'),storage.emptyProgress(),'malformed progress recovers');
}
checkMazeStorage().then(()=>console.log('Maze OK: five solvable stages, wall collisions, goal, timing, matrices and isolated ordered saves.')).catch(error=>{console.error(error);process.exitCode=1;});
const memory = load('src/games/memory/engine.ts');
for (const size of [4,6,8]) {
  let randomState=41; const random=()=>{randomState=(randomState*1664525+1013904223)>>>0;return randomState/4294967296;};
  const fresh=memory.newMemory(size,random);
  assert.equal(fresh.cards.length,size*size);assert.equal(new Set(fresh.cards.map(c=>c.id)).size,size*size);
  const groups=new Map();for(const c of fresh.cards){const pair=groups.get(c.symbol)||[];pair.push(c.id);groups.set(c.symbol,pair);}
  assert.equal(groups.size,size*size/2);assert.ok([...groups.values()].every(pair=>pair.length===2));
  let game=memory.revealCard(fresh,0);
  assert.equal(memory.revealCard(game,0),game,'double taps cannot reveal the same card twice');
  const other=fresh.cards.find(c=>c.symbol!==fresh.cards[0].symbol).id;
  game=memory.revealCard(game,other);assert.equal(game.moves,1);
  assert.equal(memory.revealCard(game,groups.get(fresh.cards[0].symbol)[1]),game,'a third card stays locked');
  game=memory.resolveCards(game);assert.equal(memory.pairCount(game),0);assert.equal(game.selected.length,0);
  game=fresh;
  for(const pair of groups.values()) {
    const before=game;game=memory.revealCard(game,pair[0]);game=memory.revealCard(game,pair[1]);game=memory.resolveCards(game);
    assert.equal(before.cards[pair[0]].matched,false,'matching never mutates previous state');
    assert.equal(memory.revealCard(game,pair[0]),game,'matched cards stay locked');
  }
  assert.equal(memory.memoryFinished(game),true);assert.equal(game.moves,size*size/2);assert.equal(memory.pairCount(game),size*size/2);
}
assert.throws(()=>memory.newMemory(5));
const layouts=new Set();for(let seed=0;seed<40;seed++){
  const maze=makeMaze(seed,13);layouts.add(JSON.stringify(maze.cells));
  const distances=new Map([['1,1',0]]),queue=[[1,1]];
  for(let i=0;i<queue.length;i++){const [x,z]=queue[i];for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,key=`${nx},${nz}`;if(maze.cells[nz]?.[nx]===0&&!distances.has(key)){distances.set(key,distances.get(`${x},${z}`)+1);queue.push([nx,nz]);}}}
  assert.equal(distances.get(`${Math.floor(maze.goal.x)},${Math.floor(maze.goal.z)}`),Math.max(...distances.values()),'random exit is the farthest reachable point');
  assert.ok(Math.max(...distances.values())>=30,'larger mazes cannot end after a few steps');
}
assert.ok(layouts.size>=35,'random seeds produce diverse layouts');
const open=makeMaze(1,21);open.cells=open.cells.map((row,z)=>row.map((_,x)=>x===0||z===0||x===20||z===20?1:0));
let fast=newMarble(open);for(let n=0;n<120;n++)fast=stepMarble(fast,open,{x:1,z:0},1/120).marble;
assert.ok(fast.vx>5,'marble responds faster to sustained input');
async function checkMemoryStorage(){
 const values=new Map();let fail=false;const fake={getItem:async k=>values.get(k)||null,setItem:async(k,v)=>{await new Promise(r=>setTimeout(r,JSON.parse(v)[4]===20?15:1));if(fail){fail=false;throw Error('Disk unavailable');}values.set(k,v);}};
 const s=load('src/games/memory/storage.ts',{'@react-native-async-storage/async-storage':{__esModule:true,default:fake},'./engine':memory});
 const a=s.saveMemoryRecords('one',{4:20,6:null,8:null}),b=s.saveMemoryRecords('one',{4:12,6:30,8:60});
 assert.deepEqual(await s.loadMemoryRecords('one'),{4:12,6:30,8:60});await Promise.all([a,b]);assert.deepEqual(await s.loadMemoryRecords('two'),s.emptyRecords());
 fail=true;await assert.rejects(s.saveMemoryRecords('one',{4:8,6:null,8:null}));await s.saveMemoryRecords('one',{4:10,6:null,8:null});assert.equal((await s.loadMemoryRecords('one'))[4],10);
 values.set('@catec_memory_v1:one','{"4":1,"6":null,"8":null}');assert.deepEqual(await s.loadMemoryRecords('one'),s.emptyRecords());
}
checkMemoryStorage().then(()=>console.log('Memory OK: all three difficulties, shuffled pairs, tap locking, matching, win and ordered isolated records. Random maze diversity, farthest exits and faster physics OK.')).catch(e=>{console.error(e);process.exitCode=1;});
