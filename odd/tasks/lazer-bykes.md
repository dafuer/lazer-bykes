# Feature: lazer-bykes browser remake

Objective: faithful HTML5 remake of the MSX game Lazer Bykes, behaviour per `docs/original-analysis.md`.
Branch: `feat/lazer-bykes-remake` · Delivery: ask-on-risk · Test runner: `node --test tests/` (`npm test`).

## Specs

- **S1** — "una versión que corra en un navegador del historico juego de MSX lazer bikes" … "un buen clon en HTML". Static HTML + ES modules, no build step; opens from a local static server.
- **S2** — "Quiero hacer una copia exacta, incluyendo hasta sonidos." Gameplay rules, coordinates, timing, options, scoring and PSG sound behaviour match `docs/original-analysis.md`. Graphics and sound are newly made in the original's style (assumption: original assets are not reused; agreed constraint).
- **S3** — "Las teclas deben ser las flechas para el jugador 1 y el awsd para el jugador 2." Assumption: player 1 = left bike (listed first in the original and replaced by the computer), player 2 = right bike.
- **S4** — "quiero que hagas ingenieria inversa de ese fichero para hacer un buen clon en HTML". The analysis lives in `docs/original-analysis.md`; the original media is never committed (`.gitignore`).
- **S5** — "Quiero programarlo con gentle-ai". ODD workflow, test-first core, work-unit commits reviewed by gga.

## Tasks

| ID | Specs | Route | Status | Evidence |
| --- | --- | --- | --- | --- |
| T1 | S2, S4 | inline | done | `docs/original-analysis.md` |
| T2 | S2 | inline | done (RED: module missing → GREEN 20 tests) | Core rules: movement, wrap, collision, turns, alternation, border, obstacles, races, scoring, game over |
| T3 | S2 | inline | done (4 tests) | Computer player |
| T4 | S2 | inline | done (RED: module missing → GREEN 5 tests) | PSG sound model + Web Audio adapter |
| T5 | S1, S2, S3 | inline | done (RED: modules missing → GREEN 13 tests; offscreen screenshots checked) | Renderer, original pixel art, keyboard input, screens (title, instructions, menu, game), game loop |

## Log

- **L1** (2026-10-15) — User request: "quiero hacer una versión que corra en un navegador del historico juego de MSX lazer bikes. … Quiero hacer una copia exacta, incluyendo hasta sonidos. Las teclas deben ser las flechas para el jugador 1 y el awsd para el jugador 2. Quiero programarlo con gentle-ai ¿cómo lo hacemos?"
- **L2** (2026-10-15) — User: "quiero que hagas ingenieria inversa de ese fichero para hacer un buen clon en HTML".
- **L3** — Disk image holds a BASIC menu and a 2.5 KB Z80 engine; disassembled with z80dasm outside the repo. Findings recorded in `docs/original-analysis.md`. Timing values are estimates from cycle counts and need calibration against WebMSX.
- **L4** — Decision: no extracted assets (title picture, sprites, tiles, font) are reused; all are redrawn. Key redefinition menu entries dropped because fixed controls were requested.
- **L5** (2026-10-15) — User: "lo estás haciendo siguiendo gentle-ai". Confirmed ODD flow; this document created before the first source write.
- **L6** — gga could not read `.gga` under macOS bash 3.2 (`source <(...)` loads nothing); fixed by installing Homebrew bash 5. gga review then rejected the core commit for a missing neutral-input test; fixed before committing.
- **L7** — Pending: manual playtest in a browser and timing calibration against WebMSX.
- **L8** (2026-10-15) — User: "funciona a 1 jugador?" / "la cabeza de la moto es más grande que la original" / "ralentizalo un 5%". Answer: yes, menu option C. Bike sprite redrawn at the original's measured size (3×8, own design). Half-step 12.5/7 ms → 13.125/7.35 ms. Tests: RED 2 → GREEN 43.
