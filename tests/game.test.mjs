import test from 'node:test';
import assert from 'node:assert/strict';
import { LB } from './load.mjs';

const {
  DIR, LEFT, RIGHT, WIN_SCORE,
  createGame, setInput, tick, awardPoint, startRace, newGame, cellIndex, isBlocked,
} = LB.game;

const fixedRng = (...values) => {
  let i = 0;
  return () => values[i++ % values.length];
};

const open = (overrides = {}) =>
  createGame({ border: false, computer: false, obstacles: false, fast: false, ...overrides }, fixedRng(0));

test('every race starts with the left bike heading right at (40,32) and the right bike heading left at (223,151)', () => {
  const game = open();
  assert.deepEqual(
    game.players.map(({ dir, x, y }) => ({ dir, x, y })),
    [{ dir: DIR.RIGHT, x: 40, y: 32 }, { dir: DIR.LEFT, x: 223, y: 151 }],
  );
  assert.deepEqual(game.scores, [0, 0]);
});

test('bikes alternate one move per tick, the right bike first, advancing 2 pixels', () => {
  const game = open();
  const first = tick(game);
  assert.equal(first.player, RIGHT);
  assert.deepEqual([game.players[RIGHT].x, game.players[LEFT].x], [221, 40]);
  const second = tick(game);
  assert.equal(second.player, LEFT);
  assert.deepEqual([game.players[RIGHT].x, game.players[LEFT].x], [221, 42]);
});

test('each move plots one trail pixel at the new head and claims its 2x2 cell', () => {
  const game = open();
  const result = tick(game);
  assert.deepEqual(result.pixel, { x: 221, y: 151 });
  assert.equal(game.trail[151 * 256 + 221], RIGHT + 1);
  assert.equal(game.cells[cellIndex(221, 151)], RIGHT + 1);
});

test('x wraps around 0..255 when there is no border', () => {
  const game = open();
  Object.assign(game.players[RIGHT], { x: 1, dir: DIR.LEFT });
  tick(game);
  assert.equal(game.players[RIGHT].x, 255);
});

test('y wraps between 1 and 182 when there is no border', () => {
  const game = open();
  Object.assign(game.players[RIGHT], { x: 101, y: 2, dir: DIR.UP });
  setInput(game, RIGHT, DIR.UP);
  tick(game);
  assert.equal(game.players[RIGHT].y, 182);

  Object.assign(game.players[RIGHT], { y: 181, dir: DIR.DOWN });
  setInput(game, RIGHT, DIR.DOWN);
  game.nextMover = RIGHT;
  tick(game);
  assert.equal(game.players[RIGHT].y, 1);
});

test('a perpendicular input turns the bike on its next move', () => {
  const game = open();
  setInput(game, RIGHT, DIR.UP);
  tick(game);
  assert.equal(game.players[RIGHT].dir, DIR.UP);
  assert.deepEqual([game.players[RIGHT].x, game.players[RIGHT].y], [223, 149]);
});

test('a reversing input is ignored', () => {
  const game = open();
  setInput(game, LEFT, DIR.LEFT);
  tick(game);
  tick(game);
  assert.equal(game.players[LEFT].dir, DIR.RIGHT);
  assert.equal(game.players[LEFT].x, 42);
});

test('the latched input persists after the key is released', () => {
  const game = open();
  setInput(game, RIGHT, DIR.DOWN);
  tick(game);
  tick(game);
  tick(game);
  assert.equal(game.players[RIGHT].dir, DIR.DOWN);
  assert.equal(game.players[RIGHT].y, 155);
});

test('diagonal joystick codes snap clockwise to the next straight direction', () => {
  const game = open();
  setInput(game, RIGHT, 8); // up-left
  tick(game);
  assert.equal(game.players[RIGHT].dir, DIR.UP);
});

test('moving into any claimed cell is a crash and the cell is not claimed again', () => {
  const game = open();
  const { x, y } = game.players[RIGHT];
  game.cells[cellIndex(x - 2, y)] = LEFT + 1;
  const result = tick(game);
  assert.equal(result.crashed, true);
  assert.equal(result.player, RIGHT);
  assert.equal(game.trail[y * 256 + x - 2], 0);
});

