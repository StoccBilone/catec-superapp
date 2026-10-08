export interface Target { x: number; y: number; width: number; height: number; kind: 'island' | 'notch' | 'capsule'; }
export interface Arena { width: number; height: number; paddleY: number; paddleWidth: number; target: Target; }
export interface IslandGame { x: number; y: number; vx: number; vy: number; paddleX: number; score: number; ended: boolean; }
export const BALL_RADIUS = 7;
export const PADDLE_HEIGHT = 10;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// Native iOS exposes the model and safe area, not the physical cutout rectangle.
// Standard point dimensions are an approximation to check on the actual phone.
export function targetForDevice(width: number, topInset: number, modelId: string | null, modelName: string | null, ios: boolean): Target {
  const knownIsland = /^(iPhone15,[2345]|iPhone16,[12]|iPhone17,[1234])$/.test(modelId || '');
  const name = modelName || '';
  const island = ios && (knownIsland || /iPhone 14 Pro/.test(name) || topInset >= 59);
  if (island) return { kind: 'island', x: (width - 126) / 2, y: 11, width: 126, height: 37 };
  if (ios && (topInset >= 40 || /iPhone (X|11|12|13|14|16e)/.test(name))) {
    const narrow = /iPhone (13|14|16e)/.test(name) || /^(iPhone14,[234578]|iPhone17,5)$/.test(modelId || '');
    const notchWidth = narrow ? Math.min(160, width * 0.46) : Math.min(210, width * 0.56);
    return { kind: 'notch', x: (width - notchWidth) / 2, y: 0, width: notchWidth, height: 32 };
  }
  return { kind: 'capsule', x: (width - 126) / 2, y: 18, width: 126, height: 34 };
}

export function createArena(width: number, height: number, bottomInset: number, target: Target): Arena {
  return { width, height, target, paddleWidth: Math.min(96, width * 0.25), paddleY: height - Math.max(bottomInset, 16) - 85 };
}

export function createIslandGame(arena: Arena): IslandGame {
  return { x: arena.width / 2, y: arena.paddleY - BALL_RADIUS - 12, vx: 24, vy: -Math.sqrt(340 * 340 - 24 * 24), paddleX: arena.width / 2, score: 0, ended: false };
}

export function movePaddle(game: IslandGame, arena: Arena, x: number): IslandGame {
  return { ...game, paddleX: clamp(x, arena.paddleWidth / 2 + 12, arena.width - arena.paddleWidth / 2 - 12) };
}

function targetContact(x: number, y: number, target: Target): { nx: number; ny: number; x: number; y: number } | null {
  if (target.kind === 'notch') {
    const nearX = clamp(x, target.x, target.x + target.width);
    const nearY = clamp(y, target.y, target.y + target.height);
    const dx = x - nearX, dy = y - nearY;
    const distance = Math.hypot(dx, dy);
    if (distance > BALL_RADIUS) return null;
    return { nx: distance ? dx / distance : 0, ny: distance ? dy / distance : 1, x: nearX, y: nearY };
  }
  const radius = target.height / 2;
  const nearX = clamp(x, target.x + radius, target.x + target.width - radius);
  const nearY = target.y + radius;
  const dx = x - nearX, dy = y - nearY;
  const distance = Math.hypot(dx, dy);
  if (distance > radius + BALL_RADIUS) return null;
  const nx = distance ? dx / distance : 0, ny = distance ? dy / distance : 1;
  return { nx, ny, x: nearX + nx * radius, y: nearY + ny * radius };
}

export function stepIsland(game: IslandGame, arena: Arena, elapsed: number): { game: IslandGame; hit: boolean; paddleHit: boolean } {
  if (game.ended || !Number.isFinite(elapsed) || elapsed <= 0) return { game, hit: false, paddleHit: false };
  const next = { ...game };
  const duration = Math.min(elapsed, 0.05);
  const steps = Math.ceil(duration * 120);
  const dt = duration / steps;
  let hit = false, paddleHit = false;
  for (let i = 0; i < steps; i++) {
    const previousY = next.y;
    next.x += next.vx * dt;
    next.y += next.vy * dt;
    if (next.x < BALL_RADIUS) { next.x = BALL_RADIUS; next.vx = Math.abs(next.vx); }
    if (next.x > arena.width - BALL_RADIUS) { next.x = arena.width - BALL_RADIUS; next.vx = -Math.abs(next.vx); }
    const contact = targetContact(next.x, next.y, arena.target);
    if (contact) {
      const dot = next.vx * contact.nx + next.vy * contact.ny;
      if (dot < 0) {
        next.vx -= 2 * dot * contact.nx;
        next.vy -= 2 * dot * contact.ny;
        next.x = contact.x + contact.nx * (BALL_RADIUS + 0.5);
        // The goal returns the ball below the cutout, including contacts from above.
        // This avoids trapping it in the narrow gap between island and screen edge.
        next.y = Math.max(contact.y + contact.ny * (BALL_RADIUS + 0.5), arena.target.y + arena.target.height + BALL_RADIUS + 0.5);
        next.score++;
        const speed = Math.min(620, 340 + next.score * 12);
        // Keep the ball moving vertically even after a glancing hit.
        const angle = Math.atan2(Math.max(Math.abs(next.vy), speed * 0.35), next.vx);
        next.vx = Math.cos(angle) * speed;
        next.vy = Math.sin(angle) * speed;
        hit = true;
      }
    }
    if (next.y < BALL_RADIUS) { next.y = BALL_RADIUS; next.vy = Math.abs(next.vy); }
    const crossedPaddle = next.vy > 0 && previousY + BALL_RADIUS <= arena.paddleY && next.y + BALL_RADIUS >= arena.paddleY;
    if (crossedPaddle && Math.abs(next.x - next.paddleX) <= arena.paddleWidth / 2 + BALL_RADIUS) {
      const offset = clamp((next.x - next.paddleX) / (arena.paddleWidth / 2), -1, 1);
      const speed = Math.min(620, 340 + next.score * 12);
      const angle = offset * Math.PI * 0.34;
      next.vx = speed * Math.sin(angle);
      next.vy = -speed * Math.cos(angle);
      next.y = arena.paddleY - BALL_RADIUS - 0.5;
      paddleHit = true;
    }
    if (next.y - BALL_RADIUS > arena.height) { next.ended = true; break; }
  }
  return { game: next, hit, paddleHit };
}
