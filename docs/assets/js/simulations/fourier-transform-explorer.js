import { createTimeGrid } from "../core/signals.js";
import { lineTrace, renderPlot, THEME } from "../core/plotting.js";
import { onDomReady, renderLatex, requireElements, setStatusBanner } from "../core/ui.js";

const TIME_GRID = createTimeGrid({ start: -3, end: 3, count: 1400 });
const FREQ_GRID = createTimeGrid({ start: -3.5, end: 3.5, count: 1800 });
const PHASE_TICKS = {
  tickvals: [-Math.PI, -Math.PI / 2, 0, Math.PI / 2, Math.PI],
  ticktext: ["-pi", "-pi/2", "0", "pi/2", "pi"],
};
const PV_GAP = 0.06;
const REFERENCE_U0 = 1;
const RECT_WIDTH = 1.2;

function clipMagnitude(value, limit = 3.4) {
  return Math.min(value, limit);
}

function sincNormalized(value) {
  if (Math.abs(value) < 1e-9) {
    return 1;
  }
  return Math.sin(Math.PI * value) / (Math.PI * value);
}

function rectPulse(time, width = 1) {
  if (Math.abs(time) < width / 2) {
    return 1;
  }
  if (Math.abs(Math.abs(time) - width / 2) < 1e-9) {
    return 0.5;
  }
  return 0;
}

function trianglePulse(time) {
  return Math.max(1 - Math.abs(time), 0);
}

function gaussianPulse(time, a = 1) {
  return Math.exp(-Math.PI * a * time * time);
}

function causalExponential(time, a = 1) {
  return time < 0 ? 0 : Math.exp(-a * time);
}

