// Playfield geometry shared by the rules and the computer player.
(function (LB) {
  'use strict';

  const DIR = Object.freeze({ UP: 1, RIGHT: 3, DOWN: 5, LEFT: 7 });

  const SCREEN_WIDTH = 256;
  const SCREEN_HEIGHT = 192;
  const Y_MIN = 1;
  const Y_MAX = 182;
  const CELL_COLS = 128;
  const CELL_ROWS = 92;

  /** Index of the 2x2-pixel collision cell that holds pixel (x, y). */
  const cellIndex = (x, y) => ((y + 1) >> 1) * CELL_COLS + (x >> 1);

  const isBlocked = (game, x, y) => game.cells[cellIndex(x, y)] !== 0;

  const step1 = (x, y, dir) => {
    switch (dir) {
      case DIR.UP: return { x, y: y - 1 < Y_MIN ? Y_MAX : y - 1 };
      case DIR.DOWN: return { x, y: y + 1 > Y_MAX ? Y_MIN : y + 1 };
      case DIR.RIGHT: return { x: (x + 1) & 0xff, y };
      default: return { x: (x - 1) & 0xff, y };
    }
  };

  /** Position after one move: two single-pixel steps. */
  const moveFrom = (x, y, dir) => {
    const half = step1(x, y, dir);
    return step1(half.x, half.y, dir);
  };

  LB.field = {
    DIR,
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    Y_MIN,
    Y_MAX,
    CELL_COLS,
    CELL_ROWS,
    cellIndex,
    isBlocked,
    moveFrom,
  };
})(globalThis.LazerBykes ??= {});
