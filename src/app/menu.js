// Options menu: S start, I instructions, B/C/O/F toggle border, computer, obstacles, fast.
const TOGGLES = { B: 'border', C: 'computer', O: 'obstacles', F: 'fast' };
const ACTIONS = { S: 'start', I: 'instructions' };

export const defaultSettings = () => ({ border: true, computer: false, obstacles: false, fast: false });

/** @returns {{action: 'start'|'instructions'|null, settings: object}} */
export function menuKey(settings, key) {
  const upper = key.toUpperCase();
  const option = TOGGLES[upper];
  if (option) return { action: null, settings: { ...settings, [option]: !settings[option] } };
  return { action: ACTIONS[upper] ?? null, settings };
}
