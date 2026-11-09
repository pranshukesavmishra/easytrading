/* Shared Chart.js theme + verified data. Load after Chart.js 4.4.1:
   <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js" defer></script>
   <script src="/assets/js/charts.js" defer></script> */
(function () {
  "use strict";
  // Verified data: see docs/CLIENT-FACTS.md. Do not edit without updating that file.
  window.ET_DATA = {
    years: [2020, 2021, 2022, 2023, 2024],
    clientReturns: [50, 39, 35, 38, 41],          // % per year, client-reported, unaudited
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

  // % per year, Nifty 50 price index, derived (unrounded) from the calendar-year closes above.
  // ≈ [14.9, 24.1, 4.3, 20.0, 8.8]; ₹1,00,000 → ≈ ₹1,94,312.
  window.ET_DATA.nifty50Returns = window.ET_DATA.years.map(function (y) {
    var c = window.ET_DATA.niftyCloses;
    return (c[y] / c[y - 1] - 1) * 100;
  });

  window.ET_CHART = {
    colors: {
      gold: "#E8B33A", gold2: "#F3D58A", goldFill: "rgba(232,179,58,0.18)",
      slate: "#7C8AA5", slateFill: "rgba(124,138,165,0.16)",
      gain: "#3DDC97", loss: "#FF5C5C", grid: "rgba(255,255,255,0.06)", text: "#8E9196"
    },
    // Apply global defaults once Chart is present.
    init: function () {
      if (!window.Chart || this._done) return !!window.Chart;
      var C = window.Chart, c = this.colors;
      C.defaults.color = c.text;
      C.defaults.font.family = "'Archivo', 'Helvetica Neue', Arial, sans-serif";
      C.defaults.font.size = 12;
      C.defaults.borderColor = c.grid;
      C.defaults.plugins.legend.labels.usePointStyle = true;
      C.defaults.plugins.legend.labels.boxWidth = 8;
      C.defaults.plugins.tooltip.backgroundColor = "#0D0F12";
      C.defaults.plugins.tooltip.borderColor = "rgba(255,255,255,0.14)";
      C.defaults.plugins.tooltip.borderWidth = 1;
      C.defaults.plugins.tooltip.cornerRadius = 2;
      C.defaults.plugins.tooltip.padding = 12;
      C.defaults.plugins.tooltip.titleFont = { family: "'IBM Plex Mono', monospace", weight: "600" };
      C.defaults.plugins.tooltip.bodyFont = { family: "'IBM Plex Mono', monospace" };
      C.defaults.maintainAspectRatio = false;
      if (window.ET && window.ET.reduceMotion) C.defaults.animation = false;
      this._done = true;
      return true;
    },
    // Vertical gold gradient for area fills.
    gradient: function (ctx, area, from, to) {
      if (!area) return from;
      var g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
      g.addColorStop(0, from); g.addColorStop(1, to || "rgba(232,179,58,0)");
      return g;
    }
  };
})();
