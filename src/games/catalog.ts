// Register new games here; game logic and screens stay outside Expo Router routes.
export const GAME_CATALOG = [
  { id: '2048', title: '2048', description: 'Объединяйте одинаковые числа.', route: '/games/2048' },
  { id: 'island', title: 'Hit the Island', description: 'Отбивайте мяч в островок.', route: '/games/island' },
  { id: 'maze', title: 'Лабиринт', description: 'Наклоняйте iPhone и ведите шарик.', route: '/games/maze' },
  { id: 'memory', title: 'Memory', description: 'Находите одинаковые пары.', route: null },
] as const;
export type GameId = typeof GAME_CATALOG[number]['id'];
