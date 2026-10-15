// Keyboard mapping. Player 1 (left bike): arrow keys. Player 2 (right bike): W A S D.
(function (LB) {
  'use strict';

  const { DIR, LEFT, RIGHT } = LB.game;

  const STEER = {
    ArrowUp: { player: LEFT, dir: DIR.UP },
    ArrowRight: { player: LEFT, dir: DIR.RIGHT },
    ArrowDown: { player: LEFT, dir: DIR.DOWN },
    ArrowLeft: { player: LEFT, dir: DIR.LEFT },
    KeyW: { player: RIGHT, dir: DIR.UP },
    KeyD: { player: RIGHT, dir: DIR.RIGHT },
    KeyS: { player: RIGHT, dir: DIR.DOWN },
    KeyA: { player: RIGHT, dir: DIR.LEFT },
  };

  /** @param {string} code KeyboardEvent.code */
  const steerFor = (code) => STEER[code] ?? null;

  LB.keyboard = {
    steerFor,
  };
})(globalThis.LazerBykes ??= {});
