import { createTimeGrid } from "../core/signals.js";
import { lineTrace, renderPlot, THEME } from "../core/plotting.js";
import { onDomReady } from "../core/ui.js";

const TIME_GRID = createTimeGrid({ start: -2.5, end: 2.5, count: 900 });
const FREQ_GRID = createTimeGrid({ start: -3, end: 3, count: 1200 });
const PV_GAP = 0.08;

function heaviside(time) {
  return time < 0 ? 0 : 1;
}

function signum(time) {
  if (time < 0) {
    return -1;
  }
  if (time > 0) {
    return 1;
  }
  return 0;
}

function impulseTraces(items, {
  name = "Impulso ideal",
  color = THEME.accentAlt,
  axis = {},
} = {}) {
  if (!items || items.length === 0) {
    return [];
  }

  const stemsX = [];
  const stemsY = [];
  items.forEach((item) => {
    stemsX.push(item.position, item.position, null);
    stemsY.push(0, item.height, null);
  });

  return [
    {
      type: "scatter",
      mode: "lines",
      x: stemsX,
      y: stemsY,
      line: {
        color,
        width: 2,
      },
      hoverinfo: "skip",
      showlegend: false,
      ...axis,
    },
    {
      type: "scatter",
      mode: "markers",
      x: items.map((item) => item.position),
      y: items.map((item) => item.height),
      marker: {
        color,
        size: 10,
        symbol: "triangle-up",
        line: {
          color: "#ffffff",
          width: 1,
        },
      },
      hovertemplate: `${name}<br>x=%{x:.2f}<extra></extra>`,
      name,
      showlegend: false,
      ...axis,
    },
  ];
}

