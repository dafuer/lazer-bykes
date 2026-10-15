// Original sprite art: an 8x8 light-bike seen from above and a procedural 16x16 explosion.
(function (LB) {
  'use strict';

  const { DIR, EXPLOSION_FRAMES } = LB.game;

  // Facing up, 3x8 and centred on column 4 (the trail): wheel tip, handlebars, frame, wide rear.
  const BIKE_UP = [0x08, 0x1c, 0x08, 0x08, 0x08, 0x08, 0x1c, 0x1c];

  const toGrid = (rows) => rows.map((row) => Array.from({ length: 8 }, (_, x) => (row >> (7 - x)) & 1));
  const rotateClockwise = (grid) => grid.map((_, y) => grid.map((_, x) => grid[grid.length - 1 - x][y]));

  const up = toGrid(BIKE_UP);
  const right = rotateClockwise(up);
  const down = rotateClockwise(right);
  const left = rotateClockwise(down);

  const BIKE = { [DIR.UP]: up, [DIR.RIGHT]: right, [DIR.DOWN]: down, [DIR.LEFT]: left };

  function explosionFrame(frame) {
    const grid = Array.from({ length: 16 }, () => new Array(16).fill(0));
    const plot = (x, y) => {
      const px = Math.round(x);
      const py = Math.round(y);
      if (px >= 0 && px < 16 && py >= 0 && py < 16) grid[py][px] = 1;
    };
    if (frame < 2) {
      for (let y = 6; y <= 9; y++) for (let x = 6; x <= 9; x++) plot(x, y);
    }
    const radius = 1.5 + frame * 0.9;
    for (let k = 0; k < 16; k++) {
      if (frame >= 5 && k % 2 === 1) continue;
      const angle = (k / 16) * Math.PI * 2 + frame * 0.2;
      const reach = radius * (1 + ((k * 7) % 3) * 0.15);
      plot(7.5 + Math.cos(angle) * reach, 7.5 + Math.sin(angle) * reach);
      if (frame < 4) plot(7.5 + Math.cos(angle) * reach * 0.6, 7.5 + Math.sin(angle) * reach * 0.6);
    }
    return grid;
  }

  const EXPLOSION = Array.from({ length: EXPLOSION_FRAMES }, (_, f) => explosionFrame(f));

  // 16x16 obstacle block: outlined, with a 2-pixel checker inside.
  const OBSTACLE = Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => {
    if (x === 0 || y === 0 || x === 15 || y === 15) return 1;
    if (x === 1 || y === 1 || x === 14 || y === 14) return 0;
    return ((x >> 1) + (y >> 1)) % 2;
  }));

  LB.sprites = {
    BIKE,
    EXPLOSION,
    OBSTACLE,
  };
})(globalThis.LazerBykes ??= {});
