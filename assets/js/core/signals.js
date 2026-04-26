const EPSILON = 1e-9;

export function clamp(value, minimum = -Infinity, maximum = Infinity) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function toFiniteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function createTimeGrid({ start, end, count }) {
  const safeStart = toFiniteNumber(start, -1);
  const safeEnd = toFiniteNumber(end, 1);
  const safeCount = Math.max(2, Math.round(toFiniteNumber(count, 200)));
  const step = (safeEnd - safeStart) / (safeCount - 1);
  return Array.from({ length: safeCount }, (_, index) => safeStart + index * step);
}

export function sampleOnGrid(grid, evaluator) {
  return grid.map((point) => evaluator(point));
}

export function sinusoidValue(
  t,
  { amplitude = 1, frequency = 1, phase = 0, bias = 0, timeShift = 0 } = {},
) {
  return amplitude * Math.sin((2 * Math.PI * frequency * (t - timeShift)) + phase) + bias;
}

export function buildSinusoid(grid, parameters) {
  return sampleOnGrid(grid, (time) => sinusoidValue(time, parameters));
}

export function squareWaveValue(
  t,
  { period = 2, amplitude = 1 } = {},
) {
  const safePeriod = Math.max(Math.abs(toFiniteNumber(period, 2)), EPSILON);
  const sine = Math.sin((2 * Math.PI * t) / safePeriod);
  return amplitude * (sine >= 0 ? 1 : -1);
}

export function buildSquareWave(grid, parameters) {
  return sampleOnGrid(grid, (time) => squareWaveValue(time, parameters));
}

function centeredCycles(t, period) {
  const safePeriod = Math.max(Math.abs(toFiniteNumber(period, 2)), EPSILON);
  return (t / safePeriod) - Math.floor((t / safePeriod) + 0.5);
}

export function sawtoothValue(
  t,
  { period = 2, amplitude = 1 } = {},
) {
  return 2 * amplitude * centeredCycles(t, period);
}

export function buildSawtoothWave(grid, parameters) {
  return sampleOnGrid(grid, (time) => sawtoothValue(time, parameters));
}

export function triangleWaveValue(
  t,
  { period = 2, amplitude = 1 } = {},
) {
  return amplitude * (1 - (4 * Math.abs(centeredCycles(t, period))));
}

export function buildTriangleWave(grid, parameters) {
  return sampleOnGrid(grid, (time) => triangleWaveValue(time, parameters));
}
