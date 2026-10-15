// Playfield geometry shared by the rules and the computer player.
export const DIR = Object.freeze({ UP: 1, RIGHT: 3, DOWN: 5, LEFT: 7 });

export const SCREEN_WIDTH = 256;
export const SCREEN_HEIGHT = 192;
export const Y_MIN = 1;
export const Y_MAX = 182;
export const CELL_COLS = 128;
export const CELL_ROWS = 92;

/** Index of the 2x2-pixel collision cell that holds pixel (x, y). */
export const cellIndex = (x, y) => ((y + 1) >> 1) * CELL_COLS + (x >> 1);

export const isBlocked = (game, x, y) => game.cells[cellIndex(x, y)] !== 0;

const step1 = (x, y, dir) => {
  switch (dir) {
    case DIR.UP: return { x, y: y - 1 < Y_MIN ? Y_MAX : y - 1 };
    case DIR.DOWN: return { x, y: y + 1 > Y_MAX ? Y_MIN : y + 1 };
    case DIR.RIGHT: return { x: (x + 1) & 0xff, y };
    default: return { x: (x - 1) & 0xff, y };
  }
};

/** Position after one move: two single-pixel steps. */
export const moveFrom = (x, y, dir) => {
  const half = step1(x, y, dir);
  return step1(half.x, half.y, dir);
};
