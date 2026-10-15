# Lazer Bykes

Browser remake of the 1985 MSX light-cycle game *Lazer Bykes* (D. Ritchie for P.S.S.).
Game rules and sound behaviour come from an analysis of the original
(`docs/original-analysis.md`); all graphics are newly drawn.

## Play

Double-click `index.html`. No server, npm or install needed.

| Key | Action |
| --- | --- |
| Arrow keys | Left bike (player 1) |
| W A S D | Right bike (player 2) |
| P | Pause |
| Esc | Back to the menu |
| Space / Enter | Play again after game over |

Menu: **S** start, **I** instructions, **B** border, **C** computer plays the left bike,
**O** obstacles, **F** fast speed.

## Tests

Requires Node.js 20+:

```sh
node --test "tests/*.test.mjs"
```
