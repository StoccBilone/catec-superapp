import { SHAPES, fits } from './engine';
export function pieceSize(shape: number) {
  const cells = SHAPES[shape];
  return { rows: Math.max(...cells.map(([r]) => r)) + 1, columns: Math.max(...cells.map(([,c]) => c)) + 1 };
}
export function pieceLift(shape: number, cell: number) { return Math.max(94, pieceSize(shape).rows * cell / 2 + 52); }
export function followOffset(pointer:{x:number;y:number},center:{x:number;y:number},lift:number) {
  return {x:pointer.x-center.x,y:pointer.y-center.y-lift};
}
export function dropTarget(shape: number, cell: number, origin: {x:number;y:number}, pointer: {x:number;y:number}) {
  const {rows,columns}=pieceSize(shape);
  return {row:Math.round((pointer.y-pieceLift(shape,cell)-origin.y)/cell-rows/2), col:Math.round((pointer.x-origin.x)/cell-columns/2)};
}
// A local magnet helps aiming without moving a piece to a distant gap.
export function magneticTarget(board:number[], shape:number, cell:number, origin:{x:number;y:number}, pointer:{x:number;y:number}, previous:{row:number;col:number}|null=null) {
  const {rows,columns}=pieceSize(shape);
  const row=(pointer.y-pieceLift(shape,cell)-origin.y)/cell-rows/2;
  const col=(pointer.x-origin.x)/cell-columns/2;
  const radius=1.35;
  let best:{row:number;col:number}|null=null, distance=Infinity;
  for(let r=0;r<=8-rows;r++)for(let c=0;c<=8-columns;c++){
    const d=Math.hypot(r-row,c-col);
    if(d<=radius&&d<distance&&fits(board,shape,r,c)){best={row:r,col:c};distance=d;}
  }
  if(previous&&fits(board,shape,previous.row,previous.col)){
    const d=Math.hypot(previous.row-row,previous.col-col);
    if(d<=radius&&d<=distance+.18)return previous;
  }
  return best;
}
export function snappedPointer(shape:number,cell:number,origin:{x:number;y:number},target:{row:number;col:number}) {
  const {rows,columns}=pieceSize(shape);
  return {x:origin.x+(target.col+columns/2)*cell,y:origin.y+(target.row+rows/2)*cell+pieceLift(shape,cell)};
}
