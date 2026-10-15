# Project rules

- Plain ES modules, no build step and no runtime dependencies.
- `src/core` is pure game logic: no DOM, no Web Audio, no timers, no `Math.random` (inject an RNG).
- `src/render`, `src/audio`, `src/input` and `src/app` are adapters around the core.
- Behaviour must match `docs/original-analysis.md`; any deviation is listed there.
- Never commit or embed graphics, fonts, music or code taken from the original game; all assets are original.
- Every rule in the core has a `node:test` test in `tests/`.
