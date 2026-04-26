import { sampleOnGrid, toFiniteNumber } from "./signals.js";

export const GIBBS_OVERSHOOT_RATIO = 0.08949;

export function oddHarmonics(count) {
  const safeCount = Math.max(1, Math.round(toFiniteNumber(count, 1)));
  return Array.from({ length: safeCount }, (_, index) => (2 * index) + 1);
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

