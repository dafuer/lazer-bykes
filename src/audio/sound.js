// Web Audio adapter: two square-wave tones and one noise channel, mixed like the PSG.
import {
  CRASH_DECAY_SECONDS, NOISE_RATE, TONE_A_VOLUME, TONE_B_VOLUME,
  decayCurve, engineFrequencies, volumeAmplitude,
} from './psg.js';

const MASTER_VOLUME = 0.12;

export class Sound {
  #ctx = null;
  #toneA = null;
  #toneB = null;
  #gainA = null;
  #gainB = null;
  #gainNoise = null;
  #engineOn = false;

  /** Must run inside a user gesture (browsers block audio until then). */
  unlock() {
    if (this.#ctx) {
      if (this.#ctx.state === 'suspended') this.#ctx.resume();
      return;
    }
    const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(ctx.destination);

    const channel = () => {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(master);
      return gain;
    };
    this.#gainA = channel();
    this.#gainB = channel();
    this.#gainNoise = channel();

    this.#toneA = ctx.createOscillator();
    this.#toneB = ctx.createOscillator();
    for (const [osc, gain] of [[this.#toneA, this.#gainA], [this.#toneB, this.#gainB]]) {
      osc.type = 'square';
      osc.connect(gain);
      osc.start();
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx);
    noise.loop = true;
    noise.connect(this.#gainNoise);
    noise.start();

    this.#ctx = ctx;
  }

  /** Mixer 0x9C: both engine tones on, pitch set by the bikes' directions. */
  engine(coarse) {
    if (!this.#ctx) return;
    const now = this.#ctx.currentTime;
    const { a, b } = engineFrequencies(coarse);
    this.#toneA.frequency.setValueAtTime(a, now);
    this.#toneB.frequency.setValueAtTime(b, now);
    if (!this.#engineOn) {
      this.#gainA.gain.setValueAtTime(volumeAmplitude(TONE_A_VOLUME), now);
      this.#gainB.gain.setValueAtTime(volumeAmplitude(TONE_B_VOLUME), now);
      this.#engineOn = true;
    }
  }

  /** Mixer 0x9F: tones off, a single decaying noise burst. */
  crash() {
    if (!this.#ctx) return;
    this.#silenceTones();
    const now = this.#ctx.currentTime;
    const gain = this.#gainNoise.gain;
    gain.cancelScheduledValues(now);
    gain.setValueCurveAtTime(decayCurve(), now, CRASH_DECAY_SECONDS);
  }

  /** Mixer 0xBF: everything muted (pause, menus). */
  silence() {
    if (!this.#ctx) return;
    this.#silenceTones();
    const now = this.#ctx.currentTime;
    this.#gainNoise.gain.cancelScheduledValues(now);
    this.#gainNoise.gain.setValueAtTime(0, now);
  }

  #silenceTones() {
    const now = this.#ctx.currentTime;
    this.#gainA.gain.setValueAtTime(0, now);
    this.#gainB.gain.setValueAtTime(0, now);
    this.#engineOn = false;
  }
}

/** One second of sample-and-hold white noise at the PSG noise rate. */
function noiseBuffer(ctx) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const hold = ctx.sampleRate / NOISE_RATE;
  let level = 1;
  let next = 0;
  for (let i = 0; i < data.length; i++) {
    if (i >= next) {
      level = Math.random() < 0.5 ? -1 : 1;
      next += hold;
    }
    data[i] = level;
  }
  return buffer;
}
