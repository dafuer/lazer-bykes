// Text for the instructions and menu screens (39-column text mode).
(function (LB) {
  'use strict';

  const { COLOR } = LB.palette;

  const header = [
    { col: 9, row: 0, text: '-------------', color: COLOR.BORDER },
    { col: 9, row: 1, text: ' LAZER BYKES ' },
    { col: 9, row: 2, text: '-------------', color: COLOR.BORDER },
  ];

  const instructionsLines = () => [
    ...header,
    { col: 1, row: 5, text: 'INSTRUCTIONS:' },
    { col: 1, row: 7, text: 'TRAP YOUR RIVAL: MAKE THEM CRASH INTO' },
    { col: 1, row: 8, text: 'A TRAIL OR A WALL. THE FIRST TO WIN' },
    { col: 1, row: 9, text: '10 RACES WINS THE GAME.' },
    { col: 1, row: 11, text: 'LEFT PLAYER:  ARROW KEYS', color: COLOR.LEFT_BIKE },
    { col: 1, row: 12, text: 'RIGHT PLAYER: W A S D', color: COLOR.RIGHT_BIKE },
    { col: 1, row: 14, text: 'THE COMPUTER CAN TAKE THE LEFT BIKE' },
    { col: 1, row: 15, text: '(MENU OPTION C): THEN THE ARROWS' },
    { col: 1, row: 16, text: 'STEER YOUR RIGHT BIKE.' },
    { col: 1, row: 18, text: 'P PAUSES. ESC GOES BACK TO THE MENU.' },
    { col: 1, row: 23, text: 'PRESS ANY KEY TO CONTINUE' },
  ];

  const onOff = (value) => (value ? 'ON ' : 'OFF');

  const menuLines = (settings, cursorOn) => [
    ...header,
    { col: 1, row: 3, text: 'MENU' },
    { col: 6, row: 4, text: 'S START GAME' },
    { col: 6, row: 6, text: 'I SEE INSTRUCTIONS' },
    { col: 6, row: 8, text: 'B BORDER ON/OFF' },
    { col: 6, row: 10, text: 'C COMPUTER PLAYER ON/OFF' },
    { col: 6, row: 12, text: 'O OBSTACLES ON/OFF' },
    { col: 6, row: 14, text: 'F FAST SPEED ON/OFF' },
    { col: 1, row: 8, text: onOff(settings.border) },
    { col: 1, row: 10, text: onOff(settings.computer) },
    { col: 1, row: 12, text: onOff(settings.obstacles) },
    { col: 1, row: 14, text: onOff(settings.fast) },
    { col: 1, row: 22, text: `ENTER OPTION: ${cursorOn ? '_' : ' '}` },
  ];

  LB.screens = {
    instructionsLines,
    menuLines,
  };
})(globalThis.LazerBykes ??= {});
