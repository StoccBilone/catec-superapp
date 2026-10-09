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
] as const;
export interface BlocksGame { board: number[]; pieces: (number | null)[]; score: number; best: number; moves: number; }
export function tray(random = Math.random): number[] { return Array.from({length:3}, () => Math.min(SHAPES.length - 1, Math.max(0, Math.floor(random() * SHAPES.length)))); }
export function newBlocks(best = 0, random = Math.random): BlocksGame { return {board:Array(64).fill(0), pieces:tray(random), score:0, best, moves:0}; }
export function fits(board: number[], shape: number, row: number, col: number): boolean {
  return Number.isInteger(row) && Number.isInteger(col) && !!SHAPES[shape] && SHAPES[shape].every(([r,c]) => row+r >= 0 && col+c >= 0 && row+r < SIDE && col+c < SIDE && board[(row+r)*SIDE+col+c] === 0);
}
export function canPlay(game: BlocksGame): boolean { return game.pieces.some(shape => shape !== null && game.board.some((_cell,i) => fits(game.board,shape,Math.floor(i/SIDE),i%SIDE))); }
export function place(game: BlocksGame, slot: number, row: number, col: number, random = Math.random): {game:BlocksGame; cleared:number[]; lines:number} | null {
  const shape = game.pieces[slot];
  if (shape == null || !fits(game.board,shape,row,col)) return null;
  const board = [...game.board];
  SHAPES[shape].forEach(([r,c]) => { board[(row+r)*SIDE+col+c] = 1; });
  const rows = Array.from({length:SIDE},(_,r)=>r).filter(r => board.slice(r*SIDE,r*SIDE+SIDE).every(Boolean));
  const cols = Array.from({length:SIDE},(_,c)=>c).filter(c => Array.from({length:SIDE},(_,r)=>board[r*SIDE+c]).every(Boolean));
  const cleared = board.flatMap((_v,i) => rows.includes(Math.floor(i/SIDE)) || cols.includes(i%SIDE) ? [i] : []);
  cleared.forEach(i => {board[i]=0;});
  const pieces = [...game.pieces]; pieces[slot] = null;
  const lines = rows.length+cols.length;
  const score = game.score + SHAPES[shape].length + lines*10 + Math.max(0,lines-1)*10;
  return {game:{board,pieces:pieces.every(p=>p===null)?tray(random):pieces,score,best:Math.max(game.best,score),moves:game.moves+1},cleared,lines};
}
export function decodeBlocks(raw: string | null): BlocksGame {
  if (!raw) return newBlocks();
  const g = JSON.parse(raw);
  if (!g || !Array.isArray(g.board) || g.board.length!==64 || g.board.some((v:unknown)=>v!==0&&v!==1) || !Array.isArray(g.pieces) || g.pieces.length!==3 || g.pieces.every((p:unknown)=>p===null) || g.pieces.some((p:unknown)=>p!==null && (typeof p!=='number'||!Number.isInteger(p)||!SHAPES[p])) || ['score','best','moves'].some(k=>!Number.isSafeInteger(g[k])||g[k]<0) || g.best<g.score) throw new Error('Invalid saved Blocks game');
  return g;
}
