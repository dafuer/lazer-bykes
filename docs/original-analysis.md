# Lazer Bykes (MSX, 1985) — behavioural analysis

Reference: *Lazer Bykes*, D. Ritchie for Personal Software Services, 1985 (MSX1, disk release).
This document records **how the original behaves**, derived by disassembling its game loop.
It contains measurements and rules only. No graphics, fonts, music, text art or code from the
original are reproduced in this repository; every asset in the remake is newly drawn.

## Disk layout

| File | Role |
| --- | --- |
| `AUTOEXEC.BAS` / `LLAZER` | Boot chain; shows a title picture, then runs the menu program. |
| `LASERB.SCR` | Full-screen title picture (SCREEN 2 dump). **Not used.** |
| `LAZER.BAS` | Credits, instructions and options menu (BASIC, SCREEN 0). |
| `LAZER1` | 2.5 KB Z80 game engine, loaded at `&HBBFE`, entry `&HBC00`. |

## Display

- MSX1 Graphic 2 (256×192 bitmap) during play; menus use 39-column text mode, dark yellow on black.
- TMS9918 palette. Colours used: left bike **6** (dark red), right bike **12** (dark green),
  border **7** (cyan), obstacles **13** (magenta), score text **10** (dark yellow), background black.
- Trails are single pixels plotted at the bike head on every move. Bikes advance 2 px per move,
  so trails look like dotted lines on a 2-px lattice. The left bike always sits on even
  coordinates, the right bike on odd ones, so the two trails never share a pixel.
- Bikes are 8×8 sprites centred on the head (offset −4,−4), one image per direction.
- A crash plays an 8-frame 16×16 explosion sprite centred on the head (offset −8,−8).
- Text row 23 (y 184–191) shows the score line: left score at column 8 (left colour),
  "- SCORES -" in dark yellow, right score at column 24 (right colour).

## Coordinates and collision map

- `x` runs 0–255 and wraps around (byte overflow).
- `y` runs 1–182 and wraps: moving up from 1 goes to 182, moving down from 182 goes to 1.
- Collision uses a map of 2×2-pixel cells: `cell = ((y + 1) >> 1) * 128 + (x >> 1)`.
  A move into a non-empty cell is a crash; otherwise the cell is claimed by the bike.
- Directions use joystick codes: 1 up, 3 right, 5 down, 7 left.

## Starting state (every race)

| Bike | Direction | x | y |
| --- | --- | --- | --- |
| Left | 3 (right) | 40 | 32 |
| Right | 7 (left) | 223 | 151 |

## Game loop

- Each loop iteration moves **only one bike**, alternating right, left, right, left…
  (the right bike moves first). After each move the engine busy-waits.
- Busy-wait length is `speed × 256` iterations of a 16 T-state loop: speed 10 (normal) or
  5 (fast). Including game logic this is roughly 12.5 ms (normal) / 7 ms (fast) per
  half-step, so each bike moves every ~25 ms / ~14 ms. *Estimated from cycle counts; to be
  calibrated against an emulator.*
- Input is latched: the last non-neutral direction read for each player is remembered, even
  after the key is released. Diagonals snap clockwise (up-right → right, and so on).
- A latched direction is applied when that bike moves, and only if it is perpendicular to the
  current direction. Reversing is impossible; the request is simply ignored.
- When both bikes aim at the same cell, the one that moves second crashes.

## Options (menu)

| Key | Option | Default |
| --- | --- | --- |
| B | Border on/off | on |
| C | Computer controls the left bike | off |
| O | Obstacles on/off | off |
| F | Fast speed | off |
| S | Start game | |
| I | Instructions | |

### Border

Drawn as a cyan frame over tile columns 1–31 and tile rows 0–22. It blocks map cell row 3 and
row 88 completely, and on rows 4–87 the cells with `x < 16` and `x ≥ 248`.
Without the border the field wraps on both axes.

### Obstacles

Three 16×16 blocks per race, each at tile column `6 + rand(16)` and tile row `4 + rand(12)`.
A block at tile (`c`, `r`) blocks cell rows `4r…4r+7` and cell columns `4c…4c+7`.
Blocks may overlap each other.

### Computer player

Replaces the left player. Before each of its moves:

1. If the cell one move straight ahead is free, keep going.
2. Otherwise, if turning right is blocked, turn left (even if left is blocked too).
3. Otherwise, if turning left is blocked, turn right.
4. Otherwise both sides are free: pick one at random.

## Races and scoring

1. On a crash, the engine sound stops and a decaying noise burst plays. The explosion
   animation runs 8 frames of ~110 ms.
2. The **other** player scores a point and the score line updates.
3. Below 10 points: wait ~0.5 s, clear the field, redraw border and new obstacles, reset both
   bikes and their latched inputs, and start the next race.
4. At 10 points the score shows "10" and a game-over message appears in the winner's colour:
   which side won, then "press SPACE or FIRE to play" and "M for Menu".
   SPACE/FIRE starts a new game with the same options; M returns to the menu.

The STOP key toggles pause, muting the sound while paused.

## Sound (AY-3-8910 PSG, 3.579545 MHz)

| Register state | Meaning |
| --- | --- |
| Game start | All channels muted (mixer `0xBF`). Tone A volume 15, tone B volume 9, noise period 31, envelope period `0x3000`. |
| Engine (each left-bike move) | Mixer `0x9C`: tone A and tone B on. Tone A coarse period = `(dirLeft + dirRight) / 2 + 2` (3–9, fine 0). Tone B fixed period `0xF00`. |
| Crash | Mixer `0x9F`: tones off, noise on channel C, channel C on envelope shape 0 (single decay). |
| Pause | Mixer `0xBF` (mute); unpause restores `0x9C`. |

Derived values: tone frequency = 3579545 / (16 × period). Tone A ranges ~97–291 Hz depending on
both bikes' directions; tone B is a constant ~58 Hz drone. The crash noise decays over
~0.88 s (256 × 0x3000 / 3579545).

## Deviations in the remake

| Original | Remake | Reason |
| --- | --- | --- |
| Left: Q/A/CTRL/SHIFT or joystick 1; right: cursor keys or joystick 2 | Player 1 (left bike): arrow keys. Player 2 (right bike): W/A/S/D | Requested controls |
| Keys can be redefined (U/R/D/L menu entries) | Not offered | Fixed controls requested |
| STOP pauses | P pauses | No STOP key on PC keyboards |
| A game can only be left at game over (M) | Esc returns to the menu at any time; M still works at game over | Convenience in a browser tab |
| Text screens in a single colour (dark yellow) | Header rule in cyan; player control lines in each bike's colour | Readability: ties each control set to its bike |
| Engine runs as fast as the busy-wait allows | Movement catch-up is capped at 250 ms per frame | A hidden browser tab must not fast-forward the race |
| SPACE or joystick fire restarts | SPACE or Enter | No joystick |
| Title picture, sprites, font, border and obstacle tiles | Newly drawn | Original assets are not reused |
| Publisher credits screen | Tribute credits screen | Not our publication |
