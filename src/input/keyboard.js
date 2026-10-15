// Keyboard mapping. Player 1 (left bike): arrow keys. Player 2 (right bike): W A S D.
// Against the computer (which drives the left bike) the arrows steer the human's right bike.
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

  /**
   * @param {string} code KeyboardEvent.code
   * @param {{computer?: boolean}} [settings]
   */
  const steerFor = (code, settings = {}) => {
    const steer = STEER[code] ?? null;
    if (steer && settings.computer && steer.player === LEFT) return { ...steer, player: RIGHT };
    return steer;
  };

  LB.keyboard = {
    steerFor,
  };
})(globalThis.LazerBykes ??= {});
