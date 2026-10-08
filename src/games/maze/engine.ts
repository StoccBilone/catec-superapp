export interface Maze { size: number; cells: number[][]; start: { x: number; z: number }; goal: { x: number; z: number }; }
export interface Marble { x: number; z: number; vx: number; vz: number; elapsed: number; won: boolean; }
export const MARBLE_RADIUS = 0.23;
export function makeMaze(seed = 1, size = 11): Maze {
  let state = seed >>> 0;
  const random = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
  if (!Number.isInteger(size) || size < 9 || size > 21 || size % 2 === 0) throw new Error('Invalid maze size');
  const cells = Array.from({ length: size }, () => Array<number>(size).fill(1));
  const stack = [{ x: 1, z: 1 }]; cells[1][1] = 0;
  while (stack.length) {
    const here = stack[stack.length - 1];
    const neighbours = [{ x: here.x + 2, z: here.z }, { x: here.x - 2, z: here.z }, { x: here.x, z: here.z + 2 }, { x: here.x, z: here.z - 2 }]
      .filter(p => p.x > 0 && p.z > 0 && p.x < size - 1 && p.z < size - 1 && cells[p.z][p.x] === 1);
    if (!neighbours.length) { stack.pop(); continue; }
    const next = neighbours[Math.floor(random() * neighbours.length)];
    cells[(here.z + next.z) / 2][(here.x + next.x) / 2] = 0;
    cells[next.z][next.x] = 0; stack.push(next);
  }
  // Choose the farthest exit to avoid trivial random layouts.
  const queue = [{ x: 1, z: 1 }], seen = new Set(['1,1']);
  for (let i = 0; i < queue.length; i++) {
    const here = queue[i];
    for (const next of [{ x: here.x+1, z: here.z }, { x: here.x-1, z: here.z }, { x: here.x, z: here.z+1 }, { x: here.x, z: here.z-1 }]) {
      const key = next.x + ',' + next.z;
      if (cells[next.z]?.[next.x] === 0 && !seen.has(key)) { seen.add(key); queue.push(next); }
    }
  }
  const farthest = queue[queue.length - 1];
  return { size, cells, start: { x: 1.5, z: 1.5 }, goal: { x: farthest.x + 0.5, z: farthest.z + 0.5 } };
}
export function newMarble(maze: Maze): Marble { return { ...maze.start, vx: 0, vz: 0, elapsed: 0, won: false }; }
export function stepMarble(marble: Marble, maze: Maze, tilt: { x: number; z: number }, elapsed: number): { marble: Marble; collision: boolean } {
  if (marble.won || !Number.isFinite(elapsed) || elapsed <= 0) return { marble, collision: false };
  const next = { ...marble };
  const dtTotal = Math.min(elapsed, 0.05), count = Math.ceil(dtTotal * 120), dt = dtTotal / count;
  const clamp = (n: number) => Math.max(-1, Math.min(1, Number.isFinite(n) ? n : 0));
  let collision = false;
  for (let i = 0; i < count; i++) {
    next.vx = (next.vx + clamp(tilt.x) * 14 * dt) * Math.exp(-2 * dt);
    next.vz = (next.vz + clamp(tilt.z) * 14 * dt) * Math.exp(-2 * dt);
    next.x += next.vx * dt; next.z += next.vz * dt;
    // Resolve circle against every nearby wall; short steps prevent tunnelling.
    for (let z = Math.max(0, Math.floor(next.z) - 1); z <= Math.min(maze.size - 1, Math.floor(next.z) + 1); z++) {
      for (let x = Math.max(0, Math.floor(next.x) - 1); x <= Math.min(maze.size - 1, Math.floor(next.x) + 1); x++) {
        if (!maze.cells[z][x]) continue;
        const nearX = Math.max(x, Math.min(x + 1, next.x)), nearZ = Math.max(z, Math.min(z + 1, next.z));
        const dx = next.x - nearX, dz = next.z - nearZ, distance = Math.hypot(dx, dz);
        if (distance >= MARBLE_RADIUS || distance === 0) continue;
        const nx = dx / distance, nz = dz / distance, depth = MARBLE_RADIUS - distance;
        next.x += nx * depth; next.z += nz * depth;
        const dot = next.vx * nx + next.vz * nz;
        if (dot < 0) { next.vx -= 1.2 * dot * nx; next.vz -= 1.2 * dot * nz; if (Math.abs(dot) > 0.25) collision = true; }
      }
    }
    next.elapsed += dt;
    if (Math.hypot(next.x - maze.goal.x, next.z - maze.goal.z) < 0.3) { next.won = true; next.vx = 0; next.vz = 0; break; }
  }
  return { marble: next, collision };
}
