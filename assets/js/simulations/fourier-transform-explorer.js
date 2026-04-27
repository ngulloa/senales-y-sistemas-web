import { createTimeGrid } from "../core/signals.js";
import { lineTrace, renderPlot, THEME } from "../core/plotting.js";
import { onDomReady, renderLatex, requireElements, setStatusBanner } from "../core/ui.js";

const TIME_GRID = createTimeGrid({ start: -3, end: 3, count: 1400 });
const FREQ_GRID = createTimeGrid({ start: -3.5, end: 3.5, count: 1800 });
const PHASE_TICKS = {
  tickvals: [-Math.PI, -Math.PI / 2, 0, Math.PI / 2, Math.PI],
  ticktext: ["-π", "-π/2", "0", "π/2", "π"],
};
const PV_GAP = 0.06;

function clipMagnitude(value, limit = 3.4) {
  return Math.min(value, limit);
}

function sincNormalized(value) {
  if (Math.abs(value) < 1e-9) {
    return 1;
  }
  return Math.sin(Math.PI * value) / (Math.PI * value);
}

function trianglePulse(time) {
  return Math.max(1 - Math.abs(time), 0);
}

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

function impulseStemTraces(items, {
  axis = {},
  color = THEME.accentAlt,
  name = "Término impulsivo",
  markerSymbol = "triangle-up",
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
      name,
      showlegend: true,
      ...axis,
    },
    {
      type: "scatter",
      mode: "markers",
      x: items.map((item) => item.position),
      y: items.map((item) => item.height),
      marker: {
        color,
        size: 9,
        symbol: markerSymbol,
        line: {
          color: "#ffffff",
          width: 1,
        },
      },
      hoverinfo: "skip",
      name,
      showlegend: false,
      ...axis,
    },
  ];
}

function symbolicMarkerTrace(items, axis = {}) {
  if (!items || items.length === 0) {
    return [];
  }

  return [
    {
      type: "scatter",
      mode: "markers",
      x: items.map((item) => item.position),
      y: items.map((item) => item.height),
      marker: {
        color: THEME.success,
        size: 10,
        symbol: "diamond",
        line: {
          color: "#ffffff",
          width: 1,
        },
      },
      hoverinfo: "skip",
      name: "Término distribucional",
      showlegend: true,
      ...axis,
    },
  ];
}

function computeRange(values, {
  floor = 0,
  padding = 0.15,
  minimumPadding = 0.25,
} = {}) {
  const finiteValues = values.filter((value) => Number.isFinite(value));
  if (finiteValues.length === 0) {
    return [-1, 1];
  }

  const minimum = Math.min(...finiteValues, floor);
  const maximum = Math.max(...finiteValues, floor);
  const amplitude = Math.max(maximum - minimum, 1);
  const pad = Math.max(minimumPadding, amplitude * padding);
  return [minimum - pad, maximum + pad];
}

function piecewisePhase(grid, positiveValue, negativeValue) {
  return grid.map((frequency) => {
    if (Math.abs(frequency) < PV_GAP) {
      return Number.NaN;
    }
    return frequency > 0 ? positiveValue : negativeValue;
  });
}

