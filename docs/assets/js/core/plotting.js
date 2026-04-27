const THEME = {
  ink: "#102027",
  accent: "#1d6f8f",
  accentAlt: "#f77f00",
  success: "#2a9d8f",
  grid: "#d8e2dc",
  axis: "#87a0a8",
  paper: "rgba(0, 0, 0, 0)",
  plot: "#ffffff",
  fontFamily: "\"Trebuchet MS\", \"Segoe UI Variable Display\", sans-serif",
};

const PLOT_CONFIG = {
  responsive: true,
  displayModeBar: false,
  displaylogo: false,
  scrollZoom: false,
  doubleClick: false,
  showAxisDragHandles: false,
  showAxisRangeEntryBoxes: false,
  editable: false,
  modeBarButtonsToRemove: [
    "lasso2d",
    "select2d",
    "zoom2d",
    "pan2d",
    "zoomIn2d",
    "zoomOut2d",
    "autoScale2d",
    "resetScale2d",
    "toggleSpikelines",
    "hoverClosestCartesian",
    "hoverCompareCartesian",
  ],
};

const AXIS_KEY_PATTERN = /^(x|y)axis\d*$/;

function ensurePlotly() {
  if (!window.Plotly) {
    throw new Error("Plotly no está disponible. Verifica la carga desde CDN.");
  }
  return window.Plotly;
}

function bindResponsiveResize(container, Plotly) {
  if (!container || container.dataset.plotlyResizeBound === "true") {
    return;
  }

  let resizeFrame = null;
  const resizePlot = () => {
    if (!container.isConnected) {
      return;
    }
    if (resizeFrame !== null) {
      window.cancelAnimationFrame(resizeFrame);
    }
    resizeFrame = window.requestAnimationFrame(() => {
      Plotly.Plots.resize(container);
      resizeFrame = null;
    });
  };

  window.addEventListener("resize", resizePlot, { passive: true });
  container.dataset.plotlyResizeBound = "true";
}

export function lineTrace(x, y, options = {}) {
  return {
    type: "scatter",
    mode: "lines",
    x,
    y,
    hovertemplate: "t=%{x:.3f}<br>valor=%{y:.3f}<extra></extra>",
    ...options,
  };
}

export function markerTrace(x, y, options = {}) {
  return {
    type: "scatter",
    mode: "markers",
    x,
    y,
    hovertemplate: "t=%{x:.3f}<br>valor=%{y:.3f}<extra></extra>",
    ...options,
  };
}

function normalizeAxis(axis = {}) {
  const mergedAxis = {
    automargin: true,
    gridcolor: THEME.grid,
    zerolinecolor: THEME.axis,
    linecolor: THEME.axis,
    mirror: true,
    ...axis,
  };
  const hasExplicitRange = Array.isArray(mergedAxis.range);

  if (hasExplicitRange) {
    mergedAxis.autorange = false;
  } else if (!Object.prototype.hasOwnProperty.call(mergedAxis, "autorange")) {
    mergedAxis.autorange = true;
  }

  mergedAxis.fixedrange = true;
  return mergedAxis;
}

function normalizeLayout(layout) {
  const normalized = {
    ...layout,
    dragmode: false,
    hovermode: false,
  };

  Object.keys(normalized).forEach((key) => {
    if (AXIS_KEY_PATTERN.test(key)) {
      normalized[key] = normalizeAxis(normalized[key]);
    }
  });

  return normalized;
}

export function renderPlot(container, traces, layoutOverrides = {}) {
  if (!container) {
    throw new Error("No existe el contenedor del gráfico.");
  }

  const Plotly = ensurePlotly();
  const layout = {
    paper_bgcolor: THEME.paper,
    plot_bgcolor: THEME.plot,
    autosize: true,
    font: {
      family: THEME.fontFamily,
      color: THEME.ink,
    },
    height: 440,
    margin: {
      l: 62,
      r: 24,
      t: 52,
      b: 58,
    },
    legend: {
      orientation: "h",
      x: 0,
      y: 1.14,
      xanchor: "left",
      font: {
        size: 13,
      },
      bgcolor: "rgba(255,255,255,0.7)",
    },
    hoverlabel: {
      bgcolor: "#ffffff",
      bordercolor: THEME.grid,
      font: {
        family: THEME.fontFamily,
        color: THEME.ink,
      },
    },
    xaxis: {
      autorange: true,
    },
    yaxis: {
      autorange: true,
    },
    ...layoutOverrides,
  };

  bindResponsiveResize(container, Plotly);
  return Plotly.react(container, traces, normalizeLayout(layout), PLOT_CONFIG);
}

export { THEME };
