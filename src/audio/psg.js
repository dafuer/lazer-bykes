// AY-3-8910 model: turns the register values measured in docs/original-analysis.md
// ("Sound") into frequencies and amplitudes for the Web Audio adapter.
export const CLOCK = 3579545;

const TONE_B_PERIOD = 0xf00;
const NOISE_PERIOD = 31;
const ENVELOPE_PERIOD = 0x3000;

export const TONE_A_VOLUME = 15;
export const TONE_B_VOLUME = 9;

export const toneFrequency = (period) => CLOCK / (16 * period);

/** Engine tones for a coarse period on tone A (fine period is always 0). */
export const engineFrequencies = (coarse) => ({
  a: toneFrequency(coarse * 256),
  b: toneFrequency(TONE_B_PERIOD),
});

/** Amplitude of a 4-bit PSG volume level (3 dB per step, 0 is silent). */
export const volumeAmplitude = (level) => (level <= 0 ? 0 : 2 ** ((level - 15) / 2));

export const NOISE_RATE = CLOCK / (16 * NOISE_PERIOD);

/** Envelope shape 0: one decay from 15 to 0, then silence. */
export const CRASH_DECAY_SECONDS = (256 * ENVELOPE_PERIOD) / CLOCK;

export const decayCurve = () =>
  Array.from({ length: 16 }, (_, step) => volumeAmplitude(15 - step));