const SIGNALS = {
  delta: {
    label: "Delta de Dirac",
    timeFormula: "x(t)=\\delta(t)",
    spectrumFormula: "X(u)=1",
    timeValues: TIME_GRID.map(() => 0),
    timeImpulses: [{ position: 0, height: 1 }],
    magnitude: FREQ_GRID.map(() => 1),
    phase: FREQ_GRID.map(() => 0),
    noteHtml: "<p>El impulso en el tiempo produce una transformada constante. En este caso no aparecen términos distribucionales adicionales en frecuencia.</p>",
  },
  one: {
    label: "Constante uno",
    timeFormula: "x(t)=1",
    spectrumFormula: "X(u)=\\delta(u)",
    timeValues: TIME_GRID.map(() => 1),
    magnitude: [],
    phase: [],
    impulses: [{ position: 0, height: 1 }],
    noteHtml: "<p>La señal constante concentra toda su contribución en \\(u=0\\). La fase no se interpreta como una función ordinaria para una delta aislada.</p>",
  },
  step: {
    label: "Escalón",
    timeFormula: "x(t)=u(t)",
    spectrumFormula: "X(u)=\\operatorname{p.v.}\\!\\left(\\frac{1}{i2\\pi u}\\right)+\\frac{1}{2}\\delta(u)",
    timeValues: TIME_GRID.map((time) => heaviside(time)),
    magnitude: FREQ_GRID.map((frequency) => {
      if (Math.abs(frequency) < PV_GAP) {
        return Number.NaN;
      }
      return clipMagnitude(1 / (2 * Math.PI * Math.abs(frequency)));
    }),
    phase: piecewisePhase(FREQ_GRID, -Math.PI / 2, Math.PI / 2),
    impulses: [{ position: 0, height: 0.5 }],
    noteHtml: "<p>La curva espectral muestra la parte regular en valor principal, \\(\\operatorname{p.v.}\\!\\left(\\frac{1}{i2\\pi u}\\right)\\). Además aparece un impulso de peso \\(\\frac{1}{2}\\delta(u)\\) en el origen.</p>",
  },
  ramp: {
    label: "Rampa causal",
    timeFormula: "x(t)=t\\,u(t)",
    spectrumFormula: "X(u)=-\\operatorname{p.v.}\\!\\left(\\frac{1}{4\\pi^2u^2}\\right)+\\frac{i}{4\\pi}\\delta'(u)",
    timeValues: TIME_GRID.map((time) => (time < 0 ? 0 : time)),
    magnitude: FREQ_GRID.map((frequency) => {
      if (Math.abs(frequency) < PV_GAP) {
        return Number.NaN;
      }
      return clipMagnitude(1 / (4 * Math.PI * Math.PI * (frequency ** 2)), 4.2);
    }),
    phase: FREQ_GRID.map((frequency) => (Math.abs(frequency) < PV_GAP ? Number.NaN : Math.PI)),
    symbols: [{ position: 0, height: 1.1 }],
    noteHtml: "<p>Se grafica solo la parte regular, proporcional a \\(\\frac{1}{u^2}\\). En el origen también aparece un término distribucional proporcional a \\(\\delta'(u)\\), indicado de forma simbólica.</p>",
  },
  sign: {
    label: "Signo",
    timeFormula: "x(t)=\\operatorname{sgn}(t)",
    spectrumFormula: "X(u)=\\operatorname{p.v.}\\!\\left(\\frac{1}{i\\pi u}\\right)",
    timeValues: TIME_GRID.map((time) => signum(time)),
    magnitude: FREQ_GRID.map((frequency) => {
      if (Math.abs(frequency) < PV_GAP) {
        return Number.NaN;
      }
      return clipMagnitude(1 / (Math.PI * Math.abs(frequency)));
    }),
    phase: piecewisePhase(FREQ_GRID, -Math.PI / 2, Math.PI / 2),
    noteHtml: "<p>La transformada del signo se interpreta como \\(\\operatorname{p.v.}\\!\\left(\\frac{1}{i\\pi u}\\right)\\). La fase mostrada corresponde a la parte regular imaginaria impar.</p>",
  },
  triangle: {
    label: "Triángulo",
    timeFormula: "x(t)=\\operatorname{tri}(t)",
    spectrumFormula: "X(u)=\\operatorname{sinc}^2(u)",
    timeValues: TIME_GRID.map((time) => trianglePulse(time)),
    magnitude: FREQ_GRID.map((frequency) => sincNormalized(frequency) ** 2),
    phase: FREQ_GRID.map((frequency) => (Math.abs(sincNormalized(frequency)) < 1e-3 ? Number.NaN : 0)),
    noteHtml: "<p>En este ejemplo la transformada es una función ordinaria, real y par. La fase es nula allí donde la magnitud no se anula.</p>",
  },
};

function spectrumFormula(signal) {
  return `${signal.timeFormula},\\qquad ${signal.spectrumFormula}`;
}

function timeTraces(signal) {
  const traces = [];

  if (signal.timeValues && signal.timeValues.length > 0) {
    traces.push(lineTrace(TIME_GRID, signal.timeValues, {
      name: "Señal temporal",
      line: {
        color: THEME.accent,
        width: 3,
      },
    }));
  }

  traces.push(...impulseStemTraces(signal.timeImpulses, {
    color: THEME.accentAlt,
    name: "Impulso ideal",
  }));

  return traces;
}