function doubleExponential(time, a = 1) {
  return Math.exp(-a * Math.abs(time));
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

function constantPhase(value, grid = FREQ_GRID) {
  return grid.map(() => value);
}

function zeroPhaseFromMagnitude(values, threshold = 1e-3) {
  return values.map((value) => (Math.abs(value) < threshold ? Number.NaN : 0));
}

function phaseFromSignedReal(values, threshold = 1e-3) {
  return values.map((value) => {
    if (Math.abs(value) < threshold) {
      return Number.NaN;
    }
    return value >= 0 ? 0 : Math.PI;
  });
}

function piecewisePhase(grid, positiveValue, negativeValue) {
  return grid.map((frequency) => {
    if (Math.abs(frequency) < PV_GAP) {
      return Number.NaN;
    }
    return frequency > 0 ? positiveValue : negativeValue;
  });
}

function impulseStemTraces(items, {
  axis = {},
  color = THEME.accentAlt,
  name = "Termino impulsivo",
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
      name: "Termino distribucional",
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

function computePositiveRange(values, {
  minimumTop = 1,
  padding = 0.15,
  minimumPadding = 0.2,
} = {}) {
  const finiteValues = values.filter((value) => Number.isFinite(value)).map((value) => Math.abs(value));
  if (finiteValues.length === 0) {
    return [0, minimumTop];
  }

  const maximum = Math.max(minimumTop, ...finiteValues);
  const pad = Math.max(minimumPadding, maximum * padding);
  return [0, maximum + pad];
}

function buildTimeSeries(values, {
  name = "Senal temporal",
  color = THEME.accent,
  width = 3,
  dash = "solid",
  hoverLabel = "x(t)",
} = {}) {
  return {
    name,
    values,
    hovertemplate: `t=%{x:.3f}<br>${hoverLabel}=%{y:.3f}<extra></extra>`,
    line: {
      color,
      width,
      dash,
    },
  };
}

function regularMagnitudeTrace(values, axis = {}) {
  return lineTrace(FREQ_GRID, values, {
    name: "Magnitud regular",
    hovertemplate: "u=%{x:.3f}<br>|X(u)|=%{y:.3f}<extra></extra>",
    line: {
      color: THEME.accent,
      width: 3,
    },
    ...axis,
  });
}

function regularPhaseTrace(values, axis = {}) {
  return lineTrace(FREQ_GRID, values, {
    name: "Fase",
    hovertemplate: "u=%{x:.3f}<br>fase=%{y:.3f} rad<extra></extra>",
    line: {
      color: THEME.success,
      width: 2.5,
    },
    ...axis,
  });
}

function timeSeriesTraces(signal) {
  const traces = [];
  const series = signal.timeSeries ?? [];

  series.forEach((item) => {
    traces.push(lineTrace(TIME_GRID, item.values, {
      name: item.name,
      hovertemplate: item.hovertemplate,
      line: item.line,
    }));
  });

  traces.push(...impulseStemTraces(signal.timeImpulses, {
    color: THEME.accentAlt,
    name: "Impulso ideal",
  }));

  return traces;
}

function spectrumMagnitudeTraces(signal, axis = {}) {
  const traces = [];

  if (signal.magnitude && signal.magnitude.length > 0) {
    traces.push(regularMagnitudeTrace(signal.magnitude, axis));
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
  const traces = [];

  if (signal.phase && signal.phase.length > 0) {
    traces.push(regularPhaseTrace(signal.phase, axis));
  }

  traces.push(...impulseStemTraces(signal.phaseImpulses, {
    axis,
    color: THEME.success,
    name: "Fase en lineas espectrales",
    markerSymbol: "diamond",
  }));

  return traces;
}

function hasOrdinaryPhase(signal) {
  return Boolean(signal.phase && signal.phase.length > 0);
}

function hasAnyPhaseRepresentation(signal) {
  return hasOrdinaryPhase(signal) || Boolean(signal.phaseImpulses && signal.phaseImpulses.length > 0);
}

function timeRange(signal) {
  const values = [];
  (signal.timeSeries ?? []).forEach((item) => {
    values.push(...item.values);
  });
  values.push(...(signal.timeImpulses ?? []).map((item) => item.height));
  return computeRange(values);
}

function magnitudeRange(signal) {
  const values = [];
  values.push(...(signal.magnitude ?? []));
  values.push(...(signal.impulses ?? []).map((item) => item.height));
  values.push(...(signal.symbols ?? []).map((item) => item.height));
  return computePositiveRange(values);
}

const rectSpectrumRaw = FREQ_GRID.map((frequency) => RECT_WIDTH * sincNormalized(RECT_WIDTH * frequency));
const sincSpectrumMagnitude = FREQ_GRID.map((frequency) => rectPulse(frequency, 1));
const sincSpectrumPhase = zeroPhaseFromMagnitude(sincSpectrumMagnitude);
const triangleSpectrumMagnitude = FREQ_GRID.map((frequency) => sincNormalized(frequency) ** 2);
const gaussianSpectrum = FREQ_GRID.map((frequency) => gaussianPulse(frequency, 1));
const expDoubleMagnitude = FREQ_GRID.map((frequency) => 2 / (1 + (2 * Math.PI * frequency) ** 2));
const expCausalMagnitude = FREQ_GRID.map((frequency) => 1 / Math.sqrt(1 + (2 * Math.PI * frequency) ** 2));
const expCausalPhase = FREQ_GRID.map((frequency) => -Math.atan2(2 * Math.PI * frequency, 1));

const SIGNALS = {
  delta: {
    label: "Delta de Dirac",
    timeFormula: "x(t)=\\delta(t)",
    spectrumFormula: "X(u)=1",
    timeSeries: [
      buildTimeSeries(TIME_GRID.map(() => 0)),
    ],
    timeImpulses: [{ position: 0, height: 1 }],
    magnitude: FREQ_GRID.map(() => 1),
    phase: constantPhase(0),
    noteHtml: "<p>El impulso en el tiempo produce una transformada constante. En este caso no aparecen terminos distribucionales adicionales en frecuencia.</p>",
  },
  one: {
    label: "Constante uno",
    timeFormula: "x(t)=1",
    spectrumFormula: "X(u)=\\delta(u)",
    timeSeries: [
      buildTimeSeries(TIME_GRID.map(() => 1)),
    ],
    impulses: [{ position: 0, height: 1 }],
    noteHtml: "<p>La senal constante concentra toda su contribucion en \\(u=0\\). La fase no se interpreta como una funcion ordinaria para una delta aislada.</p>",
  },
  "complex-exponential": {
    label: "Exponencial compleja",
    timeFormula: "x(t)=e^{i2\\pi t}",
    spectrumFormula: "X(u)=\\delta(u-1)",
    timeSeries: [
      buildTimeSeries(TIME_GRID.map((time) => Math.cos(2 * Math.PI * REFERENCE_U0 * time)), {
        name: "Parte real",
        hoverLabel: "Re x(t)",
      }),
      buildTimeSeries(TIME_GRID.map((time) => Math.sin(2 * Math.PI * REFERENCE_U0 * time)), {
        name: "Parte imaginaria",
        color: THEME.success,
        width: 2.5,
        dash: "dash",
        hoverLabel: "Im x(t)",
      }),
    ],
    impulses: [{ position: REFERENCE_U0, height: 1 }],
    phaseImpulses: [{ position: REFERENCE_U0, height: 0 }],
    noteHtml: "<p>Para \\(e^{i2\\pi u_0 t}\\) con \\(u_0=1\\), el grafico temporal muestra parte real e imaginaria. En frecuencia aparece una sola delta en \\(u=u_0\\).</p>",
  },
  cosine: {
    label: "Coseno",
    timeFormula: "x(t)=\\cos(2\\pi t)",
    spectrumFormula: "X(u)=\\frac{1}{2}\\left[\\delta(u-1)+\\delta(u+1)\\right]",
    timeSeries: [
      buildTimeSeries(TIME_GRID.map((time) => Math.cos(2 * Math.PI * REFERENCE_U0 * time))),
    ],
    impulses: [
      { position: -REFERENCE_U0, height: 0.5 },
      { position: REFERENCE_U0, height: 0.5 },
    ],
    phaseImpulses: [
      { position: -REFERENCE_U0, height: 0 },
      { position: REFERENCE_U0, height: 0 },
    ],
    noteHtml: "<p>El coseno ideal concentra su espectro en dos lineas simetricas de peso \\(\\tfrac{1}{2}\\). La fase se muestra solo como fase de esas lineas espectrales.</p>",
  },
  sine: {
    label: "Seno",
    timeFormula: "x(t)=\\sin(2\\pi t)",
    spectrumFormula: "X(u)=\\frac{1}{2i}\\left[\\delta(u-1)-\\delta(u+1)\\right]",
    timeSeries: [
      buildTimeSeries(TIME_GRID.map((time) => Math.sin(2 * Math.PI * REFERENCE_U0 * time))),
    ],
    impulses: [
      { position: -REFERENCE_U0, height: 0.5 },
      { position: REFERENCE_U0, height: 0.5 },
    ],
    phaseImpulses: [
      { position: -REFERENCE_U0, height: Math.PI / 2 },
      { position: REFERENCE_U0, height: -Math.PI / 2 },
    ],
    noteHtml: "<p>El seno tambien produce dos deltas simetricas, pero sus coeficientes son imaginarios puros. Por eso la fase de las lineas espectrales aparece en \\(\\pm\\pi/2\\).</p>",
  },
  rect: {
    label: "Pulso rectangular",
    timeFormula: "x(t)=\\operatorname{rect}\\!\\left(\\frac{t}{1.2}\\right)",
    spectrumFormula: "X(u)=1.2\\,\\operatorname{sinc}(1.2u)",
    timeSeries: [
      buildTimeSeries(TIME_GRID.map((time) => rectPulse(time, RECT_WIDTH))),
    ],
    magnitude: rectSpectrumRaw.map((value) => Math.abs(value)),
    phase: phaseFromSignedReal(rectSpectrumRaw),
    noteHtml: "<p>Se usa un pulso rectangular de ancho \\(T=1.2\\). La magnitud sigue una envolvente tipo \\(\\operatorname{sinc}\\), mientras que la fase salta entre \\(0\\) y \\(\\pi\\) cuando la parte real cambia de signo.</p>",
  },
  sinc: {
    label: "Sinc",
    timeFormula: "x(t)=\\operatorname{sinc}(t)",
    spectrumFormula: "X(u)=\\operatorname{rect}(u)",
    timeSeries: [
      buildTimeSeries(TIME_GRID.map((time) => sincNormalized(time))),
    ],
    magnitude: sincSpectrumMagnitude,
    phase: sincSpectrumPhase,
    noteHtml: "<p>La funcion \\(\\operatorname{sinc}(t)\\) produce un espectro rectangular de soporte finito. Dentro de la banda pasante la fase es nula y fuera de ella la magnitud vale cero.</p>",
  },
  triangle: {
    label: "Triangulo",
    timeFormula: "x(t)=\\operatorname{tri}(t)",
    spectrumFormula: "X(u)=\\operatorname{sinc}^2(u)",
    timeSeries: [
      buildTimeSeries(TIME_GRID.map((time) => trianglePulse(time))),
    ],
    magnitude: triangleSpectrumMagnitude,
    phase: zeroPhaseFromMagnitude(triangleSpectrumMagnitude),
    noteHtml: "<p>En este ejemplo la transformada es una funcion ordinaria, real y par. La fase es nula alli donde la magnitud no se anula.</p>",
  },
  gaussian: {
    label: "Gaussiana",
    timeFormula: "x(t)=e^{-\\pi t^2}",
    spectrumFormula: "X(u)=e^{-\\pi u^2}",
    timeSeries: [
      buildTimeSeries(TIME_GRID.map((time) => gaussianPulse(time, 1))),
    ],
    magnitude: gaussianSpectrum,
    phase: zeroPhaseFromMagnitude(gaussianSpectrum),
    noteHtml: "<p>Con \\(a=1\\), la gaussiana es autofourier: conserva su forma al transformar. El espectro es positivo y la fase se mantiene nula.</p>",
  },
  "exp-causal": {
    label: "Exponencial lateral",
    timeFormula: "x(t)=e^{-t}u(t)",
    spectrumFormula: "X(u)=\\frac{1}{1+i2\\pi u}",
    timeSeries: [
      buildTimeSeries(TIME_GRID.map((time) => causalExponential(time, 1))),
    ],
    magnitude: expCausalMagnitude,
    phase: expCausalPhase,
    noteHtml: "<p>La exponencial lateral es causal y asimetrica. Su magnitud decrece con \\(|u|\\) y la fase negativa refleja el desfase asociado al termino \\(1+i2\\pi u\\).</p>",
  },
  "exp-double": {
    label: "Exponencial doble",
    timeFormula: "x(t)=e^{-|t|}",
    spectrumFormula: "X(u)=\\frac{2}{1+(2\\pi u)^2}",
    timeSeries: [
      buildTimeSeries(TIME_GRID.map((time) => doubleExponential(time, 1))),
    ],
    magnitude: expDoubleMagnitude,
    phase: zeroPhaseFromMagnitude(expDoubleMagnitude),
    noteHtml: "<p>La exponencial doble es real y par, por lo que su transformada tambien es real y par. El espectro no cambia de signo y la fase ordinaria es nula.</p>",
  },
  step: {
    label: "Escalon",
    timeFormula: "x(t)=u(t)",
    spectrumFormula: "X(u)=\\operatorname{p.v.}\\!\\left(\\frac{1}{i2\\pi u}\\right)+\\frac{1}{2}\\delta(u)",
    timeSeries: [
      buildTimeSeries(TIME_GRID.map((time) => heaviside(time))),
    ],
    magnitude: FREQ_GRID.map((frequency) => {
      if (Math.abs(frequency) < PV_GAP) {
        return Number.NaN;
      }
      return clipMagnitude(1 / (2 * Math.PI * Math.abs(frequency)));
    }),
    phase: piecewisePhase(FREQ_GRID, -Math.PI / 2, Math.PI / 2),
    impulses: [{ position: 0, height: 0.5 }],
    noteHtml: "<p>La curva espectral muestra la parte regular en valor principal, \\(\\operatorname{p.v.}\\!\\left(\\frac{1}{i2\\pi u}\\right)\\). Ademas aparece un impulso de peso \\(\\frac{1}{2}\\delta(u)\\) en el origen.</p>",
  },
  ramp: {
    label: "Rampa causal",
    timeFormula: "x(t)=t\\,u(t)",
    spectrumFormula: "X(u)=-\\operatorname{p.v.}\\!\\left(\\frac{1}{4\\pi^2u^2}\\right)+\\frac{i}{4\\pi}\\delta'(u)",
    timeSeries: [
      buildTimeSeries(TIME_GRID.map((time) => (time < 0 ? 0 : time))),
    ],
    magnitude: FREQ_GRID.map((frequency) => {
      if (Math.abs(frequency) < PV_GAP) {
        return Number.NaN;
      }
      return clipMagnitude(1 / (4 * Math.PI * Math.PI * (frequency ** 2)), 4.2);
    }),
    phase: FREQ_GRID.map((frequency) => (Math.abs(frequency) < PV_GAP ? Number.NaN : Math.PI)),
    symbols: [{ position: 0, height: 1.1 }],
    noteHtml: "<p>Se grafica solo la parte regular, proporcional a \\(\\frac{1}{u^2}\\). En el origen tambien aparece un termino distribucional proporcional a \\(\\delta'(u)\\), indicado de forma simbolica.</p>",
  },
  sign: {
    label: "Signo",
    timeFormula: "x(t)=\\operatorname{sgn}(t)",
    spectrumFormula: "X(u)=\\operatorname{p.v.}\\!\\left(\\frac{1}{i\\pi u}\\right)",
    timeSeries: [
      buildTimeSeries(TIME_GRID.map((time) => signum(time))),
    ],
    magnitude: FREQ_GRID.map((frequency) => {
      if (Math.abs(frequency) < PV_GAP) {
        return Number.NaN;
      }
      return clipMagnitude(1 / (Math.PI * Math.abs(frequency)));
    }),
    phase: piecewisePhase(FREQ_GRID, -Math.PI / 2, Math.PI / 2),
    noteHtml: "<p>La transformada del signo se interpreta como \\(\\operatorname{p.v.}\\!\\left(\\frac{1}{i\\pi u}\\right)\\). La fase mostrada corresponde a la parte regular imaginaria impar.</p>",
  },
};

function spectrumFormula(signal) {
  return `${signal.timeFormula},\\qquad ${signal.spectrumFormula}`;
}

function spectrumLayout(view, signal) {
  const annotations = [];
  const hasPhase = hasAnyPhaseRepresentation(signal);
  const currentMagnitudeRange = magnitudeRange(signal);

  if (view === "phase" && !hasPhase) {
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

  if (view === "both" && !hasPhase) {
    annotations.push({
      xref: "paper",
      yref: "paper",
      x: 0.5,
      y: 0.16,
      text: "La fase no se representa como funcion ordinaria.",
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
      },
      yaxis: {
        title: { text: "|X(u)|" },
        range: currentMagnitudeRange,
      },
      xaxis2: {
        title: { text: "Frecuencia u" },
        range: [FREQ_GRID[0], FREQ_GRID[FREQ_GRID.length - 1]],
      },
      yaxis2: {
        title: { text: "Fase [rad]" },
        range: [-Math.PI, Math.PI],
        tickvals: PHASE_TICKS.tickvals,
        ticktext: PHASE_TICKS.ticktext,
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
    },
    yaxis: isPhase
      ? {
        title: { text: "Fase [rad]" },
        range: [-Math.PI, Math.PI],
        tickvals: PHASE_TICKS.tickvals,
        ticktext: PHASE_TICKS.ticktext,
      }
      : {
        title: { text: "|X(u)|" },
        range: currentMagnitudeRange,
      },
    annotations,
  };
}

function updateExplorer(elements) {
  const signal = SIGNALS[elements.signal.value] ?? SIGNALS.delta;
  const view = elements.view.value;

  renderLatex(elements.formula, spectrumFormula(signal));
  setStatusBanner(elements.note, {
    html: signal.noteHtml,
    tone: "success",
  });

  renderPlot(elements.timePlot, timeSeriesTraces(signal), {
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
    },
    yaxis: {
      title: { text: "x(t)" },
      range: timeRange(signal),
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
      hovertemplate: "u=%{x:.3f}<br>|X(u)|=%{y:.3f}<extra></extra>",
      line: {
        color: THEME.accent,
        width: 3,
      },
    }),
    lineTrace(FREQ_GRID, phase, {
      name: "Fase",
      hovertemplate: "u=%{x:.3f}<br>fase=%{y:.3f} rad<extra></extra>",
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
    },
    yaxis: {
      title: { text: "|X(u)|" },
      range: [0, 1.15],
    },
    xaxis2: {
      title: { text: "Frecuencia u" },
      range: [FREQ_GRID[0], FREQ_GRID[FREQ_GRID.length - 1]],
    },
    yaxis2: {
      title: { text: "Fase [rad]" },
      range: [-Math.PI, Math.PI],
      tickvals: PHASE_TICKS.tickvals,
      ticktext: PHASE_TICKS.ticktext,
    },
  });
}

function renderExamples() {
  const evenExamplePlot = document.getElementById("tf-example-even-plot");
  const delayExamplePlot = document.getElementById("tf-example-delay-plot");

  if (!evenExamplePlot || !delayExamplePlot) {
    return;
  }

  const zeroPhase = triangleSpectrumMagnitude.map((value) => (value < 1e-3 ? Number.NaN : 0));
  const delay = 0.14;
  const delayedPhase = FREQ_GRID.map((frequency) => -2 * Math.PI * frequency * delay);

  buildMagnitudePhaseExample({
    magnitude: triangleSpectrumMagnitude,
    phase: zeroPhase,
    container: evenExamplePlot,
  });

  buildMagnitudePhaseExample({
    magnitude: triangleSpectrumMagnitude,
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
        console.error("[fourier-transform-explorer] No se pudo actualizar la visualizacion.", error);
      }
    };

    explorerElements.signal.addEventListener("change", refresh);
    explorerElements.view.addEventListener("change", refresh);
    refresh();
  }

  renderExamples();
});
