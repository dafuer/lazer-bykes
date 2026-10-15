import test from 'node:test';
import assert from 'node:assert/strict';
import { LB } from './load.mjs';

const { DIR, LEFT, RIGHT, WIN_SCORE } = LB.game;
const { steerFor } = LB.keyboard;
const { defaultSettings, menuKey } = LB.menu;
const {
  HALF_STEP_MS, EXPLOSION_FRAME_MS, EXPLOSION_FRAMES, NEXT_RACE_DELAY_MS,
  createMatch, update, togglePause, restart,
} = LB.match;

test('arrow keys steer player 1, the left bike', () => {
  assert.deepEqual(steerFor('ArrowUp'), { player: LEFT, dir: DIR.UP });
  assert.deepEqual(steerFor('ArrowRight'), { player: LEFT, dir: DIR.RIGHT });
  assert.deepEqual(steerFor('ArrowDown'), { player: LEFT, dir: DIR.DOWN });
  assert.deepEqual(steerFor('ArrowLeft'), { player: LEFT, dir: DIR.LEFT });
});

test('W A S D steer player 2, the right bike', () => {
  assert.deepEqual(steerFor('KeyW'), { player: RIGHT, dir: DIR.UP });
  assert.deepEqual(steerFor('KeyD'), { player: RIGHT, dir: DIR.RIGHT });
  assert.deepEqual(steerFor('KeyS'), { player: RIGHT, dir: DIR.DOWN });
  assert.deepEqual(steerFor('KeyA'), { player: RIGHT, dir: DIR.LEFT });
  assert.equal(steerFor('KeyQ'), null);
});

test('the menu starts with the border on and everything else off', () => {
  assert.deepEqual(defaultSettings(), { border: true, computer: false, obstacles: false, fast: false });
});

test('menu keys B, C, O and F toggle their option, in either case', () => {
  let settings = defaultSettings();
  for (const key of ['b', 'C', 'o', 'F']) ({ settings } = menuKey(settings, key));
  assert.deepEqual(settings, { border: false, computer: true, obstacles: true, fast: true });
});

test('menu key S starts the game and I shows the instructions; other keys do nothing', () => {
  const settings = defaultSettings();
  assert.equal(menuKey(settings, 's').action, 'start');
  assert.equal(menuKey(settings, 'I').action, 'instructions');
  const other = menuKey(settings, 'x');
  assert.equal(other.action, null);
  assert.deepEqual(other.settings, settings);
});

const quietMatch = (overrides = {}) =>
  createMatch({ ...defaultSettings(), border: false, ...overrides }, () => 0);

test('the game runs 5% slower than the estimate: one move every 13.125 ms, or 7.35 ms in fast mode', () => {
  assert.deepEqual(HALF_STEP_MS, { normal: 13.125, fast: 7.35 });
  const normal = quietMatch();
  update(normal, 13);
  assert.equal(normal.game.players[RIGHT].x, 223);
  update(normal, 0.125);
  assert.equal(normal.game.players[RIGHT].x, 221);

  const fast = quietMatch({ fast: true });
  update(fast, 7.3);
  assert.equal(fast.game.players[RIGHT].x, 223);
  update(fast, 7.7);
  assert.deepEqual([fast.game.players[RIGHT].x, fast.game.players[LEFT].x], [221, 42]);
});

test('each left-bike move reports the engine pitch', () => {
  const match = quietMatch();
  assert.deepEqual(update(match, HALF_STEP_MS.normal * 2), [{ type: 'engine', coarse: 7 }]);
});

const crashRightBike = (match) => {
  const { x, y } = match.game.players[RIGHT];
  match.game.cells.fill(1);
  match.game.players[RIGHT].x = x;
  match.game.players[RIGHT].y = y;
  return update(match, HALF_STEP_MS.normal);
};

test('a crash stops the race and starts the 8-frame explosion where the bike hit', () => {
  const match = quietMatch();
  const events = crashRightBike(match);
  assert.deepEqual(events, [{ type: 'crash' }]);
  assert.equal(match.phase, 'exploding');
  assert.deepEqual(match.explosion, { player: RIGHT, x: 221, y: 151, frame: 0 });
  update(match, EXPLOSION_FRAME_MS * 3);
  assert.equal(match.explosion.frame, 3);
  assert.equal(match.game.players[LEFT].x, 40);
});

