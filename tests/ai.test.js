import test from 'node:test';
import assert from 'node:assert/strict';
import { DIR, LEFT, createGame, cellIndex } from '../src/core/game.js';
import { chooseDirection } from '../src/core/ai.js';

const setup = (rngValue = 0) => {
  const game = createGame({ border: false, computer: true, obstacles: false, fast: false }, () => rngValue);
  Object.assign(game.players[LEFT], { x: 100, y: 100, dir: DIR.RIGHT });
  return game;
};
const block = (game, x, y) => { game.cells[cellIndex(x, y)] = 2; };

test('the computer keeps going straight while the cell ahead is free', () => {
  assert.equal(chooseDirection(setup(), LEFT), DIR.RIGHT);
});

test('blocked ahead and blocked on the right: the computer turns left even if left is blocked', () => {
  const game = setup();
  block(game, 102, 100);
  block(game, 100, 102); // right of heading right is down
  block(game, 100, 98);
  assert.equal(chooseDirection(game, LEFT), DIR.UP);
});

test('blocked ahead and on the left only: the computer turns right', () => {
  const game = setup();
  block(game, 102, 100);
  block(game, 100, 98);
  assert.equal(chooseDirection(game, LEFT), DIR.DOWN);
});

test('blocked ahead with both sides free: the computer picks a side at random', () => {
  const right = setup(0);
  block(right, 102, 100);
  assert.equal(chooseDirection(right, LEFT), DIR.DOWN);

  const left = setup(1);
  block(left, 102, 100);
  assert.equal(chooseDirection(left, LEFT), DIR.UP);
});
