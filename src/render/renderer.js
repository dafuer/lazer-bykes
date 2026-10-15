// Canvas renderer: draws into a 256x192 MSX-sized framebuffer, scaled up by CSS.
(function (LB) {
  'use strict';

  const { LEFT, RIGHT, SCREEN_HEIGHT, SCREEN_WIDTH } = LB.game;
  const { COLOR, PALETTE } = LB.palette;
  const { glyph } = LB.font;
  const { BIKE, EXPLOSION, OBSTACLE } = LB.sprites;

  const BIKE_COLOR = [COLOR.LEFT_BIKE, COLOR.RIGHT_BIKE];
  const SIDE_NAME = ['LEFT', 'RIGHT'];
  // Text mode: 39 columns of 6-pixel cells, centred.
  const TEXT_CELL = 6;
  const TEXT_MARGIN = (SCREEN_WIDTH - 39 * TEXT_CELL) >> 1;

  class Renderer {
    #ctx;
    #image;
    #pixels;

    /** @param {HTMLCanvasElement} canvas */
    constructor(canvas) {
      canvas.width = SCREEN_WIDTH;
      canvas.height = SCREEN_HEIGHT;
      this.#ctx = canvas.getContext('2d');
      this.#image = this.#ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
      this.#pixels = new Uint32Array(this.#image.data.buffer);
    }

    /** Draw a running match. */
    match(match) {
      const { game } = match;
      this.#clear();
      if (game.settings.border) this.#border();
      for (const { col, row } of game.obstacles) this.#sprite(OBSTACLE, col * 8, row * 8, COLOR.OBSTACLE);
      this.#trail(game.trail);

      for (const player of [LEFT, RIGHT]) {
        const bike = game.players[player];
        if (match.explosion?.player === player) {
          const { x, y, frame } = match.explosion;
          this.#sprite(EXPLOSION[frame], x - 8, y - 8, BIKE_COLOR[player], true);
        } else if (match.lastCrash !== player) {
          this.#sprite(BIKE[bike.dir], bike.x - 4, bike.y - 4, BIKE_COLOR[player], true);
        }
      }

      this.#scoreLine(game.scores);
      if (match.phase === 'over') this.#gameOver(match.winner);
      this.#flush();
    }

    /**
     * Draw a 39-column text screen.
     * @param {Array<{col: number, row: number, text: string, color?: number}>} lines
     */
    textScreen(lines) {
      this.#clear();
      for (const { col, row, text, color = COLOR.TEXT } of lines) {
        this.#text(text, TEXT_MARGIN + col * TEXT_CELL, row * 8, color, TEXT_CELL);
      }
      this.#flush();
    }

    /** Original title screen. */
    title(blinkOn) {
      this.#clear();
      this.#frame(4, 4, SCREEN_WIDTH - 5, 139, COLOR.BORDER);
      this.#bigText('LAZER', 16, COLOR.LEFT_BIKE);
      this.#bigText('BYKES', 52, COLOR.RIGHT_BIKE);
      for (let x = 20; x < 124; x += 2) this.#pset(x, 104, COLOR.LEFT_BIKE);
      this.#sprite(BIKE[3], 120, 100, COLOR.LEFT_BIKE, true);
      for (let x = 235; x > 132; x -= 2) this.#pset(x, 117, COLOR.RIGHT_BIKE);
      this.#sprite(BIKE[7], 128, 113, COLOR.RIGHT_BIKE, true);
      this.#centred('A TRIBUTE TO THE 1985 MSX GAME', 18, COLOR.TEXT);
      this.#centred('BY D. RITCHIE FOR P.S.S.', 19, COLOR.TEXT);
      if (blinkOn) this.#centred('PRESS ANY KEY', 22, COLOR.WHITE);
      this.#flush();
    }

    #scoreLine([left, right]) {
      this.#text(String(left), 8 * 8, 184, COLOR.LEFT_BIKE);
      this.#text('- SCORES -', 11 * 8, 184, COLOR.TEXT);
      this.#text(String(right), 24 * 8, 184, COLOR.RIGHT_BIKE);
    }

    #gameOver(winner) {
      const color = BIKE_COLOR[winner];
      this.#text(`${SIDE_NAME[winner]} SIDE WINS - GAME OVER`, 5 * 8, 9 * 8, color, 8, true);
      this.#text('SPACE TO PLAY AGAIN', 5 * 8, 11 * 8, color, 8, true);
      this.#text('M FOR THE MENU', 5 * 8, 12 * 8, color, 8, true);
    }

    #border() {
      // Two thin lines; the inner one sits on the first wall cells.
      this.#frame(14, 6, 248, 175, COLOR.BORDER);
      this.#frame(12, 4, 250, 177, COLOR.BORDER);
    }

    #trail(trail) {
      for (let i = 0; i < trail.length; i++) {
        if (trail[i]) this.#pixels[i] = rgba(BIKE_COLOR[trail[i] - 1]);
      }
    }

    #frame(x0, y0, x1, y1, color, thickness = 1) {
      for (let t = 0; t < thickness; t++) {
        for (let x = x0; x <= x1; x++) {
          this.#pset(x, y0 + t, color);
          this.#pset(x, y1 - t, color);
        }
        for (let y = y0; y <= y1; y++) {
          this.#pset(x0 + t, y, color);
          this.#pset(x1 - t, y, color);
        }
      }
    }

    #sprite(grid, left, top, color, wrap = false) {
      grid.forEach((row, dy) => row.forEach((on, dx) => {
        if (!on) return;
        const x = left + dx;
        const y = top + dy;
        this.#pset(wrap ? x & 0xff : x, y, color);
      }));
    }

    #text(text, left, top, color, cell = 8, opaque = false) {
      [...text].forEach((ch, i) => {
        const x0 = left + i * cell;
        if (opaque) {
          for (let y = 0; y < 8; y++) for (let x = 0; x < cell; x++) this.#pset(x0 + x, top + y, COLOR.BLACK);
        }
        glyph(ch).forEach((bits, dy) => {
          for (let dx = 0; dx < 5; dx++) {
            if (bits & (16 >> dx)) this.#pset(x0 + dx + (cell === 8 ? 1 : 0), top + dy, color);
          }
        });
      });
    }

    #centred(text, row, color) {
      this.#text(text, (SCREEN_WIDTH - text.length * 8) >> 1, row * 8, color);
    }

    #bigText(text, top, color) {
      const scale = 4;
      const width = text.length * 6 * scale;
      const left = (SCREEN_WIDTH - width) >> 1;
      [...text].forEach((ch, i) => {
        glyph(ch).forEach((bits, dy) => {
          for (let dx = 0; dx < 5; dx++) {
            if (!(bits & (16 >> dx))) continue;
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) {
                this.#pset(left + (i * 6 + dx) * scale + sx, top + dy * scale + sy, color);
              }
            }
          }
        });
      });
    }

    #pset(x, y, color) {
      if (x < 0 || x >= SCREEN_WIDTH || y < 0 || y >= SCREEN_HEIGHT) return;
      this.#pixels[y * SCREEN_WIDTH + x] = rgba(color);
    }

    #clear() {
      this.#pixels.fill(rgba(COLOR.BLACK));
    }

    #flush() {
      this.#ctx.putImageData(this.#image, 0, 0);
    }
  }

  const RGBA = PALETTE.map(([r, g, b]) => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0);
  const rgba = (color) => RGBA[color];

  LB.renderer = {
    Renderer,
  };
})(globalThis.LazerBykes ??= {});
