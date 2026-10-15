// Time-driven match flow around the pure rules: racing -> exploding -> between | over.
import {
  EXPLOSION_FRAMES, awardPoint, createGame, newGame, startRace, tick,
} from '../core/game.js';

export { EXPLOSION_FRAMES };

// Cycle-count estimate (12.5 / 7 ms) slowed down 5% after playtesting.
export const HALF_STEP_MS = Object.freeze({ normal: 13.125, fast: 7.35 });
export const EXPLOSION_FRAME_MS = 110;
export const NEXT_RACE_DELAY_MS = 480;
const MAX_FRAME_MS = 250;

export function createMatch(settings, rng) {
  return {
    game: createGame(settings, rng),
    phase: 'racing',
    paused: false,
    elapsed: 0,
    explosion: null,
    lastCrash: null,
    winner: null,
  };
}

/**
 * Advance the match by dt milliseconds.
 * @returns {Array<{type: 'engine', coarse: number}|{type: 'crash'}|{type: 'score'}|{type: 'over', winner: number}>}
 */
export function update(match, dt) {
  if (match.paused || match.phase === 'over') return [];
  // Only movement is capped, so a hidden tab does not fast-forward the race.
  match.elapsed += match.phase === 'racing' ? Math.min(dt, MAX_FRAME_MS) : dt;
  switch (match.phase) {
    case 'racing': return race(match);
    case 'exploding': return explode(match);
    default: return waitForNextRace(match);
  }
}

function race(match) {
  const events = [];
  const halfStep = match.game.settings.fast ? HALF_STEP_MS.fast : HALF_STEP_MS.normal;
  while (match.elapsed >= halfStep) {
    match.elapsed -= halfStep;
    const result = tick(match.game);
    if (result.engineCoarse !== undefined) events.push({ type: 'engine', coarse: result.engineCoarse });
    if (result.crashed) {
      match.phase = 'exploding';
      match.elapsed = 0;
      match.explosion = { player: result.player, x: result.x, y: result.y, frame: 0 };
      match.lastCrash = result.player;
      events.push({ type: 'crash' });
      break;
    }
  }
  return events;
}

function explode(match) {
  const frame = Math.floor(match.elapsed / EXPLOSION_FRAME_MS);
  if (frame < EXPLOSION_FRAMES) {
    match.explosion.frame = frame;
    return [];
  }
  const winner = awardPoint(match.game, match.explosion.player);
  match.explosion = null;
  match.elapsed = 0;
  if (winner === null) {
    match.phase = 'between';
    return [{ type: 'score' }];
  }
  match.phase = 'over';
  match.winner = winner;
  return [{ type: 'score' }, { type: 'over', winner }];
}

function waitForNextRace(match) {
  if (match.elapsed >= NEXT_RACE_DELAY_MS) {
    startRace(match.game);
    match.phase = 'racing';
    match.elapsed = 0;
    match.lastCrash = null;
  }
  return [];
}

export function restart(match) {
  newGame(match.game);
  Object.assign(match, {
    phase: 'racing', paused: false, elapsed: 0, explosion: null, lastCrash: null, winner: null,
  });
}

/** @returns {Array<{type: 'silence'}>} silence when pausing; the engine resumes on the next move. */
export function togglePause(match) {
  match.paused = !match.paused;
  return match.paused ? [{ type: 'silence' }] : [];
}
