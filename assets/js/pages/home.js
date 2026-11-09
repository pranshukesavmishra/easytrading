/* Home page: animated candlestick backdrop + hero and performance charts. */
(function () {
  "use strict";

  /* ---------- Candlestick backdrop ---------- */
  // The 2D candlestick backdrop is the fallback when the WebGL terrain (hero3d.js) is not running.
  var canvas = document.querySelector(".hero:not(.has-webgl) .hero__canvas");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var candles = [], W = 0, H = 0, step = 18, offset = 0, rafId = null, running = true;
    var reduce = window.ET && window.ET.reduceMotion;

    // Deterministic pseudo-random so the backdrop looks the same on every load.
    var seed = 7;
    function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

    function nextCandle(prevClose) {
      var drift = 0.0009;                       // gentle upward bias
      var vol = 0.012;
      var open = prevClose;
      var close = open * (1 + drift + (rand() - 0.5) * 2 * vol);
      var high = Math.max(open, close) * (1 + rand() * vol * 0.6);
      var low = Math.min(open, close) * (1 - rand() * vol * 0.6);
      return { o: open, c: close, h: high, l: low };
    }
    function resize() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      step = W < 640 ? 14 : 18;
      var need = Math.ceil(W / step) + 4;
      if (!candles.length) candles.push(nextCandle(100));
      while (candles.length < need) candles.push(nextCandle(candles[candles.length - 1].c));
      draw();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var lo = Infinity, hi = -Infinity;
      candles.forEach(function (k) { lo = Math.min(lo, k.l); hi = Math.max(hi, k.h); });
      var pad = H * 0.18, span = (hi - lo) || 1;
      var y = function (v) { return H - pad - ((v - lo) / span) * (H - pad * 2); };
      var bw = Math.max(3, step * 0.5);
      // trend line
      ctx.beginPath();
      candles.forEach(function (k, i) {
        var x = i * step - offset;
        if (i === 0) ctx.moveTo(x, y(k.c)); else ctx.lineTo(x, y(k.c));
      });
      ctx.strokeStyle = "rgba(232,179,58,0.22)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      candles.forEach(function (k, i) {
        var x = i * step - offset;
        var up = k.c >= k.o;
        var fade = Math.min(1, Math.max(0.15, x / W + 0.2));
        ctx.globalAlpha = 0.55 * fade;
        ctx.strokeStyle = ctx.fillStyle = up ? "#3ddc97" : "#ff5c5c";
        ctx.beginPath(); ctx.moveTo(x, y(k.h)); ctx.lineTo(x, y(k.l)); ctx.lineWidth = 1; ctx.stroke();
        var top = y(Math.max(k.o, k.c)), bot = y(Math.min(k.o, k.c));
        ctx.fillRect(x - bw / 2, top, bw, Math.max(1.5, bot - top));
      });
      ctx.globalAlpha = 1;
    }
    function tick() {
      if (!running) { rafId = null; return; }
      offset += 0.25;
      if (offset >= step) {
        offset -= step;
        candles.shift();
        candles.push(nextCandle(candles[candles.length - 1].c));
      }
      draw();
      rafId = requestAnimationFrame(tick);
    }
    resize();
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    if (!reduce) {
      // Pause when the hero is off-screen or the tab is hidden.
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) {
          running = en[0].isIntersecting && !document.hidden;
          if (running && !rafId) rafId = requestAnimationFrame(tick);
        }).observe(canvas);
      } else { rafId = requestAnimationFrame(tick); }
      document.addEventListener("visibilitychange", function () {
        running = !document.hidden;
        if (running && !rafId) rafId = requestAnimationFrame(tick);
      });
    }
  }

  /* ---------- Charts ---------- */
  function initCharts() {
    if (!window.ET_CHART || !window.ET_CHART.init()) return;
    var D = window.ET_DATA, C = window.ET_CHART.colors;
    var labels = ["Start"].concat(D.years.map(String));

    var heroEl = document.getElementById("hero-chart");
    if (heroEl) {
      new window.Chart(heroEl, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Easy Trading", data: D.growthOf(100000, D.clientReturns),
              borderColor: C.gold, borderWidth: 2.5, tension: 0.35, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: C.gold,
              fill: true,
              backgroundColor: function (c) { return window.ET_CHART.gradient(c.chart.ctx, c.chart.chartArea, "rgba(226,177,60,0.35)", "rgba(226,177,60,0)"); }
            },
            {
              label: "Nifty 50", data: D.growthOf(100000, D.nifty50Returns),
              borderColor: C.slate, borderWidth: 2, borderDash: [5, 5], tension: 0.35, pointRadius: 0, pointHoverRadius: 4, fill: false
            }
          ]
        },
        options: {
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: function (c) { return " " + c.dataset.label + ": " + window.ET.formatINR(c.parsed.y); } } }
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { family: "'IBM Plex Mono', monospace", size: 11 } } },
            y: { position: "right", grid: { color: C.grid }, border: { display: false },
                 ticks: { maxTicksLimit: 5, font: { family: "'IBM Plex Mono', monospace", size: 11 }, callback: function (v) { return window.ET.formatINRShort(v); } } }
          }
        }
      });
    }

    var perfEl = document.getElementById("perf-chart");
    if (perfEl) {
      new window.Chart(perfEl, {
        type: "bar",
        data: {
          labels: D.years.map(String),
          datasets: [
            { label: "Easy Trading (client-reported)", data: D.clientReturns, backgroundColor: C.gold, borderRadius: 4, maxBarThickness: 44 },
            { label: "Nifty 50", data: D.nifty50Returns, backgroundColor: "rgba(124,138,165,0.55)", borderRadius: 4, maxBarThickness: 44 }
          ]
        },
        options: {
          plugins: {
            legend: { position: "top", align: "start" },
            tooltip: { callbacks: { label: function (c) { return " " + c.dataset.label + ": " + c.parsed.y.toFixed(1) + "%"; } } }
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { family: "'IBM Plex Mono', monospace" } } },
            y: { beginAtZero: true, grid: { color: C.grid }, border: { display: false }, ticks: { callback: function (v) { return v + "%"; } } }
          }
        }
      });
    }
  }
  // Chart.js and charts.js are deferred, so they have run by DOMContentLoaded... but this file is also deferred
  // and runs in document order after them. Initialise now, with a load fallback in case of slow CDN.
  if (window.Chart) initCharts(); else window.addEventListener("load", initCharts);
})();
