import test from 'node:test';
import assert from 'node:assert/strict';
import { LB } from './load.mjs';

const {
  toneFrequency, engineFrequencies, volumeAmplitude, CRASH_DECAY_SECONDS, NOISE_RATE, decayCurve,
} = LB.psg;

const close = (actual, expected, digits = 1) =>
  assert.equal(actual.toFixed(digits), expected.toFixed(digits));

test('a tone period maps to the AY-3-8910 frequency at 3.579545 MHz', () => {
  close(toneFrequency(768), 291.3);
});

test('the engine tone A follows the coarse period, tone B is a fixed ~58 Hz drone', () => {
  const { a, b } = engineFrequencies(7);
  close(a, 124.8);
  close(b, 58.3);
  close(engineFrequencies(3).a, 291.3);
  close(engineFrequencies(9).a, 97.1);
});

test('PSG volume levels are logarithmic, 3 dB per step', () => {
  assert.equal(volumeAmplitude(15), 1);
  assert.equal(volumeAmplitude(9), 0.125);
  assert.equal(volumeAmplitude(0), 0);
});

test('the crash noise decays once over about 0.88 seconds at ~7.2 kHz', () => {
  close(CRASH_DECAY_SECONDS, 0.88, 2);
  close(NOISE_RATE, 7216.8);
});

test('the crash envelope steps from full volume down to silence in 16 levels', () => {
  const curve = decayCurve();
  assert.equal(curve.length, 16);
  assert.equal(curve[0], 1);
  assert.equal(curve[15], 0);
  assert.ok(curve.every((v, i) => i === 0 || v < curve[i - 1]));
});
