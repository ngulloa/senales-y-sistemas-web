import { buildSinusoid, createTimeGrid } from "../core/signals.js";
import {
  buildAliasCurve,
  estimateAliasFrequency,
  estimateSignedAliasFrequency,
  nyquistSatisfied,
  sampleSinusoid,
} from "../core/sampling.js";
import { lineTrace, markerTrace, renderPlot, THEME } from "../core/plotting.js";
import {
  bindNumericPair,
  formatNumber,
  formatPiMultiple,
  onDomReady,
  renderLatex,
  requireElements,
  setStatusBanner,
} from "../core/ui.js";

function updateExplorer(elements) {
  const signalFrequency = Number(elements.signalFrequencyRange.value);
  const sampleRate = Number(elements.sampleRateRange.value);
  const phase = Number(elements.phaseRange.value);
  const duration = Number(elements.durationRange.value);

  const grid = createTimeGrid({
    start: 0,
    end: duration,
    count: Math.max(1000, Math.round(duration * 1100)),
  });

  const continuous = buildSinusoid(grid, {
    amplitude: 1,
    frequency: signalFrequency,
    phase,
  });
  const sampled = sampleSinusoid({
    start: 0,
    end: duration,
    sampleRate,
    amplitude: 1,
    frequency: signalFrequency,
    phase,
  });
  const aliasValues = buildAliasCurve(grid, {
    amplitude: 1,
    signalFrequency,
    sampleRate,
    phase,
  });

  const alias = estimateAliasFrequency(signalFrequency, sampleRate);
  const signedAlias = estimateSignedAliasFrequency(signalFrequency, sampleRate);
  const nyquistOk = nyquistSatisfied(signalFrequency, sampleRate);
  const samplePeriod = 1 / sampleRate;
  const foldingIndex = Math.round(signalFrequency / sampleRate);

  renderLatex(
    elements.formula,
    `x[n]=\\sin\\!\\left(2\\pi\\frac{${formatNumber(signalFrequency)}}{${formatNumber(sampleRate)}}n ${phase >= 0 ? `+ ${formatNumber(phase)}` : `- ${formatNumber(Math.abs(phase))}`}\\right),\\quad u_{\\text{alias}}=\\left|u-k u_s\\right|=${formatNumber(alias, 3)}`,
  );

  elements.nyquist.textContent = nyquistOk ? "Cumple" : "No cumple";
  elements.alias.textContent = `${formatNumber(alias, 3)} ciclos/u.t.`;
  elements.summary.textContent = `Las muestras están separadas por T_s = ${formatNumber(samplePeriod, 4)} u.t. y la fase actual es ${formatPiMultiple(phase)} rad. El entero de plegado más cercano es k = ${foldingIndex}.`;

  if (nyquistOk) {
    setStatusBanner(elements.alert, {
      text: "Se cumple Nyquist: en la banda base observable, la frecuencia reconstruida coincide con la frecuencia original.",
      tone: "success",
    });
  } else {
    setStatusBanner(elements.alert, {
      text: `Hay aliasing: la secuencia muestreada también es compatible con una sinusoide de frecuencia ${formatNumber(alias, 3)} ciclos/u.t. y frecuencia firmada ${formatNumber(signedAlias, 3)}.`,
      tone: "warning",
    });
  }

  const traces = [
    lineTrace(grid, continuous, {
      name: "Señal continua",
      line: {
        color: THEME.accent,
        width: 3,
      },
    }),
    lineTrace(grid, aliasValues, {
      name: "Curva alias equivalente",
      line: {
        color: THEME.accentAlt,
        width: 2.5,
        dash: "dash",
      },
    }),
    markerTrace(sampled.times, sampled.values, {
      name: "Muestras",
      marker: {
        size: 8,
        color: THEME.success,
        line: {
          width: 1,
          color: "#ffffff",
        },
      },
    }),
  ];

  renderPlot(elements.plot, traces, {
    margin: {
      l: 60,
      r: 22,
      t: 28,
      b: 56,
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
      range: [0, duration],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    yaxis: {
      title: { text: "Amplitud" },
      range: [-1.35, 1.35],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
  });
}

onDomReady(() => {
  const elements = {
    signalFrequencyRange: document.getElementById("mod-sampling-frequency"),
    signalFrequencyNumber: document.getElementById("mod-sampling-frequency-number"),
    sampleRateRange: document.getElementById("mod-sampling-rate"),
    sampleRateNumber: document.getElementById("mod-sampling-rate-number"),
    phaseRange: document.getElementById("mod-sampling-phase"),
    phaseNumber: document.getElementById("mod-sampling-phase-number"),
    durationRange: document.getElementById("mod-sampling-duration"),
    durationNumber: document.getElementById("mod-sampling-duration-number"),
    formula: document.getElementById("mod-sampling-formula"),
    nyquist: document.getElementById("mod-sampling-nyquist"),
    alias: document.getElementById("mod-sampling-alias"),
    alert: document.getElementById("mod-sampling-alert"),
    summary: document.getElementById("mod-sampling-summary"),
    plot: document.getElementById("mod-sampling-plot"),
  };

  if (!requireElements("modulation-sampling-explorer", elements)) {
    return;
  }

  const refresh = () => {
    try {
      updateExplorer(elements);
    } catch (error) {
      console.error("[modulation-sampling-explorer] No se pudo actualizar la visualización.", error);
    }
  };

  bindNumericPair({
    rangeInput: elements.signalFrequencyRange,
    numberInput: elements.signalFrequencyNumber,
    onChange: refresh,
  });
  bindNumericPair({
    rangeInput: elements.sampleRateRange,
    numberInput: elements.sampleRateNumber,
    onChange: refresh,
  });
  bindNumericPair({
    rangeInput: elements.phaseRange,
    numberInput: elements.phaseNumber,
    onChange: refresh,
  });
  bindNumericPair({
    rangeInput: elements.durationRange,
    numberInput: elements.durationNumber,
    onChange: refresh,
  });

  refresh();
});
