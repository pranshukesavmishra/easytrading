/* Performance page: computed KPIs, growth simulator, year table, yearly bars with market context. */
(function () {
  "use strict";
  var SITE = window.SITE || {};

  // Performance hidden by config: main.js has removed [data-performance]; show the fallback instead.
  if (SITE.showPerformance === false) {
    var fb = document.querySelector("[data-perf-fallback]");
    if (fb) fb.hidden = false;
    return;
  }
  var D0 = window.ET_DATA;
  if (!D0 || !window.ET) return;
  var ET = window.ET;
  // Nifty yearly returns derived from the published closes (unrounded), so growth figures match the index exactly.
  var D = Object.create(D0);
  D.nifty50Returns = D0.years.map(function (y) { return (D0.niftyCloses[y] / D0.niftyCloses[y - 1] - 1) * 100; });

  var pct1 = function (n) { return n.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 }); };
  var signed = function (n, dec) {
    var s = n.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    return (n > 0 ? "+" : n < 0 ? "−" : "") + s.replace("-", "");
  };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Computed CAGR figures ---------- */
  var cagrC = D.cagr(D.clientReturns), cagrN = D.cagr(D.nifty50Returns);
  var endC = D.growthOf(100000, D.clientReturns).pop(), endN = D.growthOf(100000, D.nifty50Returns).pop();
  $$("[data-cagr-client] span").forEach(function (el) { el.textContent = pct1(cagrC) + "%"; });
  $$("[data-cagr-nifty] span").forEach(function (el) { el.textContent = pct1(cagrN) + "%"; });
  $$("[data-end-client]").forEach(function (el) { el.textContent = ET.formatINR(endC); });
  $$("[data-end-nifty]").forEach(function (el) { el.textContent = ET.formatINR(endN); });
  $$("[data-cagr-ratio]").forEach(function (el) { el.textContent = (cagrC / cagrN).toFixed(1) + "×"; });
  var bc = $("[data-bar-client]"), bn = $("[data-bar-nifty]");
  if (bc) bc.style.setProperty("--w", "100%");
  if (bn) bn.style.setProperty("--w", (cagrN / cagrC * 100).toFixed(1) + "%");

  /* ---------- Year table ---------- */
  var tbody = $("[data-perf-rows]"), tfoot = $("[data-perf-foot]");
  var closes = D.niftyCloses;
  var fmtClose = function (n) { return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  if (tbody) {
    var cls = function (n) { return n > 0 ? "gain" : n < 0 ? "loss" : ""; };
    var html = "";
    D.years.forEach(function (y, i) {
      var c = D.clientReturns[i], n = D.nifty50Returns[i], d = c - n;
      html += "<tr><th scope=\"row\" class=\"mono\">" + y + "</th>" +
        "<td class=\"num " + cls(c) + "\">" + signed(c, 1) + "%</td>" +
        "<td class=\"num " + cls(n) + "\">" + signed(n, 1) + "%</td>" +
        "<td class=\"num " + cls(d) + "\">" + signed(d, 1) + " pp</td>" +
        "<td class=\"num\">" + fmtClose(closes[y]) + "</td></tr>";
    });
    tbody.innerHTML = html;
    var base = D.years[0] - 1;
    if (tfoot) {
      tfoot.innerHTML =
        "<tr class=\"perf-table__base\"><th scope=\"row\" class=\"mono\">" + base + " close</th><td class=\"num muted\" colspan=\"3\">Starting level for 2020</td><td class=\"num\">" +
        fmtClose(closes[base]) + "</td></tr>" +
        "<tr class=\"perf-table__total\"><th scope=\"row\">5-yr CAGR</th><td class=\"num gold\">≈ " + pct1(cagrC) + "%</td><td class=\"num\">≈ " + pct1(cagrN) +
        "%</td><td class=\"num gain\">" + signed(cagrC - cagrN, 1) + " pp</td><td class=\"num muted\">" +
        fmtClose(closes[base]) + " → " + fmtClose(closes[D.years[D.years.length - 1]]) + "</td></tr>";
    }
  }

  /* ---------- Context list numbers ---------- */
  $$(".ctx__list li").forEach(function (li) {
    var i = +li.getAttribute("data-idx");
    var c = $("[data-ctx-client]", li), n = $("[data-ctx-nifty]", li);
    if (c) c.textContent = "ET " + signed(D.clientReturns[i], 0) + "%";
    if (n) n.textContent = "NIFTY " + signed(D.nifty50Returns[i], 1) + "%";
  });

  /* ---------- Growth simulator ---------- */
  var MIN = 10000, MAX = 10000000;
  var amountInput = $("#sim-amount"), range = $("#sim-range");
  var amount = 100000, growthChart = null;
  function toSlider(v) { return Math.round(Math.log(v / MIN) / Math.log(MAX / MIN) * 1000); }
  function fromSlider(s) {
    var raw = MIN * Math.pow(MAX / MIN, s / 1000);
    var mag = Math.pow(10, Math.floor(Math.log10(raw)) - 1);   // two significant figures
    return Math.min(MAX, Math.max(MIN, Math.round(raw / mag) * mag));
  }
  function parseAmount(str) { var n = parseInt(String(str).replace(/[^\d]/g, ""), 10); return isNaN(n) ? null : n; }

  function update(source) {
    var c = D.growthOf(amount, D.clientReturns), n = D.growthOf(amount, D.nifty50Returns);
    var ce = c[c.length - 1], ne = n[n.length - 1];
    var set = function (k, t) { var el = $("[data-out=\"" + k + "\"]"); if (el) el.textContent = t; };
    set("client-end", ET.formatINR(ce));
    set("nifty-end", ET.formatINR(ne));
    set("client-mult", (ce / amount).toFixed(2) + "×");
    set("nifty-mult", (ne / amount).toFixed(2) + "×");
    set("diff", ET.formatINR(ce - ne));
    if (source !== "input" && amountInput) amountInput.value = ET.formatNum(amount);
    if (source !== "range" && range) range.value = toSlider(amount);
    if (range) range.setAttribute("aria-valuetext", ET.formatINR(amount));
    $$(".chip[data-amount]").forEach(function (b) {
      var on = +b.getAttribute("data-amount") === amount;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (growthChart) {
      growthChart.data.datasets[0].data = c;
      growthChart.data.datasets[1].data = n;
      growthChart.update(source === "range" ? "none" : undefined);
    }
  }
  if (amountInput && range) {
    range.addEventListener("input", function () { amount = fromSlider(+range.value); update("range"); });
    amountInput.addEventListener("input", function () {
      var v = parseAmount(amountInput.value);
      if (v !== null && v >= MIN && v <= MAX) { amount = v; amountInput.removeAttribute("aria-invalid"); update("input"); }
    });
    amountInput.addEventListener("change", function () {
      var v = parseAmount(amountInput.value);
      if (v === null) v = amount;
      amount = Math.min(MAX, Math.max(MIN, v));
      amountInput.removeAttribute("aria-invalid");
      update("change");
    });
    $$(".chip[data-amount]").forEach(function (b) {
      b.addEventListener("click", function () { amount = +b.getAttribute("data-amount"); update("chip"); });
    });
  }

  /* ---------- Charts ---------- */
  function initCharts() {
    if (!window.ET_CHART || !window.ET_CHART.init()) return;
    var C = window.ET_CHART.colors, Chart = window.Chart;
    var mono = { family: "'JetBrains Mono', monospace", size: 11 };
    var labels = ["Start"].concat(D.years.map(function (y) { return "End " + y; }));

    var gEl = $("#growth-chart");
    if (gEl) {
      growthChart = new Chart(gEl, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Easy Trading (client-reported)", data: D.growthOf(amount, D.clientReturns),
              borderColor: C.gold, borderWidth: 2.5, tension: 0.3, pointRadius: 3, pointHoverRadius: 6,
              pointBackgroundColor: C.gold, fill: true,
              backgroundColor: function (c) { return window.ET_CHART.gradient(c.chart.ctx, c.chart.chartArea, "rgba(245,184,0,0.26)", "rgba(245,184,0,0)"); }
            },
            {
              label: "Nifty 50", data: D.growthOf(amount, D.nifty50Returns),
              borderColor: C.slate, borderWidth: 2, borderDash: [5, 5], tension: 0.3, pointRadius: 3, pointHoverRadius: 5,
              pointBackgroundColor: C.slate, fill: false
            }
          ]
        },
        options: {
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: function (c) { return " " + c.dataset.label + ": " + ET.formatINR(c.parsed.y); } } }
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: mono, maxRotation: 0, autoSkip: true,
                 callback: function (v, i) { return i === 0 ? "Start" : String(D.years[i - 1]); } } },
            y: { position: "right", grid: { color: C.grid }, border: { display: false },
                 ticks: { maxTicksLimit: 6, font: mono, callback: function (v) { return ET.formatINRShort(v); } } }
          }
        }
      });
    }

    var bEl = $("#bars-chart");
    if (bEl) {
      var bars = new Chart(bEl, {
        type: "bar",
        data: {
          labels: D.years.map(String),
          datasets: [
            { label: "Easy Trading (client-reported)", data: D.clientReturns, backgroundColor: C.gold, hoverBackgroundColor: C.gold2, borderRadius: 4, maxBarThickness: 40 },
            { label: "Nifty 50", data: D.nifty50Returns, backgroundColor: "rgba(124,138,165,0.55)", hoverBackgroundColor: C.slate, borderRadius: 4, maxBarThickness: 40 }
          ]
        },
        options: {
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: function (c) { return " " + c.dataset.label + ": " + c.parsed.y.toFixed(1) + "%"; } } }
          },
          onHover: function (e, els) { highlight(els.length ? els[0].index : -1, false); },
          scales: {
            x: { grid: { display: false }, ticks: { font: mono } },
            y: { beginAtZero: true, suggestedMax: 55, grid: { color: C.grid }, border: { display: false }, ticks: { font: mono, callback: function (v) { return v + "%"; } } }
          }
        }
      });
      var items = $$(".ctx__list li");
      var highlight = function (i, fromList) {
        items.forEach(function (li) { li.classList.toggle("is-active", +li.getAttribute("data-idx") === i); });
        if (!fromList) return;
        if (i < 0) { bars.setActiveElements([]); bars.tooltip.setActiveElements([], { x: 0, y: 0 }); }
        else {
          var act = [{ datasetIndex: 0, index: i }, { datasetIndex: 1, index: i }];
          bars.setActiveElements(act);
          var m = bars.getDatasetMeta(0).data[i];
          bars.tooltip.setActiveElements(act, { x: m.x, y: m.y });
        }
        bars.update();
      };
      items.forEach(function (li) {
        var i = +li.getAttribute("data-idx");
        li.addEventListener("mouseenter", function () { highlight(i, true); });
        li.addEventListener("focus", function () { highlight(i, true); });
        li.addEventListener("mouseleave", function () { highlight(-1, true); });
        li.addEventListener("blur", function () { highlight(-1, true); });
      });
    }
  }
  update("init");
  if (window.Chart) initCharts(); else window.addEventListener("load", initCharts);
})();
