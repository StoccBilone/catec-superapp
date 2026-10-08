export type Direction = 'left' | 'right' | 'up' | 'down';
export interface Tile { id: number; value: number; row: number; column: number; }
export interface Game2048 { tiles: Tile[]; score: number; moves: number; nextId: number; acknowledgedWin: boolean; }
export interface Saved2048 { version: 1; game: Game2048; best: number; }
type Random = () => number;

function spawn(game: Game2048, random: Random): Game2048 {
  const empty: { row: number; column: number }[] = [];
  for (let row = 0; row < 4; row++) for (let column = 0; column < 4; column++) {
    if (!game.tiles.some(tile => tile.row === row && tile.column === column)) empty.push({ row, column });
  }
  if (!empty.length) return game;
  const position = empty[Math.min(empty.length - 1, Math.floor(random() * empty.length))];
  return { ...game, nextId: game.nextId + 1, tiles: [...game.tiles, { ...position, id: game.nextId, value: random() < 0.9 ? 2 : 4 }] };
}

export function newGame(random: Random = Math.random): Game2048 {
  return spawn(spawn({ tiles: [], score: 0, moves: 0, nextId: 1, acknowledgedWin: false }, random), random);
}

export function moveGame(game: Game2048, direction: Direction, random: Random = Math.random): { game: Game2048; changed: boolean; gained: number } {
  const horizontal = direction === 'left' || direction === 'right';
  const reversed = direction === 'right' || direction === 'down';
  const tiles: Tile[] = [];
  let gained = 0;
  for (let line = 0; line < 4; line++) {
    const entries = game.tiles.filter(tile => (horizontal ? tile.row : tile.column) === line)
      .sort((a, b) => (horizontal ? a.column - b.column : a.row - b.row) * (reversed ? -1 : 1));
    let slot = 0;
    for (let index = 0; index < entries.length; index++) {
      const tile = entries[index];
      const paired = entries[index + 1]?.value === tile.value;
      const value = paired ? tile.value * 2 : tile.value;
      if (paired) { gained += value; index++; }
      const position = reversed ? 3 - slot : slot;
      tiles.push({ ...tile, value, row: horizontal ? line : position, column: horizontal ? position : line });
      slot++;
    }
  }
  const changed = tiles.length !== game.tiles.length || tiles.some(tile => {
    const original = game.tiles.find(item => item.id === tile.id)!;
    return tile.row !== original.row || tile.column !== original.column || tile.value !== original.value;
  });
  // A blocked swipe consumes no move and never adds a new tile.
  if (!changed) return { game, changed: false, gained: 0 };
  return { game: spawn({ ...game, tiles, score: game.score + gained, moves: game.moves + 1 }, random), changed: true, gained };
}

export function canMove(game: Game2048): boolean {
  if (game.tiles.length < 16) return true;
  return game.tiles.some(tile => game.tiles.some(other => other.value === tile.value &&
    Math.abs(tile.row - other.row) + Math.abs(tile.column - other.column) === 1));
}

export function hasWon(game: Game2048): boolean {
  return game.tiles.some(tile => tile.value >= 2048);
}

export function decodeSavedGame(raw: string | null): Saved2048 | null {
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw) as Saved2048;
    const game = saved.game;
    if (saved.version !== 1 || !Number.isSafeInteger(saved.best) || saved.best < 0 || !game ||
      !Number.isSafeInteger(game.score) || game.score < 0 || !Number.isSafeInteger(game.moves) || game.moves < 0 ||
      !Number.isSafeInteger(game.nextId) || game.nextId < 1 || typeof game.acknowledgedWin !== 'boolean' ||
      !Array.isArray(game.tiles) || game.tiles.length < 2 || game.tiles.length > 16) return null;
    const cells = new Set<string>();
    const ids = new Set<number>();
    for (const tile of game.tiles) {
      if (!tile || !Number.isSafeInteger(tile.id) || tile.id < 1 || tile.id >= game.nextId || ids.has(tile.id) ||
        !Number.isInteger(tile.row) || tile.row < 0 || tile.row > 3 ||
        !Number.isInteger(tile.column) || tile.column < 0 || tile.column > 3 ||
        !Number.isSafeInteger(tile.value) || tile.value < 2 || !Number.isInteger(Math.log2(tile.value))) return null;
      const cell = `${tile.row}:${tile.column}`;
      if (cells.has(cell)) return null;
      cells.add(cell); ids.add(tile.id);
    }
    return { version: 1, game, best: Math.max(saved.best, game.score) };
  } catch { return null; }
}
