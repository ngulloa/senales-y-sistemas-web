import { buildSinusoid, sinusoidValue, toFiniteNumber } from "./signals.js";

const EPSILON = 1e-9;

export function createSampleTimes({ start, end, sampleRate }) {
  const safeStart = toFiniteNumber(start, 0);
  const safeEnd = toFiniteNumber(end, 1);
  const safeRate = Math.max(toFiniteNumber(sampleRate, 1), EPSILON);
  const step = 1 / safeRate;
  const sampleCount = Math.max(2, Math.floor(((safeEnd - safeStart) / step) + EPSILON) + 1);
  return Array.from({ length: sampleCount }, (_, index) => safeStart + index * step);
}

export function sampleSinusoid({
  start = 0,
  end = 1,
  sampleRate = 8,
  amplitude = 1,
  frequency = 1,
  phase = 0,
  bias = 0,
  timeShift = 0,
} = {}) {
  const times = createSampleTimes({ start, end, sampleRate });
  const values = times.map((time) => sinusoidValue(time, {
    amplitude,
    frequency,
    phase,
    bias,
    timeShift,
  }));
  return { times, values };
}

export function buildAliasCurve(grid, {
  amplitude = 1,
  signalFrequency = 1,
  sampleRate = 8,
  phase = 0,
  bias = 0,
} = {}) {
  const signedAliasFrequency = estimateSignedAliasFrequency(signalFrequency, sampleRate);
  return buildSinusoid(grid, {
    amplitude,
    frequency: signedAliasFrequency,
    phase,
    bias,
  });
}

export function estimateSignedAliasFrequency(signalFrequency, sampleRate) {
  const safeFrequency = toFiniteNumber(signalFrequency, 0);
  const safeRate = Math.max(toFiniteNumber(sampleRate, 1), EPSILON);
  return safeFrequency - (Math.round(safeFrequency / safeRate) * safeRate);
}

export function estimateAliasFrequency(signalFrequency, sampleRate) {
  return Math.abs(estimateSignedAliasFrequency(signalFrequency, sampleRate));
}

export function nyquistSatisfied(signalFrequency, sampleRate) {
  return Math.abs(toFiniteNumber(signalFrequency, 0)) <= (toFiniteNumber(sampleRate, 1) / 2) + EPSILON;
}

