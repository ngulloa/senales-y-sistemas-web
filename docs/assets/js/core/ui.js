export function onDomReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
    return;
  }
  callback();
}

export function formatNumber(value, digits = 2) {
  const factor = 10 ** digits;
  const rounded = Math.round(Number(value) * factor) / factor;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return rounded.toFixed(digits).replace(/\.?0+$/, "");
}

export function formatPiMultiple(value) {
  const ratio = Number(value) / Math.PI;
  if (Math.abs(ratio) < 1e-9) {
    return "0";
  }
  return `${formatNumber(ratio, 2)}π`;
}

export function bindNumericPair({ rangeInput, numberInput, onChange }) {
  if (!rangeInput || !numberInput) {
    console.error("No se pudieron enlazar controles numéricos: falta un input range o number.");
    return;
  }

  const syncValue = (source) => {
    const fallback = Number(rangeInput.value || numberInput.value || 0);
    const parsed = Number(source.value);
    const minimum = rangeInput.min !== "" ? Number(rangeInput.min) : -Infinity;
    const maximum = rangeInput.max !== "" ? Number(rangeInput.max) : Infinity;

    let nextValue = Number.isFinite(parsed) ? parsed : fallback;
    nextValue = Math.min(Math.max(nextValue, minimum), maximum);

    rangeInput.value = String(nextValue);
    numberInput.value = String(nextValue);

    if (typeof onChange === "function") {
      onChange(nextValue);
    }
  };

  rangeInput.addEventListener("input", () => syncValue(rangeInput));
  numberInput.addEventListener("input", () => syncValue(numberInput));
  syncValue(rangeInput);
}

export function renderLatex(container, latexExpression) {
  if (!container) {
    console.error("No se pudo renderizar LaTeX: el contenedor no existe.");
    return;
  }

  if (window.MathJax?.typesetClear) {
    window.MathJax.typesetClear([container]);
  }

  container.innerHTML = `$$${latexExpression}$$`;

  if (window.MathJax?.typesetPromise) {
    window.MathJax.typesetPromise([container]).catch(() => {});
  }
}

export function setStatusBanner(container, { text = "", html = "", tone = "success" }) {
  if (!container) {
    console.error("No se pudo actualizar el banner de estado: el contenedor no existe.");
    return;
  }

  if (window.MathJax?.typesetClear) {
    window.MathJax.typesetClear([container]);
  }

  if (html) {
    container.innerHTML = html;
    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([container]).catch(() => {});
    }
  } else {
    container.textContent = text;
  }

  container.classList.remove("is-success", "is-warning");
  container.classList.add(tone === "warning" ? "is-warning" : "is-success");
}

export function requireElements(scope, elements) {
  const missing = Object.entries(elements)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error(`[${scope}] Faltan elementos del DOM: ${missing.join(", ")}.`);
    return false;
  }

  return true;
}
