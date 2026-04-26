import { buildSinusoid, createTimeGrid } from "../core/signals.js";
import { buildAliasCurve, estimateAliasFrequency, estimateSignedAliasFrequency, nyquistSatisfied, sampleSinusoid } from "../core/sampling.js";
import { lineTrace, markerTrace, renderPlot, THEME } from "../core/plotting.js";
import { bindNumericPair, formatNumber, formatPiMultiple, onDomReady, renderLatex, requireElements, setStatusBanner } from "../core/ui.js";

function updateSimulation(elements) {
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
    `x[n]=\\sin\\!\\left(2\\pi\\frac{${formatNumber(signalFrequency)}}{${formatNumber(sampleRate)}}n ${phase >= 0 ? `+ ${formatNumber(phase)}` : `- ${formatNumber(Math.abs(phase))}`}\\right),\\quad f_{\\text{alias}}=\\left|f-kf_s\\right|=${formatNumber(alias, 3)}`,
  );

  elements.nyquist.textContent = nyquistOk ? "Cumple" : "No cumple";
  elements.alias.textContent = `${formatNumber(alias, 3)} ciclos/u.t.`;
  elements.summary.textContent = `Las muestras están separadas por T_s = ${formatNumber(samplePeriod, 4)} u.t. y la fase actual es ${formatPiMultiple(phase)} rad. El entero de plegado más cercano es k = ${foldingIndex}.`;

  if (nyquistOk) {
    setStatusBanner(elements.alert, {
      text: "No hay aliasing en banda base: la frecuencia observada por el muestreo coincide con la original.",
      tone: "success",
    });
  } else {
    setStatusBanner(elements.alert, {
      text: `Hay aliasing: la secuencia muestreada es indistinguible de una sinusoide con frecuencia ${formatNumber(alias, 3)} ciclos/u.t. y frecuencia firmada ${formatNumber(signedAlias, 3)}.`,
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
    title: "Muestreo ideal y aliasing",
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
    signalFrequencyRange: document.getElementById("sampling-frequency"),
    signalFrequencyNumber: document.getElementById("sampling-frequency-number"),
    sampleRateRange: document.getElementById("sampling-rate"),
    sampleRateNumber: document.getElementById("sampling-rate-number"),
    phaseRange: document.getElementById("sampling-phase"),
    phaseNumber: document.getElementById("sampling-phase-number"),
    durationRange: document.getElementById("sampling-duration"),
    durationNumber: document.getElementById("sampling-duration-number"),
    formula: document.getElementById("sampling-formula"),
    nyquist: document.getElementById("sampling-nyquist"),
    alias: document.getElementById("sampling-alias"),
    alert: document.getElementById("sampling-alert"),
    summary: document.getElementById("sampling-summary"),
    plot: document.getElementById("sampling-plot"),
  };

  if (!requireElements("sampling-aliasing-sim", elements)) {
    return;
  }

  const refresh = () => {
    try {
      updateSimulation(elements);
    } catch (error) {
      console.error("[sampling-aliasing-sim] No se pudo actualizar la simulación.", error);
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
