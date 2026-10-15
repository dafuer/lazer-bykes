// Pure game rules for the Lazer Bykes remake. See docs/original-analysis.md.
import { chooseDirection } from './ai.js';
import {
  DIR, SCREEN_WIDTH, SCREEN_HEIGHT, CELL_COLS, CELL_ROWS, cellIndex, isBlocked, moveFrom,
} from './field.js';

export {
  DIR, SCREEN_WIDTH, SCREEN_HEIGHT, Y_MIN, Y_MAX, cellIndex, isBlocked, moveFrom,
} from './field.js';

export const LEFT = 0;
export const RIGHT = 1;
export const WIN_SCORE = 10;
/** Frames in the crash explosion animation. */
export const EXPLOSION_FRAMES = 8;

const WALL = 3;
const OBSTACLE_COUNT = 3;

const START = [
  { dir: DIR.RIGHT, x: 40, y: 32 },
  { dir: DIR.LEFT, x: 223, y: 151 },
];

/** Snap a joystick code (1..8, diagonals included) to a straight direction, clockwise. */
const straighten = (code) => (code & 7) | 1;

/**
 * @param {{border: boolean, computer: boolean, obstacles: boolean, fast: boolean}} settings
 * @param {(n: number) => number} rng returns an integer in [0, n)
 */
export function createGame(settings, rng) {
  const game = {
    settings: { ...settings },
    rng,
    scores: [0, 0],
    cells: new Uint8Array(CELL_COLS * CELL_ROWS),
    trail: new Uint8Array(SCREEN_WIDTH * SCREEN_HEIGHT),
    obstacles: [],
    players: [],
    nextMover: RIGHT,
  };
  startRace(game);
  return game;
}

/** Latch the last direction a player asked for. Neutral input (0) is ignored. */
export function setInput(game, player, code) {
  if (code) game.players[player].latched = code;
}

/**
 * Advance one half-step: only one bike moves, alternating right then left.
 * @returns {{player: number, crashed: boolean, x: number, y: number,
 *   pixel?: {x: number, y: number}, engineCoarse?: number}}
 */
export function tick(game) {
  const index = game.nextMover;
  game.nextMover = 1 - index;
  const bike = game.players[index];
  const result = { player: index, crashed: false };

  if (index === LEFT) {
    result.engineCoarse = ((game.players[LEFT].dir + game.players[RIGHT].dir) >> 1) + 2;
  }

  const wanted = straighten(
    index === LEFT && game.settings.computer ? chooseDirection(game, LEFT) : bike.latched,
  );
  if ((wanted ^ bike.dir) & 2) bike.dir = wanted;

  const { x, y } = moveFrom(bike.x, bike.y, bike.dir);
  bike.x = x;
  bike.y = y;
  Object.assign(result, { x, y });

  if (isBlocked(game, x, y)) {
    result.crashed = true;
    return result;
  }
  game.cells[cellIndex(x, y)] = index + 1;
  game.trail[y * SCREEN_WIDTH + x] = index + 1;
  result.pixel = { x, y };
  return result;
}

/**
 * Give the race to the opponent of the bike that crashed.
 * @returns {number|null} the winner of the game, or null if it continues
 */
export function awardPoint(game, crashed) {
  const scorer = 1 - crashed;
  game.scores[scorer] += 1;
  return game.scores[scorer] >= WIN_SCORE ? scorer : null;
}

/** Clear the field and put both bikes back on their marks. Scores are kept. */
export function startRace(game) {
  game.cells.fill(0);
  game.trail.fill(0);
  if (game.settings.border) buildBorder(game.cells);
  game.obstacles = game.settings.obstacles ? placeObstacles(game.cells, game.rng) : [];
  game.players = START.map(({ dir, x, y }) => ({ dir, x, y, latched: dir }));
  game.nextMover = RIGHT;
}

export function newGame(game) {
  game.scores = [0, 0];
  startRace(game);
}

function fillCells(cells, row, fromCol, toCol) {
  cells.fill(WALL, row * CELL_COLS + fromCol, row * CELL_COLS + toCol + 1);
}

function buildBorder(cells) {
  fillCells(cells, 3, 0, CELL_COLS - 1);
  fillCells(cells, 88, 0, CELL_COLS - 1);
  for (let row = 4; row <= 87; row++) {
    fillCells(cells, row, 0, 7);
    fillCells(cells, row, 124, CELL_COLS - 1);
  }
}

function placeObstacles(cells, rng) {
  const obstacles = [];
  for (let i = 0; i < OBSTACLE_COUNT; i++) {
    const col = 6 + rng(16);
    const row = 4 + rng(12);
    for (let r = 0; r < 8; r++) fillCells(cells, row * 4 + r, col * 4, col * 4 + 7);
    obstacles.push({ col, row });
  }
  return obstacles;
}
