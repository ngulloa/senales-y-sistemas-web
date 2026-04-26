import { fundamentalFrequency, GIBBS_OVERSHOOT_RATIO, squareWaveSeriesApproximation } from "../core/fourier.js";
import { buildSquareWave, createTimeGrid } from "../core/signals.js";
import { lineTrace, renderPlot, THEME } from "../core/plotting.js";
import { bindNumericPair, formatNumber, onDomReady, renderLatex, requireElements } from "../core/ui.js";

function updateSimulation(elements) {
  const harmonics = Math.round(Number(elements.harmonicsRange.value));
  const period = Number(elements.periodRange.value);
  const u0 = fundamentalFrequency(period);
  const windowStart = -8;
  const windowEnd = 8;
  const visibleDuration = windowEnd - windowStart;
  const visiblePeriods = visibleDuration / period;

  const grid = createTimeGrid({
    start: windowStart,
    end: windowEnd,
    count: 2200,
  });

  const approximation = squareWaveSeriesApproximation(grid, {
    harmonics,
    period,
    amplitude: 1,
  });
  const target = buildSquareWave(grid, {
    period,
    amplitude: 1,
  });

  renderLatex(
    elements.formula,
    `x_N(t)=\\frac{4}{\\pi}\\sum_{m=0}^{${harmonics - 1}}\\frac{1}{2m+1}\\sin\\!\\left(2\\pi(2m+1)\\frac{t}{${formatNumber(period, 2)}}\\right),\\quad u_0=${formatNumber(u0, 3)}`,
  );

  elements.frequency.textContent = `${formatNumber(u0, 3)} ciclos/u.t.`;
  elements.period.textContent = `${formatNumber(period, 2)} u.t.`;
  elements.gibbs.textContent = `≈ ${formatNumber(100 * GIBBS_OVERSHOOT_RATIO, 2)} % del salto`;
  elements.summary.textContent = `En la ventana fija t ∈ [${formatNumber(windowStart, 0)}, ${formatNumber(windowEnd, 0)}] se observan aproximadamente ${formatNumber(visiblePeriods, 2)} períodos. Con ${harmonics} armónicos impares, la suma parcial reconstruye la forma global de la onda cuadrada; cerca de los saltos persiste el sobrepico característico de Gibbs.`;

  const traces = [
    lineTrace(grid, target, {
      name: "Onda cuadrada ideal",
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
    title: "Reconstrucción mediante Serie de Fourier",
    xaxis: {
      title: { text: "Tiempo t" },
      range: [windowStart, windowEnd],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    yaxis: {
      title: { text: "Amplitud" },
      range: [-1.8, 1.8],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
  });
}

onDomReady(() => {
  const elements = {
    harmonicsRange: document.getElementById("fs-harmonics"),
    harmonicsNumber: document.getElementById("fs-harmonics-number"),
    periodRange: document.getElementById("fs-period"),
    periodNumber: document.getElementById("fs-period-number"),
    formula: document.getElementById("fs-formula"),
    frequency: document.getElementById("fs-frequency"),
    period: document.getElementById("fs-period-value"),
    gibbs: document.getElementById("fs-gibbs"),
    summary: document.getElementById("fs-summary"),
    plot: document.getElementById("fs-plot"),
  };

  if (!requireElements("fourier-series-sim", elements)) {
    return;
  }

  const refresh = () => {
    try {
      updateSimulation(elements);
    } catch (error) {
      console.error("[fourier-series-sim] No se pudo actualizar la simulación.", error);
    }
  };

  bindNumericPair({
    rangeInput: elements.harmonicsRange,
    numberInput: elements.harmonicsNumber,
    onChange: refresh,
  });
  bindNumericPair({
    rangeInput: elements.periodRange,
    numberInput: elements.periodNumber,
    onChange: refresh,
  });

  refresh();
});
