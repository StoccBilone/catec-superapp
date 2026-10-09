const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');
const filename=path.resolve('src/games/blocks/engine.ts');
const source=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const mod=new Module(filename);mod._compile(source,filename);
const {SHAPES,newBlocks,fits,place,canPlay,decodeBlocks}=mod.exports;
const interactionFilename=path.resolve('src/games/blocks/interaction.ts');
const interactionModule=new Module(interactionFilename);
interactionModule.require=name=>name==='./engine'?mod.exports:require(name);
interactionModule._compile(ts.transpileModule(fs.readFileSync(interactionFilename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,interactionFilename);
const {pieceSize,pieceLift,dropTarget}=interactionModule.exports;
for(let shape=0;shape<SHAPES.length;shape++){
  for(const cell of [28,45,52.5]){
    const {rows,columns}=pieceSize(shape),origin={x:16,y:210};
    const lift=pieceLift(shape,cell);
    assert.ok(lift-rows*cell/2>=26,'held piece must remain above the finger');
    assert.deepEqual(dropTarget(shape,cell,origin,{x:origin.x+(2+columns/2)*cell,y:origin.y+(3+rows/2)*cell+lift}),{row:3,col:2},'preview and full-size ghost must share one anchor');
    assert.ok(dropTarget(shape,cell,origin,{x:-1000,y:-1000}).row<0);
  }
}
const rng=()=>0;
const initial=newBlocks(90,rng);
assert.equal(initial.board.length,64);
assert.deepEqual(initial.pieces,[0,0,0]);
assert.equal(fits(initial.board,3,0,6),false);
assert.equal(fits(initial.board,0,-1,0),false);
assert.equal(fits(initial.board,0,NaN,0),false);
const before=JSON.stringify(initial);
const first=place(initial,0,0,0,rng);
assert.equal(first.game.score,1);assert.equal(first.game.best,90);
assert.equal(first.game.pieces[0],null);assert.equal(JSON.stringify(initial),before);
assert.equal(place(first.game,1,0,0),null);
assert.equal(place(initial,9,0,0),null);
let cross=newBlocks(0,rng);
for(let i=1;i<8;i++){cross.board[i]=1;cross.board[i*8]=1;}
const cleared=place(cross,0,0,0,rng);
assert.equal(cleared.lines,2);assert.equal(cleared.cleared.length,15);
assert.equal(cleared.game.board.filter(Boolean).length,0);assert.equal(cleared.game.score,31);
let refill=newBlocks(0,rng);
for(let i=0;i<3;i++)refill=place(refill,i,2,i,rng).game;
assert.deepEqual(refill.pieces,[0,0,0]);assert.equal(refill.moves,3);
assert.deepEqual(decodeBlocks(JSON.stringify(refill)),refill);
assert.throws(()=>decodeBlocks('{'));assert.throws(()=>decodeBlocks(JSON.stringify({...refill,pieces:[99,null,null]})));
assert.throws(()=>decodeBlocks(JSON.stringify({...refill,best:-1})));
assert.throws(()=>decodeBlocks(JSON.stringify({...refill,pieces:[null,null,null]})));
let blocked=newBlocks();blocked.board.fill(1);blocked.pieces=[7,7,7];assert.equal(canPlay(blocked),false);
blocked.board[0]=0;assert.equal(canPlay(blocked),false);blocked.pieces=[0,null,null];assert.equal(canPlay(blocked),true);
for(let shape=0;shape<SHAPES.length;shape++)assert.equal(fits(Array(64).fill(0),shape,0,0),true);
for(let round=0;round<25;round++){
  let game=newBlocks();
  for(let turn=0;turn<150&&canPlay(game);turn++){
    let move=null;
    for(let slot=0;slot<3&&!move;slot++)for(let i=0;i<64&&!move;i++)move=place(game,slot,Math.floor(i/8),i%8);
    assert.ok(move);game=move.game;assert.ok(game.best>=game.score);assert.ok(game.board.every(v=>v===0||v===1));
  }
}
console.log('Block Blast OK: placement, edges, collision, simultaneous row/column clears, scoring, refill, loss, save validation and 25 simulated rounds.');
async function checkStorage() {
  const data=new Map(); let failing=true;
  const store={getItem:async key=>data.get(key)||null,setItem:async (key,raw)=>{await new Promise(resolve=>setTimeout(resolve,3)); if(failing)throw Error('Disk full');data.set(key,raw);}};
  const storageFilename=path.resolve('src/games/blocks/storage.ts');
  const storageModule=new Module(storageFilename);
  storageModule.require=name=>name==='./engine'?mod.exports:name==='@react-native-async-storage/async-storage'?store:require(name);
  storageModule._compile(ts.transpileModule(fs.readFileSync(storageFilename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,storageFilename);
  const {saveBlocks,loadBlocks}=storageModule.exports;
  await assert.rejects(saveBlocks('a',initial));failing=false;
  const firstSave=saveBlocks('a',first.game),lastSave=saveBlocks('a',refill),otherSave=saveBlocks('b',initial);
  assert.deepEqual(await loadBlocks('a'),refill);
  await Promise.all([firstSave,lastSave,otherSave]);assert.deepEqual(await loadBlocks('b'),initial);
  console.log('Block Blast storage OK: failed writes recover, saves keep order, immediate reopen waits and records remain isolated by profile.');
}
checkStorage().catch(error=>{console.error(error);process.exitCode=1;});
