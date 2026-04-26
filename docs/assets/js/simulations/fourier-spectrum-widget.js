import {
  fundamentalFrequency,
  sawtoothSeriesApproximation,
  squareWaveSeriesApproximation,
  triangleWaveSeriesApproximation,
} from "../core/fourier.js";
import {
  buildSawtoothWave,
  buildSquareWave,
  buildTriangleWave,
  createTimeGrid,
} from "../core/signals.js";
import { lineTrace, renderPlot, THEME } from "../core/plotting.js";
import { formatNumber, onDomReady, renderLatex, requireElements } from "../core/ui.js";

const PERIOD = 2;
const WINDOW_START = -4;
const WINDOW_END = 4;
const GRID_COUNT = 2200;
const ZERO_MEAN = 0;

const WAVEFORMS = {
  square: {
    label: "Cuadrada impar",
    mean: ZERO_MEAN,
    ideal: (grid) => buildSquareWave(grid, { period: PERIOD, amplitude: 1 }),
    approximation: (grid, order) => squareWaveSeriesApproximation(grid, {
      harmonics: order,
      period: PERIOD,
      amplitude: 1,
    }),
    formula: (order) => (
      order === 0
        ? "x_0(t)=0"
        : `x_N(t)=\\frac{4}{\\pi}\\sum_{m=0}^{${order - 1}}\\frac{1}{2m+1}\\sin\\!\\left(2\\pi(2m+1)u_0t\\right)`
    ),
    harmonics: (order) => (order === 0 ? "solo media" : `${order} impares`),
    summary: (order) => (
      order === 0
        ? "La cuadrada elegida tiene media cero, así que la aproximación inicial es nula."
        : `La cuadrada usa solo armónicos impares. Con N = ${order}, la suma parcial ya capta bien la alternancia entre niveles, aunque cerca de los saltos persiste la sobreoscilación característica.`
    ),
  },
  sawtooth: {
    label: "Diente de sierra impar",
    mean: ZERO_MEAN,
    ideal: (grid) => buildSawtoothWave(grid, { period: PERIOD, amplitude: 1 }),
    approximation: (grid, order) => sawtoothSeriesApproximation(grid, {
      terms: order,
      period: PERIOD,
      amplitude: 1,
    }),
    formula: (order) => (
      order === 0
        ? "x_0(t)=0"
        : `x_N(t)=\\frac{2}{\\pi}\\sum_{n=1}^{${order}}\\frac{(-1)^{n+1}}{n}\\sin\\!\\left(2\\pi nu_0t\\right)`
    ),
    harmonics: (order) => (order === 0 ? "solo media" : `todos hasta n=${order}`),
    summary: (order) => (
      order === 0
        ? "El diente de sierra impar también tiene media cero, por eso la suma parcial comienza en cero."
        : `El diente de sierra reparte energía en todos los armónicos. Con N = ${order}, la pendiente principal aparece rápido, pero el salto periódico sigue necesitando muchos términos para refinarse.`
    ),
  },
  triangle: {
    label: "Triangular par",
    mean: ZERO_MEAN,
    ideal: (grid) => buildTriangleWave(grid, { period: PERIOD, amplitude: 1 }),
    approximation: (grid, order) => triangleWaveSeriesApproximation(grid, {
      terms: order,
      period: PERIOD,
      amplitude: 1,
    }),
    formula: (order) => (
      order === 0
        ? "x_0(t)=0"
        : `x_N(t)=\\frac{8}{\\pi^2}\\sum_{m=0}^{${order - 1}}\\frac{1}{(2m+1)^2}\\cos\\!\\left(2\\pi(2m+1)u_0t\\right)`
    ),
    harmonics: (order) => (order === 0 ? "solo media" : `${order} impares en coseno`),
    summary: (order) => (
      order === 0
        ? "La triangular par usada aquí tiene media cero y máximo en t = 0, así que la primera aproximación también es nula."
        : `La triangular par usa solo armónicos impares y sus coeficientes decrecen como 1/n^2. Por eso, con N = ${order}, suele reconstruirse más rápido que la cuadrada o el diente de sierra.`
    ),
  },
};

function buildApproximation(grid, waveform, order) {
  if (order === 0) {
    return grid.map(() => waveform.mean);
  }

  return waveform.approximation(grid, order);
}

function updateWidget(elements) {
  const waveform = WAVEFORMS[elements.waveform.value] ?? WAVEFORMS.square;
  const order = Math.max(0, Math.min(20, Math.round(Number(elements.order.value))));
  const u0 = fundamentalFrequency(PERIOD);
  const grid = createTimeGrid({
    start: WINDOW_START,
    end: WINDOW_END,
    count: GRID_COUNT,
  });

  elements.order.value = String(order);
  elements.orderValue.textContent = String(order);

  const ideal = waveform.ideal(grid);
  const approximation = buildApproximation(grid, waveform, order);

  renderLatex(
    elements.formula,
    `${waveform.formula(order)},\\quad u_0=${formatNumber(u0, 2)},\\quad T_0=${formatNumber(PERIOD, 2)}`,
  );

  elements.harmonics.textContent = waveform.harmonics(order);
  elements.mean.textContent = formatNumber(waveform.mean, 2);
  elements.period.textContent = `${formatNumber(PERIOD, 2)} u.t.`;
  elements.summary.textContent = waveform.summary(order);

  const traces = [
    lineTrace(grid, ideal, {
      name: `${waveform.label} ideal`,
      line: {
        color: THEME.accentAlt,
        dash: "dot",
        width: 2.5,
      },
    }),
    lineTrace(grid, approximation, {
      name: "Aproximación parcial",
      line: {
        color: THEME.accent,
        width: 3,
      },
    }),
  ];

  renderPlot(elements.plot, traces, {
    title: `Interpretación espectral: ${waveform.label}`,
    xaxis: {
      title: { text: "Tiempo t" },
      range: [WINDOW_START, WINDOW_END],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    yaxis: {
      title: { text: "Amplitud" },
      range: [-1.2, 1.2],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
  });
}

onDomReady(() => {
  const elements = {
    waveform: document.getElementById("fs-spectrum-waveform"),
    order: document.getElementById("fs-spectrum-order"),
    orderValue: document.getElementById("fs-spectrum-order-value"),
    formula: document.getElementById("fs-spectrum-formula"),
    harmonics: document.getElementById("fs-spectrum-harmonics"),
    mean: document.getElementById("fs-spectrum-mean"),
    period: document.getElementById("fs-spectrum-period"),
    summary: document.getElementById("fs-spectrum-summary"),
    plot: document.getElementById("fs-spectrum-plot"),
  };

  if (!requireElements("fourier-spectrum-widget", elements)) {
    return;
  }

  const refresh = () => {
    try {
      updateWidget(elements);
    } catch (error) {
      console.error("[fourier-spectrum-widget] No se pudo actualizar el widget espectral.", error);
    }
  };

  elements.waveform.addEventListener("change", refresh);
  elements.order.addEventListener("input", refresh);

  refresh();
});