test('after the explosion the other player scores, then the next race starts', () => {
  const match = quietMatch();
  crashRightBike(match);
  assert.deepEqual(update(match, EXPLOSION_FRAME_MS * EXPLOSION_FRAMES), [{ type: 'score' }]);
  assert.deepEqual(match.game.scores, [1, 0]);
  assert.equal(match.phase, 'between');
  update(match, NEXT_RACE_DELAY_MS);
  assert.equal(match.phase, 'racing');
  assert.equal(match.game.trail.some(Boolean), false);
  assert.equal(match.game.players[RIGHT].x, 223);
});

test(`reaching ${WIN_SCORE} points ends the game and names the winner`, () => {
  const match = quietMatch();
  match.game.scores = [WIN_SCORE - 1, 0];
  crashRightBike(match);
  const events = update(match, EXPLOSION_FRAME_MS * EXPLOSION_FRAMES);
  assert.deepEqual(events, [{ type: 'score' }, { type: 'over', winner: LEFT }]);
  assert.equal(match.phase, 'over');
  assert.equal(match.winner, LEFT);
  update(match, 1000);
  assert.equal(match.phase, 'over');
});

test('restart begins a new game with the same options', () => {
  const match = quietMatch({ obstacles: true });
  match.game.scores = [WIN_SCORE, 2];
  match.phase = 'over';
  restart(match);
  assert.equal(match.phase, 'racing');
  assert.equal(match.winner, null);
  assert.deepEqual(match.game.scores, [0, 0]);
  assert.equal(match.game.settings.obstacles, true);
});

test('pause freezes the race and mutes the sound until it is toggled again', () => {
  const match = quietMatch();
  assert.deepEqual(togglePause(match), [{ type: 'silence' }]);
  assert.deepEqual(update(match, 100), []);
  assert.equal(match.game.players[RIGHT].x, 223);
  assert.deepEqual(togglePause(match), []);
  update(match, HALF_STEP_MS.normal);
  assert.equal(match.game.players[RIGHT].x, 221);
});

test('a long frame gap (hidden tab) is capped instead of fast-forwarding the race', () => {
  const match = quietMatch();
  update(match, 60_000);
  assert.ok(match.game.players[RIGHT].x > 200);
});

test('the bike is a 1-pixel line with a 3x3 block behind a 1-pixel tip, the head at the grid centre', () => {
  const up = LB.sprites.BIKE[DIR.UP].map((row) => row.join('')).join('/');
  assert.equal(up, [
    '000010000',
    '000111000',
    '000111000',
    '000111000',
    '000010000',
    '000010000',
    '000010000',
    '000010000',
    '000000000',
  ].join('/'));
});

test('in every direction the bike stays centred on its trail', () => {
  const HEAD = 4;
  const behind = { [DIR.UP]: [0, 1], [DIR.RIGHT]: [-1, 0], [DIR.DOWN]: [0, -1], [DIR.LEFT]: [1, 0] };
  for (const dir of [DIR.UP, DIR.RIGHT, DIR.DOWN, DIR.LEFT]) {
    const grid = LB.sprites.BIKE[dir];
    const vertical = dir === DIR.UP || dir === DIR.DOWN;
    const across = [];
    grid.forEach((row, y) => row.forEach((on, x) => { if (on) across.push(vertical ? x : y); }));
    assert.deepEqual([Math.min(...across), Math.max(...across)], [HEAD - 1, HEAD + 1], `dir ${dir}`);
    const [bx, by] = behind[dir];
    for (let k = 0; k <= 3; k++) assert.equal(grid[HEAD + by * k][HEAD + bx * k], 1, `dir ${dir} neck ${k}`);
  }
});

test('an obstacle is a hollow 16x16 square with a 2x2 dot in the middle', () => {
  const grid = LB.sprites.OBSTACLE;
  const set = [];
  grid.forEach((row, y) => row.forEach((on, x) => { if (on) set.push(`${x},${y}`); }));
  const edge = (x, y) => x === 0 || y === 0 || x === 15 || y === 15;
  const dot = (x, y) => (x === 7 || x === 8) && (y === 7 || y === 8);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) assert.equal(grid[y][x], edge(x, y) || dot(x, y) ? 1 : 0, `${x},${y}`);
  }
  assert.equal(set.length, 60 + 4);
});
