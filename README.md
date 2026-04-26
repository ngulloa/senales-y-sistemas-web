# Señales y Sistemas Web

Sitio educativo gratuito sobre Señales y Sistemas construido con Quarto, JavaScript moderno y Plotly.js. El proyecto está pensado para publicarse en GitHub Pages y funcionar completamente en navegador, sin backend.

## Objetivo

- Presentar contenidos teóricos claros y consistentes en español académico.
- Ofrecer simulaciones interactivas ligeras para explorar conceptos clave.
- Mantener una arquitectura simple: Quarto para páginas, CSS para estilo y JavaScript para la lógica interactiva.

## Requisitos

- [Quarto](https://quarto.org/) instalado.
- Navegador moderno con JavaScript habilitado.
- Conexión a internet si se desea cargar Plotly desde CDN.

## Instalación

1. Clona este repositorio.
2. Entra a la carpeta del proyecto.
3. Renderiza o previsualiza con Quarto.

## Preview local

```bash
quarto preview
```

Esto levanta una vista local con recarga para revisar contenidos y simulaciones.

## Renderizado

```bash
quarto render
```

El sitio generado queda en `docs/`, listo para publicarse desde GitHub Pages. Después de renderizar debe existir `docs/index.html`.

## Publicación en GitHub Pages

1. Sube el repositorio a GitHub.
2. En la configuración del repositorio activa GitHub Pages.
3. Selecciona la rama principal y la carpeta `/docs`.
4. Publica.

El archivo `docs/.nojekyll` se incluye para evitar conflictos con el procesamiento por defecto de GitHub Pages.

## Estructura de carpetas

```text
.
├── _quarto.yml
├── index.qmd
├── README.md
├── TODO.md
├── temas/
│   ├── serie-fourier.qmd
│   ├── transformada-fourier.qmd
│   ├── relacion-sf-tf.qmd
│   ├── laplace.qmd
│   ├── propiedades-fourier.qmd
│   ├── sistemas-lti-filtros.qmd
│   ├── modulacion-muestreo.qmd
│   └── dtft-dft-fft-dct.qmd
├── simulaciones/
│   ├── sinusoide.qmd
│   ├── serie-fourier.qmd
│   ├── muestreo-aliasing.qmd
│   └── proximamente.qmd
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── core/
│   │   │   ├── signals.js
│   │   │   ├── sampling.js
│   │   │   ├── fourier.js
│   │   │   ├── plotting.js
│   │   │   └── ui.js
│   │   └── simulations/
│   │       ├── sinusoid-sim.js
│   │       ├── fourier-series-sim.js
│   │       └── sampling-aliasing-sim.js
│   └── img/
└── docs/
```

## Cómo agregar una nueva simulación

1. Crea una página en `simulaciones/` con extensión `.qmd`.
2. Agrega el contenedor HTML de controles, fórmula y gráfico.
3. Crea un módulo en `assets/js/simulations/`.
4. Reutiliza utilidades desde `assets/js/core/`.
5. Incluye Plotly por CDN en la página si la simulación necesita gráficos.
6. Agrega la nueva página al `navbar` en `_quarto.yml`.
7. Ejecuta `quarto render` para comprobar que el HTML final se genera correctamente.

## Nota sobre Plotly

Las simulaciones cargan Plotly.js desde CDN para no agregar un sistema de build frontend ni dependencias de backend. Si en una iteración futura se desea funcionamiento completamente offline, puede sustituirse por una copia local del archivo distribuido por Plotly.

## Nota sobre la convención de Fourier

En todo el sitio se usa

\[
X(u)=\int_{-\infty}^{\infty}x(t)e^{-i2\pi ut}\,dt
\]

con frecuencia \(u\) en ciclos por unidad de tiempo. Si se introduce frecuencia angular, se explicita la relación \(\omega = 2\pi u\).

## Alcance actual

- Sitio estático compatible con GitHub Pages.
- Navegación superior, búsqueda, tabla de contenidos y numeración de secciones vía Quarto.
- Tres simulaciones iniciales en navegador:
  - sinusoide ajustable;
  - reconstrucción por Serie de Fourier;
  - muestreo y aliasing.
