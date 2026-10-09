import { SHAPES } from './engine';
export function pieceSize(shape: number) {
  const cells = SHAPES[shape];
  return { rows: Math.max(...cells.map(([r]) => r)) + 1, columns: Math.max(...cells.map(([,c]) => c)) + 1 };
}
export function pieceLift(shape: number, cell: number) { return Math.max(68, pieceSize(shape).rows * cell / 2 + 26); }
export function dropTarget(shape: number, cell: number, origin: {x:number;y:number}, pointer: {x:number;y:number}) {
  const {rows,columns}=pieceSize(shape);
  return {row:Math.round((pointer.y-pieceLift(shape,cell)-origin.y)/cell-rows/2), col:Math.round((pointer.x-origin.x)/cell-columns/2)};
}
