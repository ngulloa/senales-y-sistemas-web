import { buildSinusoid, createTimeGrid } from "../core/signals.js";
import { lineTrace, renderPlot, THEME } from "../core/plotting.js";
import { bindNumericPair, formatNumber, formatPiMultiple, onDomReady, renderLatex, requireElements } from "../core/ui.js";

function formatSigned(value, digits = 2) {
  const numeric = Number(value);
  const absolute = formatNumber(Math.abs(numeric), digits);
  return numeric >= 0 ? `+ ${absolute}` : `- ${absolute}`;
}

function updateSimulation(elements) {
  const amplitude = Number(elements.amplitudeRange.value);
  const frequency = Number(elements.frequencyRange.value);
  const phase = Number(elements.phaseRange.value);
  const bias = Number(elements.biasRange.value);
  const shift = Number(elements.shiftRange.value);

  const grid = createTimeGrid({ start: -1.5, end: 1.5, count: 1400 });
  const values = buildSinusoid(grid, {
    amplitude,
    frequency,
    phase,
    bias,
    timeShift: shift,
  });

  const formula = [
    `x(t)=${formatNumber(amplitude)}\\sin\\!\\left(2\\pi\\,${formatNumber(frequency)}\\,(t ${shift === 0 ? "" : shift > 0 ? `- ${formatNumber(shift)}` : `+ ${formatNumber(Math.abs(shift))}`}) ${formatSigned(phase)}\\right) ${formatSigned(bias)}`,
  ]
    .join("")
    .replace("(t )", "t");

  renderLatex(elements.formula, formula);

  const period = 1 / frequency;
  elements.period.textContent = `${formatNumber(period, 3)} u.t.`;
  elements.omega.textContent = `${formatNumber(2 * Math.PI * frequency, 3)} rad/u.t.`;
  elements.summary.textContent = `La señal oscila alrededor de ${formatNumber(bias)} con amplitud ${formatNumber(amplitude)}. La fase actual equivale a ${formatPiMultiple(phase)} rad y el corrimiento temporal es ${formatNumber(shift)}.`;

  const minimum = Math.min(...values, bias);
  const maximum = Math.max(...values, bias);
  const padding = Math.max(0.5, 0.15 * (maximum - minimum || 1));

  const traces = [
    lineTrace(grid, grid.map(() => bias), {
      name: "Eje medio",
      line: {
        color: THEME.accentAlt,
        width: 2,
        dash: "dash",
      },
    }),
    lineTrace(grid, values, {
      name: "x(t)",
      line: {
        color: THEME.accent,
        width: 3,
      },
    }),
  ];

  renderPlot(elements.plot, traces, {
    title: "Senoide continua",
    xaxis: {
      title: { text: "Tiempo t" },
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    yaxis: {
      title: { text: "x(t)" },
      range: [minimum - padding, maximum + padding],
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
  });
}

onDomReady(() => {
  const elements = {
    amplitudeRange: document.getElementById("sinusoid-amplitude"),
    amplitudeNumber: document.getElementById("sinusoid-amplitude-number"),
    frequencyRange: document.getElementById("sinusoid-frequency"),
    frequencyNumber: document.getElementById("sinusoid-frequency-number"),
    phaseRange: document.getElementById("sinusoid-phase"),
    phaseNumber: document.getElementById("sinusoid-phase-number"),
    biasRange: document.getElementById("sinusoid-bias"),
    biasNumber: document.getElementById("sinusoid-bias-number"),
    shiftRange: document.getElementById("sinusoid-shift"),
    shiftNumber: document.getElementById("sinusoid-shift-number"),
    formula: document.getElementById("sinusoid-formula"),
    period: document.getElementById("sinusoid-period"),
    omega: document.getElementById("sinusoid-omega"),
    summary: document.getElementById("sinusoid-summary"),
    plot: document.getElementById("sinusoid-plot"),
  };

  if (!requireElements("sinusoid-sim", elements)) {
    return;
  }

  const refresh = () => {
    try {
      updateSimulation(elements);
    } catch (error) {
      console.error("[sinusoid-sim] No se pudo actualizar la simulación.", error);
    }
  };

  bindNumericPair({
    rangeInput: elements.amplitudeRange,
    numberInput: elements.amplitudeNumber,
    onChange: refresh,
  });
  bindNumericPair({
    rangeInput: elements.frequencyRange,
    numberInput: elements.frequencyNumber,
    onChange: refresh,
  });
  bindNumericPair({
    rangeInput: elements.phaseRange,
    numberInput: elements.phaseNumber,
    onChange: refresh,
  });
  bindNumericPair({
    rangeInput: elements.biasRange,
    numberInput: elements.biasNumber,
    onChange: refresh,
  });
  bindNumericPair({
    rangeInput: elements.shiftRange,
    numberInput: elements.shiftNumber,
    onChange: refresh,
  });

  refresh();
});