test('when both bikes aim at the same cell, the second one to move crashes', () => {
  const game = open();
  Object.assign(game.players[LEFT], { x: 100, y: 100, dir: DIR.RIGHT });
  Object.assign(game.players[RIGHT], { x: 105, y: 99, dir: DIR.LEFT });
  setInput(game, LEFT, DIR.RIGHT);
  setInput(game, RIGHT, DIR.LEFT);
  assert.equal(tick(game).crashed, false); // right moves to x=103, cell column 51
  const second = tick(game); // left moves to x=102: same cell column 51, row 50
  assert.equal(second.player, LEFT);
  assert.equal(second.crashed, true);
});

test('with the border on, the field edges are walls', () => {
  const game = createGame({ border: true, computer: false, obstacles: false, fast: false }, fixedRng(0));
  assert.equal(isBlocked(game, 15, 100), true);
  assert.equal(isBlocked(game, 16, 100), false);
  assert.equal(isBlocked(game, 247, 100), false);
  assert.equal(isBlocked(game, 248, 100), true);
  assert.equal(isBlocked(game, 100, 6), true);
  assert.equal(isBlocked(game, 100, 7), false);
  assert.equal(isBlocked(game, 100, 174), false);
  assert.equal(isBlocked(game, 100, 175), true);

  Object.assign(game.players[RIGHT], { x: 17, y: 101, dir: DIR.LEFT });
  assert.equal(tick(game).crashed, true);
});

test('with obstacles on, three 16x16 blocks are placed at random tile positions', () => {
  // rng(16) -> column offset, rng(12) -> row offset, three times.
  const game = createGame({ border: false, computer: false, obstacles: true, fast: false }, fixedRng(0, 0, 15, 11, 3, 2));
  assert.deepEqual(game.obstacles, [{ col: 6, row: 4 }, { col: 21, row: 15 }, { col: 9, row: 6 }]);
  // tile (6,4) covers x 48..63 and cell rows 16..23.
  assert.equal(isBlocked(game, 48, 32), true);
  assert.equal(isBlocked(game, 63, 46), true);
  assert.equal(isBlocked(game, 64, 40), false);
  assert.equal(isBlocked(game, 47, 40), false);
});

test('a crash scores a point for the other player', () => {
  const game = open();
  assert.equal(awardPoint(game, LEFT), null);
  assert.deepEqual(game.scores, [0, 1]);
  awardPoint(game, RIGHT);
  assert.deepEqual(game.scores, [1, 1]);
});

test(`the first player to win ${WIN_SCORE} races wins the game`, () => {
  const game = open();
  game.scores = [9, 3];
  assert.equal(awardPoint(game, RIGHT), LEFT);
  assert.deepEqual(game.scores, [10, 3]);
});

test('a new race clears trails and resets bikes and latched inputs but keeps scores', () => {
  const game = open();
  setInput(game, RIGHT, DIR.UP);
  tick(game);
  awardPoint(game, RIGHT);
  startRace(game);
  assert.equal(game.trail.some(Boolean), false);
  assert.equal(game.players[RIGHT].latched, DIR.LEFT);
  assert.deepEqual([game.players[RIGHT].x, game.players[RIGHT].y], [223, 151]);
  assert.equal(game.nextMover, RIGHT);
  assert.deepEqual(game.scores, [1, 0]);
});

test('a new game resets the scores and keeps the options', () => {
  const game = createGame({ border: true, computer: true, obstacles: false, fast: true }, fixedRng(0));
  game.scores = [10, 4];
  newGame(game);
  assert.deepEqual(game.scores, [0, 0]);
  assert.deepEqual(game.settings, { border: true, computer: true, obstacles: false, fast: true });
});

test('the engine pitch follows both bikes directions whenever the left bike moves', () => {
  const game = open();
  assert.equal(tick(game).engineCoarse, undefined);
  // left right(3) + right left(7) => (3 + 7) / 2 + 2
  assert.equal(tick(game).engineCoarse, 7);
});

test('with the computer on, the left bike ignores its keys and steers itself', () => {
  const game = createGame({ border: false, computer: true, obstacles: false, fast: false }, fixedRng(0));
  setInput(game, LEFT, DIR.UP);
  tick(game);
  tick(game);
  assert.equal(game.players[LEFT].dir, DIR.RIGHT);
});

test('a neutral input (no direction) does not overwrite the latched direction', () => {
  const game = open();
  setInput(game, RIGHT, DIR.UP);
  setInput(game, RIGHT, 0);
  tick(game);
  assert.equal(game.players[RIGHT].dir, DIR.UP);
});
