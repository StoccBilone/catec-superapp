export type Difficulty = 4 | 6 | 8;
export interface MemoryCard { id: number; symbol: number; matched: boolean; }
export interface MemoryGame { size: Difficulty; cards: MemoryCard[]; selected: number[]; moves: number; }
export function newMemory(size: Difficulty, random = Math.random): MemoryGame {
  if (![4, 6, 8].includes(size)) throw new Error('Invalid difficulty');
  const symbols = Array.from({ length: size * size }, (_, i) => Math.floor(i / 2));
  for (let i = symbols.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
  }
  return { size, cards: symbols.map((symbol, id) => ({ id, symbol, matched: false })), selected: [], moves: 0 };
}
export function revealCard(game: MemoryGame, id: number): MemoryGame {
  const card = game.cards.find(c => c.id === id);
  if (!card || card.matched || game.selected.includes(id) || game.selected.length === 2) return game;
  return { ...game, selected: [...game.selected, id], moves: game.moves + (game.selected.length === 1 ? 1 : 0) };
}
export function resolveCards(game: MemoryGame): MemoryGame {
  if (game.selected.length !== 2) return game;
  const [a, b] = game.selected.map(id => game.cards[id]);
  const same = a.symbol === b.symbol;
  return { ...game, selected: [], cards: same ? game.cards.map(card => game.selected.includes(card.id) ? { ...card, matched: true } : card) : game.cards };
}
export const pairCount = (game: MemoryGame) => game.cards.filter(c => c.matched).length / 2;
export const memoryFinished = (game: MemoryGame) => game.cards.every(c => c.matched);
