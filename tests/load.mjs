// Loads the game scripts in the same order as index.html (minus the browser entry point).
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)]
  .map(([, src]) => src)
  .filter((src) => src !== 'src/app/main.js');

for (const src of scripts) {
  vm.runInThisContext(readFileSync(new URL(src, root), 'utf8'), { filename: src });
}

export const LB = globalThis.LazerBykes;
