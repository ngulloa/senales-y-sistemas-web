import { sampleOnGrid, toFiniteNumber } from "./signals.js";

export const GIBBS_OVERSHOOT_RATIO = 0.08949;

export function oddHarmonics(count) {
  const safeCount = Math.max(0, Math.round(toFiniteNumber(count, 1)));
  return Array.from({ length: safeCount }, (_, index) => (2 * index) + 1);
}

export function naturalHarmonics(count) {
  const safeCount = Math.max(0, Math.round(toFiniteNumber(count, 1)));
  return Array.from({ length: safeCount }, (_, index) => index + 1);
}

export function fundamentalFrequency(period) {
  const safePeriod = Math.max(Math.abs(toFiniteNumber(period, 2)), 1e-9);
  return 1 / safePeriod;
}

export function squareWaveSeriesValue(
  t,
  { harmonics = 5, period = 2, amplitude = 1 } = {},
) {
  const u0 = fundamentalFrequency(period);
  const harmonicList = oddHarmonics(harmonics);
  const sum = harmonicList.reduce(
    (accumulator, harmonic) => accumulator + (Math.sin(2 * Math.PI * harmonic * u0 * t) / harmonic),
    0,
  );
  return ((4 * amplitude) / Math.PI) * sum;
}

export function squareWaveSeriesApproximation(grid, parameters) {
  return sampleOnGrid(grid, (time) => squareWaveSeriesValue(time, parameters));
}

export function sawtoothSeriesValue(
  t,
  { terms = 5, period = 2, amplitude = 1 } = {},
) {
  const u0 = fundamentalFrequency(period);
  const harmonicList = naturalHarmonics(terms);
  const sum = harmonicList.reduce(
    (accumulator, harmonic) => accumulator + (((-1) ** (harmonic + 1)) / harmonic) * Math.sin(2 * Math.PI * harmonic * u0 * t),
    0,
  );
  return ((2 * amplitude) / Math.PI) * sum;
}

export function sawtoothSeriesApproximation(grid, parameters) {
  return sampleOnGrid(grid, (time) => sawtoothSeriesValue(time, parameters));
}

export function triangleWaveSeriesValue(
  t,
  { terms = 5, period = 2, amplitude = 1 } = {},
) {
  const u0 = fundamentalFrequency(period);
  const harmonicList = oddHarmonics(terms);
  const sum = harmonicList.reduce(
    (accumulator, harmonic) => accumulator + (Math.cos(2 * Math.PI * harmonic * u0 * t) / (harmonic ** 2)),
    0,
  );
  return ((8 * amplitude) / (Math.PI ** 2)) * sum;
}

export function triangleWaveSeriesApproximation(grid, parameters) {
  return sampleOnGrid(grid, (time) => triangleWaveSeriesValue(time, parameters));
}
