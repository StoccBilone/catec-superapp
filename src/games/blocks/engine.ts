export const SIDE = 8;
export const SHAPES = [
  [[0,0]], [[0,0],[0,1]], [[0,0],[1,0]],
  [[0,0],[0,1],[0,2]], [[0,0],[1,0],[2,0]],
  [[0,0],[0,1],[0,2],[0,3]], [[0,0],[1,0],[2,0],[3,0]],
  [[0,0],[0,1],[1,0],[1,1]],
  [[0,0],[1,0],[2,0],[2,1]], [[0,1],[1,1],[2,0],[2,1]],
  [[0,0],[0,1],[1,0]], [[0,0],[0,1],[1,1]],
  [[0,0],[0,1],[0,2],[1,1]], [[0,1],[1,0],[1,1],[1,2]],
  [[0,0],[0,1],[1,1],[1,2]], [[0,1],[0,2],[1,0],[1,1]],
  [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]],
  [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]],
  [[0,0],[0,1],[0,2],[0,3],[0,4]], [[0,0],[1,0],[2,0],[3,0],[4,0]],
  [[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]],
  [[0,0],[1,0],[1,1]], [[0,1],[1,0],[1,1]],
  [[0,0],[1,0],[2,0],[0,1]], [[0,0],[0,1],[1,1],[2,1]],
  [[0,0],[0,1],[0,2],[1,0]], [[0,0],[0,1],[0,2],[1,2]],
  [[0,0],[1,0],[1,1],[1,2]], [[0,2],[1,0],[1,1],[1,2]],
  [[0,0],[1,0],[1,1],[2,0]], [[0,1],[1,0],[1,1],[2,1]],
  [[0,0],[1,0],[1,1],[2,1]], [[0,1],[1,0],[1,1],[2,0]],
] as const;
export interface BlocksGame { board: number[]; pieces: (number | null)[]; score: number; best: number; moves: number; combo: number; comboMisses: number; totalLines: number; }
export function tray(random = Math.random): number[] { return Array.from({length:3}, () => Math.min(SHAPES.length - 1, Math.max(0, Math.floor(random() * SHAPES.length)))); }
export function newBlocks(best = 0, random = Math.random): BlocksGame { return {board:Array(64).fill(0), pieces:tray(random), score:0, best, moves:0, combo:0, comboMisses:0, totalLines:0}; }
export function fits(board: number[], shape: number, row: number, col: number): boolean {
  return Number.isInteger(row) && Number.isInteger(col) && !!SHAPES[shape] && SHAPES[shape].every(([r,c]) => row+r >= 0 && col+c >= 0 && row+r < SIDE && col+c < SIDE && board[(row+r)*SIDE+col+c] === 0);
}
export function canPlay(game: BlocksGame): boolean { return game.pieces.some(shape => shape !== null && game.board.some((_cell,i) => fits(game.board,shape,Math.floor(i/SIDE),i%SIDE))); }
export function previewPlacement(previous: number[], shape: number, row: number, col: number) {
  if (!fits(previous,shape,row,col)) return null;
  const board = [...previous];
  SHAPES[shape].forEach(([r,c]) => { board[(row+r)*SIDE+col+c] = 1; });
  const rows = Array.from({length:SIDE},(_,r)=>r).filter(r => board.slice(r*SIDE,r*SIDE+SIDE).every(Boolean));
  const cols = Array.from({length:SIDE},(_,c)=>c).filter(c => Array.from({length:SIDE},(_,r)=>board[r*SIDE+c]).every(Boolean));
  const cleared = board.flatMap((_v,i) => rows.includes(Math.floor(i/SIDE)) || cols.includes(i%SIDE) ? [i] : []);
  cleared.forEach(i => {board[i]=0;});
  return {board,cleared,lines:rows.length+cols.length};
}
export function legalPlaces(board:number[],shape:number) {
  return board.flatMap((_v,i)=>fits(board,shape,Math.floor(i/SIDE),i%SIDE)?[i]:[]);
}
// Construct a playable sequence on a temporary board, then shuffle its order.
// Choosing different placements can still block later pieces: this is help, not autoplay.
export function dealPieces(previous:number[], random=Math.random): number[] {
  let board=[...previous];const pieces:number[]=[];
  for(let slot=0;slot<3;slot++){
    const eligible=SHAPES.flatMap((_shape,id)=>{const positions=legalPlaces(board,id);return positions.length?[{id,positions}]:[];});
    if(!eligible.length)return tray(random);
    const choice=eligible[Math.min(eligible.length-1,Math.max(0,Math.floor(random()*eligible.length)))];
    pieces.push(choice.id);
    const index=choice.positions[Math.min(choice.positions.length-1,Math.max(0,Math.floor(random()*choice.positions.length)))];
    board=previewPlacement(board,choice.id,Math.floor(index/SIDE),index%SIDE)!.board;
  }
  for(let i=pieces.length-1;i>0;i--){const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));[pieces[i],pieces[j]]=[pieces[j],pieces[i]];}
  return pieces;
}
export function place(game: BlocksGame, slot: number, row: number, col: number, random = Math.random): {game:BlocksGame; cleared:number[]; lines:number; gained:number} | null {
  const shape = game.pieces[slot];
  if(shape==null)return null;
  const result=previewPlacement(game.board,shape,row,col);
  if(!result)return null;
  const {board,cleared,lines}=result;
  const pieces = [...game.pieces]; pieces[slot] = null;
  const misses=lines?0:(game.comboMisses||0)+1;
  const combo=lines?(game.combo||0)+1:misses>=3?0:(game.combo||0);
  const gained=SHAPES[shape].length+lines*10*Math.max(1,combo)+Math.max(0,lines-1)*10;
  const score=game.score+gained;
  return {game:{board,pieces:pieces.every(p=>p===null)?dealPieces(board,random):pieces,score,best:Math.max(game.best,score),moves:game.moves+1,combo,comboMisses:combo?misses:0,totalLines:(game.totalLines||0)+lines},cleared,lines,gained};
}
export function decodeBlocks(raw: string | null): BlocksGame {
  if (!raw) return newBlocks();
  const g = JSON.parse(raw);
  if (!g || !Array.isArray(g.board) || g.board.length!==64 || g.board.some((v:unknown)=>v!==0&&v!==1) || !Array.isArray(g.pieces) || g.pieces.length!==3 || g.pieces.every((p:unknown)=>p===null) || g.pieces.some((p:unknown)=>p!==null && (typeof p!=='number'||!Number.isInteger(p)||!SHAPES[p])) || ['score','best','moves'].some(k=>!Number.isSafeInteger(g[k])||g[k]<0) || g.best<g.score) throw new Error('Invalid saved Blocks game');
  const combo=g.combo??0, comboMisses=g.comboMisses??0, totalLines=g.totalLines??0;
  if([combo,comboMisses,totalLines].some(v=>!Number.isSafeInteger(v)||v<0)||comboMisses>2)throw new Error('Invalid saved combo');
  return {...g,combo,comboMisses,totalLines};
}
