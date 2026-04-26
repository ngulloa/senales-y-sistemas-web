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
    legend: {
      orientation: "h",
      x: 0,
      y: 1.04,
      xanchor: "left",
      font: {
        size: 12,
      },
      bgcolor: "rgba(255,255,255,0.7)",
    },
    margin: {
      l: 62,
      r: 24,
      t: 28,
      b: 58,
    },
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
