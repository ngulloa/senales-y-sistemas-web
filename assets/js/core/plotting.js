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
  displaylogo: false,
  modeBarButtonsToRemove: [
    "lasso2d",
    "select2d",
    "toggleSpikelines",
    "hoverClosestCartesian",
    "hoverCompareCartesian",
  ],
};

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
      automargin: true,
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    yaxis: {
      automargin: true,
      gridcolor: THEME.grid,
      zerolinecolor: THEME.axis,
      linecolor: THEME.axis,
      mirror: true,
    },
    ...layoutOverrides,
  };

  bindResponsiveResize(container, Plotly);
  return Plotly.react(container, traces, layout, PLOT_CONFIG);
}

export { THEME };