function spectrumMagnitudeTraces(signal, axis = {}) {
  const traces = [];

  if (signal.magnitude && signal.magnitude.length > 0) {
    traces.push(lineTrace(FREQ_GRID, signal.magnitude, {
      name: "Magnitud regular",
      line: {
        color: THEME.accent,
        width: 3,
      },
      ...axis,
    }));
  }

  traces.push(...impulseStemTraces(signal.impulses, {
    axis,
    color: THEME.accentAlt,
    name: "Impulso en frecuencia",
  }));
  traces.push(...symbolicMarkerTrace(signal.symbols, axis));

  return traces;
}

function spectrumPhaseTraces(signal, axis = {}) {
  if (!signal.phase || signal.phase.length === 0) {
    return [];
  }

  return [
    lineTrace(FREQ_GRID, signal.phase, {
      name: "Fase",
      line: {
        color: THEME.success,
        width: 2.5,
      },
      ...axis,
    }),
  ];
}

function spectrumLayout(view, signal) {
  const annotations = [];

  if (view === "phase" && (!signal.phase || signal.phase.length === 0)) {
    annotations.push({
      xref: "paper",
      yref: "paper",
      x: 0.5,
      y: 0.55,
      text: "No hay una fase ordinaria que graficar para este caso.",
      showarrow: false,
      font: {
        family: THEME.fontFamily,
        size: 14,
        color: THEME.ink,
      },
    });
  }

  if (view === "both" && (!signal.phase || signal.phase.length === 0)) {
    annotations.push({
      xref: "paper",
      yref: "paper",
      x: 0.5,
      y: 0.16,
      text: "La fase no se representa como función ordinaria.",
      showarrow: false,
      font: {
        family: THEME.fontFamily,
        size: 13,
        color: THEME.ink,
      },
    });
  }

  if (view === "both") {
    return {
      margin: {
        l: 62,
        r: 24,
        t: 26,
        b: 50,
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
        title: { text: "Frecuencia u" },
        range: [FREQ_GRID[0], FREQ_GRID[FREQ_GRID.length - 1]],
        gridcolor: THEME.grid,
        zerolinecolor: THEME.axis,
        linecolor: THEME.axis,
        mirror: true,
      },
      yaxis: {
        title: { text: "|X(u)|" },
        range: [0, 4.3],
        gridcolor: THEME.grid,
        zerolinecolor: THEME.axis,
        linecolor: THEME.axis,
        mirror: true,
      },
      xaxis2: {
        title: { text: "Frecuencia u" },
        range: [FREQ_GRID[0], FREQ_GRID[FREQ_GRID.length - 1]],
        gridcolor: THEME.grid,
        zerolinecolor: THEME.axis,
        linecolor: THEME.axis,
        mirror: true,
      },
      yaxis2: {
        title: { text: "Fase [rad]" },
        range: [-Math.PI, Math.PI],
        tickvals: PHASE_TICKS.tickvals,
        ticktext: PHASE_TICKS.ticktext,
        gridcolor: THEME.grid,
        zerolinecolor: THEME.axis,
        linecolor: THEME.axis,
        mirror: true,
      },
      annotations,
    };
  }

  const isPhase = view === "phase";
  return {
    margin: {
      l: 62,
      r: 24,
      t: 26,
      b: 54,
    },
    legend: {
      orientation: "h",
      x: 0,
      y: 1.05,
      xanchor: "left",
      font: {
        size: 12,
      },
      bgcolor: "rgba(255,255,255,0.7)",
    },
    xaxis: {
      title: { text: "Frecuencia u" },
      range: [FREQ_GRID[0], FREQ_GRID[FREQ_GRID.length - 1]],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    yaxis: isPhase
      ? {
        title: { text: "Fase [rad]" },
        range: [-Math.PI, Math.PI],
        tickvals: PHASE_TICKS.tickvals,
        ticktext: PHASE_TICKS.ticktext,
        gridcolor: THEME.grid,
        zerolinecolor: THEME.axis,
        linecolor: THEME.axis,
        mirror: true,
      }
      : {
        title: { text: "|X(u)|" },
        range: [0, 4.3],
        gridcolor: THEME.grid,
        zerolinecolor: THEME.axis,
        linecolor: THEME.axis,
        mirror: true,
      },
    annotations,
  };
}

function updateExplorer(elements) {
  const signal = SIGNALS[elements.signal.value] ?? SIGNALS.delta;
  const view = elements.view.value;
  const timeValues = signal.timeValues ?? [];
  const timeImpulseHeights = (signal.timeImpulses ?? []).map((item) => item.height);

  renderLatex(elements.formula, spectrumFormula(signal));
  setStatusBanner(elements.note, {
    html: signal.noteHtml,
    tone: "success",
  });

  renderPlot(elements.timePlot, timeTraces(signal), {
    margin: {
      l: 58,
      r: 20,
      t: 26,
      b: 52,
    },
    legend: {
      orientation: "h",
      x: 0,
      y: 1.05,
      xanchor: "left",
      font: {
        size: 12,
      },
      bgcolor: "rgba(255,255,255,0.7)",
    },
    xaxis: {
      title: { text: "Tiempo t" },
      range: [TIME_GRID[0], TIME_GRID[TIME_GRID.length - 1]],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    yaxis: {
      title: { text: "x(t)" },
      range: computeRange([...timeValues, ...timeImpulseHeights]),
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
  });

  let traces = [];
  if (view === "magnitude") {
    traces = spectrumMagnitudeTraces(signal);
  } else if (view === "phase") {
    traces = spectrumPhaseTraces(signal);
  } else {
    traces = [
      ...spectrumMagnitudeTraces(signal),
      ...spectrumPhaseTraces(signal, { xaxis: "x2", yaxis: "y2" }),
    ];
  }

  renderPlot(elements.spectrumPlot, traces, spectrumLayout(view, signal));
}

function buildMagnitudePhaseExample({
  magnitude,
  phase,
  container,
}) {
  const traces = [
    lineTrace(FREQ_GRID, magnitude, {
      name: "Magnitud",
      line: {
        color: THEME.accent,
        width: 3,
      },
    }),
    lineTrace(FREQ_GRID, phase, {
      name: "Fase",
      line: {
        color: THEME.success,
        width: 2.4,
      },
      xaxis: "x2",
      yaxis: "y2",
    }),
  ];

  renderPlot(container, traces, {
    showlegend: false,
    margin: {
      l: 58,
      r: 20,
      t: 20,
      b: 46,
    },
    grid: {
      rows: 2,
      columns: 1,
      pattern: "independent",
      roworder: "top to bottom",
    },
    xaxis: {
      title: { text: "Frecuencia u" },
      range: [FREQ_GRID[0], FREQ_GRID[FREQ_GRID.length - 1]],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    yaxis: {
      title: { text: "|X(u)|" },
      range: [0, 1.15],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    xaxis2: {
      title: { text: "Frecuencia u" },
      range: [FREQ_GRID[0], FREQ_GRID[FREQ_GRID.length - 1]],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    yaxis2: {
      title: { text: "Fase [rad]" },
      range: [-Math.PI, Math.PI],
      tickvals: PHASE_TICKS.tickvals,
      ticktext: PHASE_TICKS.ticktext,
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
  });
}

function renderExamples() {
  const evenExamplePlot = document.getElementById("tf-example-even-plot");
  const delayExamplePlot = document.getElementById("tf-example-delay-plot");

  if (!evenExamplePlot || !delayExamplePlot) {
    return;
  }

  const triangleMagnitude = FREQ_GRID.map((frequency) => sincNormalized(frequency) ** 2);
  const zeroPhase = triangleMagnitude.map((value) => (value < 1e-3 ? Number.NaN : 0));
  const delay = 0.14;
  const delayedPhase = FREQ_GRID.map((frequency) => -2 * Math.PI * frequency * delay);

  buildMagnitudePhaseExample({
    magnitude: triangleMagnitude,
    phase: zeroPhase,
    container: evenExamplePlot,
  });

  buildMagnitudePhaseExample({
    magnitude: triangleMagnitude,
    phase: delayedPhase,
    container: delayExamplePlot,
  });
}

onDomReady(() => {
  const explorerElements = {
    signal: document.getElementById("tf-explorer-signal"),
    view: document.getElementById("tf-explorer-view"),
    formula: document.getElementById("tf-explorer-formula"),
    note: document.getElementById("tf-explorer-note"),
    timePlot: document.getElementById("tf-time-plot"),
    spectrumPlot: document.getElementById("tf-spectrum-plot"),
  };

  if (requireElements("fourier-transform-explorer", explorerElements)) {
    const refresh = () => {
      try {
        updateExplorer(explorerElements);
      } catch (error) {
        console.error("[fourier-transform-explorer] No se pudo actualizar la visualización.", error);
      }
    };

    explorerElements.signal.addEventListener("change", refresh);
    explorerElements.view.addEventListener("change", refresh);
    refresh();
  }

  renderExamples();
});