function renderDeltaOrigin() {
  const container = document.getElementById("dist-delta-origin-plot");
  if (!container) {
    return;
  }

  renderPlot(container, [
    ...impulseTraces([{ position: 0, height: 1 }], {
      name: "Delta de Dirac",
      color: THEME.accentAlt,
    }),
  ], {
    showlegend: false,
    margin: {
      l: 56,
      r: 20,
      t: 18,
      b: 48,
    },
    xaxis: {
      title: { text: "Tiempo t" },
      range: [-2.2, 2.2],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    yaxis: {
      title: { text: "Peso simbólico" },
      range: [0, 1.25],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
  });
}

function renderDeltaShifted() {
  const container = document.getElementById("dist-delta-shifted-plot");
  if (!container) {
    return;
  }

  renderPlot(container, [
    ...impulseTraces([{ position: 1.2, height: 1 }], {
      name: "Delta desplazada",
      color: THEME.success,
    }),
  ], {
    showlegend: false,
    margin: {
      l: 56,
      r: 20,
      t: 18,
      b: 48,
    },
    xaxis: {
      title: { text: "Tiempo t" },
      range: [-2.2, 2.2],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    yaxis: {
      title: { text: "Peso simbólico" },
      range: [0, 1.25],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
  });
}

function renderStepDerivative() {
  const container = document.getElementById("dist-step-derivative-plot");
  if (!container) {
    return;
  }

  const stepValues = TIME_GRID.map((time) => heaviside(time));
  const traces = [
    lineTrace(TIME_GRID, stepValues, {
      name: "Escalón unitario",
      hovertemplate: "t=%{x:.2f}<br>u(t)=%{y:.2f}<extra></extra>",
      line: {
        color: THEME.accent,
        width: 3,
      },
    }),
    ...impulseTraces([{ position: 0, height: 1 }], {
      name: "Derivada distribucional",
      color: THEME.accentAlt,
      axis: {
        xaxis: "x2",
        yaxis: "y2",
      },
    }),
  ];

  renderPlot(container, traces, {
    showlegend: false,
    margin: {
      l: 56,
      r: 20,
      t: 18,
      b: 48,
    },
    grid: {
      rows: 2,
      columns: 1,
      pattern: "independent",
      roworder: "top to bottom",
    },
    xaxis: {
      title: { text: "Tiempo t" },
      range: [-2.2, 2.2],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    yaxis: {
      title: { text: "u(t)" },
      range: [-0.15, 1.25],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    xaxis2: {
      title: { text: "Tiempo t" },
      range: [-2.2, 2.2],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    yaxis2: {
      title: { text: "δ(t)" },
      range: [0, 1.25],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
  });
}

function renderSignPlot() {
  const container = document.getElementById("dist-sign-plot");
  if (!container) {
    return;
  }

  const signValues = TIME_GRID.map((time) => signum(time));
  const regularImaginaryPart = FREQ_GRID.map((frequency) => {
    if (Math.abs(frequency) < PV_GAP) {
      return Number.NaN;
    }
    return -1 / (Math.PI * frequency);
  });

  renderPlot(container, [
    lineTrace(TIME_GRID, signValues, {
      name: "sgn(t)",
      hovertemplate: "t=%{x:.2f}<br>sgn(t)=%{y:.2f}<extra></extra>",
      line: {
        color: THEME.accent,
        width: 3,
      },
    }),
    lineTrace(FREQ_GRID, regularImaginaryPart, {
      name: "Parte regular",
      hovertemplate: "u=%{x:.2f}<br>Im X_reg(u)=%{y:.2f}<extra></extra>",
      line: {
        color: THEME.success,
        width: 2.6,
      },
      xaxis: "x2",
      yaxis: "y2",
    }),
  ], {
    margin: {
      l: 58,
      r: 20,
      t: 18,
      b: 48,
    },
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
    grid: {
      rows: 2,
      columns: 1,
      pattern: "independent",
      roworder: "top to bottom",
    },
    xaxis: {
      title: { text: "Tiempo t" },
      range: [-2.2, 2.2],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    yaxis: {
      title: { text: "sgn(t)" },
      range: [-1.25, 1.25],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    xaxis2: {
      title: { text: "Frecuencia u" },
      range: [-2.6, 2.6],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    yaxis2: {
      title: { text: "Im X_reg(u)" },
      range: [-1.15, 1.15],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
  });
}

function renderTrigSpectrumPlot() {
  const container = document.getElementById("dist-trig-spectrum-plot");
  if (!container) {
    return;
  }

  const u0 = 1.15;
  const traces = [
    ...impulseTraces([
      { position: -u0, height: 1 },
      { position: u0, height: 1 },
    ], {
      name: "Coseno",
      color: THEME.accentAlt,
      axis: {
        xaxis: "x",
        yaxis: "y",
      },
    }),
    ...impulseTraces([
      { position: -u0, height: 1 },
      { position: u0, height: -1 },
    ], {
      name: "Seno",
      color: THEME.success,
      axis: {
        xaxis: "x2",
        yaxis: "y2",
      },
    }),
  ];

  renderPlot(container, traces, {
    showlegend: false,
    margin: {
      l: 58,
      r: 20,
      t: 18,
      b: 48,
    },
    grid: {
      rows: 2,
      columns: 1,
      pattern: "independent",
      roworder: "top to bottom",
    },
    xaxis: {
      title: { text: "Frecuencia u" },
      range: [-2.6, 2.6],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    yaxis: {
      title: { text: "Coseno" },
      range: [0, 1.25],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    xaxis2: {
      title: { text: "Frecuencia u" },
      range: [-2.6, 2.6],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    yaxis2: {
      title: { text: "Seno" },
      range: [-1.25, 1.25],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
  });
}

onDomReady(() => {
  try {
    renderDeltaOrigin();
    renderDeltaShifted();
    renderStepDerivative();
    renderSignPlot();
    renderTrigSpectrumPlot();
  } catch (error) {
    console.error("[distributions-visuals] No se pudieron renderizar las visualizaciones.", error);
  }
});
