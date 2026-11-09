/* Shared Chart.js theme + verified data. Load after Chart.js 4.4.1:
   <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js" defer></script>
   <script src="/assets/js/charts.js" defer></script> */
(function () {
  "use strict";
  // Verified data: see docs/CLIENT-FACTS.md. Do not edit without updating that file.
  window.ET_DATA = {
    years: [2020, 2021, 2022, 2023, 2024],
    clientReturns: [50, 39, 35, 38, 41],          // % per year, client-reported, unaudited
    nifty50Returns: [14.9, 24.1, 4.3, 20.0, 8.8], // % per year, Nifty 50 price index, calendar-year closes
    niftyCloses: { 2019: 12168.45, 2020: 13981.75, 2021: 17354.05, 2022: 18105.30, 2023: 21731.40, 2024: 23644.80 },
    growthOf: function (start, returns) {
      var v = start, out = [start];
      returns.forEach(function (r) { v = v * (1 + r / 100); out.push(v); });
      return out;
    },
    cagr: function (returns) {
      var p = returns.reduce(function (acc, r) { return acc * (1 + r / 100); }, 1);
      return (Math.pow(p, 1 / returns.length) - 1) * 100;
    }
  };

  window.ET_CHART = {
    colors: {
      gold: "#F5B800", gold2: "#FFD369", goldFill: "rgba(245,184,0,0.18)",
      slate: "#7C8AA5", slateFill: "rgba(124,138,165,0.16)",
      gain: "#2BD576", loss: "#FF5A76", grid: "rgba(255,255,255,0.06)", text: "#9AA6BD"
    },
    // Apply global defaults once Chart is present.
    init: function () {
      if (!window.Chart || this._done) return !!window.Chart;
      var C = window.Chart, c = this.colors;
      C.defaults.color = c.text;
      C.defaults.font.family = "'Inter', system-ui, sans-serif";
      C.defaults.font.size = 12;
      C.defaults.borderColor = c.grid;
      C.defaults.plugins.legend.labels.usePointStyle = true;
      C.defaults.plugins.legend.labels.boxWidth = 8;
      C.defaults.plugins.tooltip.backgroundColor = "#0C1322";
      C.defaults.plugins.tooltip.borderColor = "rgba(255,255,255,0.14)";
      C.defaults.plugins.tooltip.borderWidth = 1;
      C.defaults.plugins.tooltip.padding = 12;
      C.defaults.plugins.tooltip.titleFont = { family: "'JetBrains Mono', monospace", weight: "600" };
      C.defaults.plugins.tooltip.bodyFont = { family: "'JetBrains Mono', monospace" };
      C.defaults.maintainAspectRatio = false;
      if (window.ET && window.ET.reduceMotion) C.defaults.animation = false;
      this._done = true;
      return true;
    },
    // Vertical gold gradient for area fills.
    gradient: function (ctx, area, from, to) {
      if (!area) return from;
      var g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
      g.addColorStop(0, from); g.addColorStop(1, to || "rgba(245,184,0,0)");
      return g;
    }
  };
})();
