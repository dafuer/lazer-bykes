// Browser entry point: screens, keyboard, game loop and sound.
(function (LB) {
  'use strict';

  const { setInput } = LB.game;
  const { steerFor } = LB.keyboard;
  const { Sound } = LB.sound;
  const { Renderer } = LB.renderer;
  const { defaultSettings, menuKey } = LB.menu;
  const { createMatch, restart, togglePause, update } = LB.match;
  const { instructionsLines, menuLines } = LB.screens;

  const BLINK_MS = 400;
  const GAME_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

  const renderer = new Renderer(document.getElementById('screen'));
  const sound = new Sound();
  const rng = (n) => Math.floor(Math.random() * n);

  const state = {
    screen: 'title',
    settings: defaultSettings(),
    match: null,
  };

  function goToMenu() {
    sound.silence();
    state.match = null;
    state.screen = 'menu';
  }

  function onKey(event) {
    sound.unlock();
    if (GAME_KEYS.has(event.code)) event.preventDefault();
    if (event.repeat && state.screen !== 'game') return;

    switch (state.screen) {
      case 'title':
        state.screen = 'instructions';
        break;
      case 'instructions':
        state.screen = 'menu';
        break;
      case 'menu': {
        const { action, settings } = menuKey(state.settings, event.key);
        state.settings = settings;
        if (action === 'instructions') state.screen = 'instructions';
        if (action === 'start') {
          state.match = createMatch(state.settings, rng);
          state.screen = 'game';
        }
        break;
      }
      case 'game':
        onGameKey(event);
        break;
      default:
        break;
    }
  }

  function onGameKey(event) {
    const { match } = state;
    if (event.code === 'Escape') return goToMenu();

    if (match.phase === 'over') {
      if (event.code === 'Space' || event.code === 'Enter') restart(match);
      if (event.code === 'KeyM') goToMenu();
      return;
    }
    if (event.code === 'KeyP') {
      play(togglePause(match));
      return;
    }
    const steer = steerFor(event.code, match.game.settings);
    if (steer) setInput(match.game, steer.player, steer.dir);
  }

  function play(events) {
    for (const event of events) {
      if (event.type === 'engine') sound.engine(event.coarse);
      else if (event.type === 'crash') sound.crash();
      else if (event.type === 'silence') sound.silence();
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = now - last;
    last = now;
    const blinkOn = Math.floor(now / BLINK_MS) % 2 === 0;

    switch (state.screen) {
      case 'title':
        renderer.title(blinkOn);
        break;
      case 'instructions':
        renderer.textScreen(instructionsLines());
        break;
      case 'menu':
        renderer.textScreen(menuLines(state.settings, blinkOn));
        break;
      case 'game':
        play(update(state.match, dt));
        if (state.match) renderer.match(state.match);
        break;
      default:
        break;
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('keydown', onKey);
  requestAnimationFrame(frame);
})(globalThis.LazerBykes ??= {});
