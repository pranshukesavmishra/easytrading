/* Investor Tools: calculators + risk-profile quiz.
   Part 1 is pure maths (no DOM), exported for Node tests (scripts/test-calculators.cjs).
   Part 2 wires the UI and only runs in a browser. */

/* ======================================================================
   Part 1. Pure calculator functions
   ====================================================================== */
var ETCalc = (function () {
  "use strict";

  /* SIP future value, contributions at the START of each month, monthly compounding.
     FV = P × [((1+i)^n − 1) / i] × (1+i), i = annualRate / 12 / 100, n = years × 12 */
  function sipFactor(annualRate, years) {
    var i = annualRate / 12 / 100, n = Math.round(years * 12);
    if (i === 0) return n;
    return ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  }
  function sipFV(monthly, annualRate, years) {
    return monthly * sipFactor(annualRate, years);
  }

  /* Month-by-month SIP simulation with an optional annual step-up.
     The instalment rises by stepUpPct at the start of months 13, 25, 37, ...
     Returns totals and a per-year schedule of cumulative invested and value. */
  function sipSchedule(monthly, annualRate, years, stepUpPct) {
    var i = annualRate / 12 / 100, n = Math.round(years * 12), s = (stepUpPct || 0) / 100;
    var bal = 0, invested = 0, inst = monthly, rows = [];
    for (var m = 0; m < n; m++) {
      if (m > 0 && m % 12 === 0) inst = inst * (1 + s);
      invested += inst;
      bal = (bal + inst) * (1 + i);
      if ((m + 1) % 12 === 0 || m === n - 1) rows.push({ year: Math.ceil((m + 1) / 12), invested: invested, value: bal });
    }
    return { invested: invested, value: bal, returns: bal - invested, lastInstalment: inst, years: rows };
  }

  /* Lump sum, annual compounding: FV = P(1 + r)^n */
  function lumpsumFV(amount, annualRate, years) {
    return amount * Math.pow(1 + annualRate / 100, years);
  }
  function lumpsumSchedule(amount, annualRate, years) {
    var rows = [];
    for (var y = 1; y <= years; y++) rows.push({ year: y, invested: amount, value: lumpsumFV(amount, annualRate, y) });
    var v = lumpsumFV(amount, annualRate, years);
    return { invested: amount, value: v, returns: v - amount, years: rows };
  }

  /* Monthly SIP (start-of-month) needed to reach a future value: the SIP formula inverted. */
  function sipForTarget(futureValue, annualRate, years) {
    return futureValue / sipFactor(annualRate, years);
  }

  /* Goal planner: inflate today's target, then size a monthly SIP and a lump sum today. */
  function goalPlan(targetToday, years, inflationPct, annualRate) {
    var future = targetToday * Math.pow(1 + inflationPct / 100, years);
    var sip = sipForTarget(future, annualRate, years);
    var lump = future / Math.pow(1 + annualRate / 100, years);
    return { future: future, sip: sip, lump: lump, invested: sip * Math.round(years * 12) };
  }

  /* CAGR = (final / initial)^(1 / years) − 1, as a percentage. */
  function cagr(initial, final, years) {
    if (!(initial > 0) || !(final > 0) || !(years > 0)) return NaN;
    return (Math.pow(final / initial, 1 / years) - 1) * 100;
  }
  function fvFromCagr(initial, ratePct, years) {
    return initial * Math.pow(1 + ratePct / 100, years);
  }

  /* Risk profile. answers: 7 scores, each 1 (most cautious) to 4 (most risk-tolerant), in order:
     age, horizon, income stability, reaction to a 20% fall, experience, goal, share of savings.
     Bands on the 7–28 total: 7–12 Conservative, 13–18 Moderate, 19–23 Growth, 24–28 Aggressive.
     Safety caps: a horizon under a year or "sell everything" in a fall caps the result at Moderate;
     no market experience caps it at Growth. */
  var PROFILES = ["Conservative", "Moderate", "Growth", "Aggressive"];
  function riskProfile(answers) {
    var score = answers.reduce(function (a, b) { return a + b; }, 0);
    var level = score <= 12 ? 0 : score <= 18 ? 1 : score <= 23 ? 2 : 3;
    var cap = 3, reason = "";
    if (answers[1] === 1 || answers[3] === 1) { cap = 1; reason = answers[1] === 1 ? "short horizon" : "low tolerance for falls"; }
    else if (answers[4] === 1) { cap = 2; reason = "no market experience yet"; }
    var capped = level > cap;
    if (capped) level = cap;
    return { score: score, level: level, profile: PROFILES[level], capped: capped, capReason: capped ? reason : "" };
  }

  /* Easy Trading strategies (services.html anchors) to discuss for each profile.
     Conservative never includes F&O, intraday or margin products. */
  var STRATEGIES = {
    Conservative: ["risk-management", "equity-portfolio", "gold-silver"],
    Moderate: ["equity-portfolio", "gold-silver", "risk-management", "ipo"],
    Growth: ["equity-portfolio", "options-selling", "ipo", "gold-silver", "risk-management"],
    Aggressive: ["equity-portfolio", "options-selling", "weekly-expiry", "intraday-swing", "mtf", "ipo", "risk-management"]
  };
  var FNO = ["options-selling", "weekly-expiry", "intraday-swing", "mtf"];
  function strategiesFor(profile) { return (STRATEGIES[profile] || []).slice(); }

  return {
    sipFactor: sipFactor, sipFV: sipFV, sipSchedule: sipSchedule,
    lumpsumFV: lumpsumFV, lumpsumSchedule: lumpsumSchedule,
    sipForTarget: sipForTarget, goalPlan: goalPlan,
    cagr: cagr, fvFromCagr: fvFromCagr,
    riskProfile: riskProfile, strategiesFor: strategiesFor, PROFILES: PROFILES, FNO: FNO
  };
})();
if (typeof module !== "undefined" && module.exports) module.exports = ETCalc;

/* ======================================================================
   Part 2. User interface
   ====================================================================== */
if (typeof document !== "undefined") (function () {
  "use strict";
  var C = ETCalc;
  var ET = window.ET || {
    formatINR: function (n) { return "₹" + Math.round(n).toLocaleString("en-IN"); },
    formatINRShort: function (n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }
  };
  var nf0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  var nf2 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
  var TOOLS = ["sip", "lumpsum", "goal", "cagr", "risk-profile"];
  var rupee = function (n) { return ET.formatINR(Math.round(n)); };
  // Compact form beside each figure (₹25.4 L, ₹1.2 Cr); blank when it adds nothing.
  var short = function (n) { return Math.abs(n) >= 1e5 ? ET.formatINRShort(n) : ""; };
  // Same, spelled out for inputs: "₹25.4 lakh", "₹1.2 crore".
  var words = function (n) {
    return Math.abs(n) >= 1e5 ? ET.formatINRShort(n).replace(/ L$/, " lakh").replace(/ Cr$/, " crore") : "";
  };
  var pct = function (n, d) { return (isFinite(n) ? n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }) : "–") + "%"; };

  /* ---------------- Field: number input + range slider, kept in sync ---------------- */
  var uid = 0;
  function Field(el, onChange) {
    var self = this;
    this.el = el;
    this.key = el.getAttribute("data-key");
    this.unit = el.getAttribute("data-unit");
    this.min = parseFloat(el.getAttribute("data-min"));
    this.max = parseFloat(el.getAttribute("data-max"));
    this.step = parseFloat(el.getAttribute("data-step") || "1");
    this.log = el.getAttribute("data-scale") === "log";
    this.value = parseFloat(el.getAttribute("data-value"));
    this.onChange = onChange;

    var label = el.querySelector("label");
    var input = this.input = el.querySelector("input");
    var id = input.id || ("cf-" + (++uid));
    label.id = id + "-label";
    input.type = "text";
    input.inputMode = this.unit === "inr" || (this.unit === "yr" && this.step >= 1) ? "numeric" : "decimal";
    input.autocomplete = "off";
    input.spellcheck = false;

    // Wrap the text input with its unit affix.
    var box = document.createElement("div");
    box.className = "cf__box";
    input.parentNode.insertBefore(box, input);
    if (this.unit === "inr") box.insertAdjacentHTML("beforeend", '<span class="cf__affix" aria-hidden="true">₹</span>');
    box.appendChild(input);
    if (this.unit !== "inr") box.insertAdjacentHTML("beforeend", '<span class="cf__affix" aria-hidden="true">' + (this.unit === "pct" ? "%" : "yrs") + "</span>");
    var top = document.createElement("div");
    top.className = "cf__top";
    el.insertBefore(top, el.firstChild);
    top.appendChild(label); top.appendChild(box);

    var range = this.range = document.createElement("input");
    range.type = "range";
    range.className = "cf__range";
    range.setAttribute("aria-labelledby", label.id);
    if (this.log) { range.min = 0; range.max = 1000; range.step = 1; }
    else { range.min = this.min; range.max = this.max; range.step = this.step; }
    el.appendChild(range);

    var meta = document.createElement("div");
    meta.className = "cf__meta";
    meta.innerHTML = '<span id="' + id + '-hint">' + this.fmtLimit(this.min) + " to " + this.fmtLimit(this.max) + '</span><span class="cf__words" aria-hidden="true"></span>';
    el.appendChild(meta);
    this.words = meta.querySelector(".cf__words");
    var err = this.err = document.createElement("p");
    err.className = "field-error";
    err.id = id + "-err";
    err.setAttribute("aria-live", "polite");
    el.appendChild(err);
    input.setAttribute("aria-describedby", id + "-hint " + id + "-err");

    input.addEventListener("input", function () { self.fromText(false); });
    input.addEventListener("blur", function () { self.fromText(true); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); self.fromText(true); }
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        var d = (e.key === "ArrowUp" ? 1 : -1) * (self.log ? self.niceStep(self.value) : self.step);
        self.set(self.value + d, true);
      }
    });
    range.addEventListener("input", function () {
      self.set(self.log ? self.fromSlider(+range.value) : +range.value, true);
    });
    this.set(this.value, false);
  }
  Field.prototype.decimals = function () { var s = String(this.step); return s.indexOf(".") < 0 ? 0 : s.split(".")[1].length; };
  Field.prototype.fmt = function (v) {
    if (this.unit === "inr") return nf0.format(Math.round(v));
    return this.decimals() ? nf2.format(v) : nf0.format(Math.round(v));
  };
  Field.prototype.fmtLimit = function (v) {
    if (this.unit === "inr") return v >= 1e5 ? words(v) : rupee(v);
    if (this.unit === "pct") return v + "%";
    return v + (v === 1 ? " year" : " years");
  };
  Field.prototype.clamp = function (v) { return Math.min(this.max, Math.max(this.min, v)); };
  Field.prototype.niceStep = function (v) {
    var mag = Math.pow(10, Math.floor(Math.log10(Math.max(v, 1))));
    return Math.max(this.step, mag / 20);
  };
  Field.prototype.toSlider = function (v) { return Math.round(1000 * Math.log(v / this.min) / Math.log(this.max / this.min)); };
  Field.prototype.fromSlider = function (s) {
    var v = this.min * Math.pow(this.max / this.min, s / 1000), st = this.niceStep(v);
    return this.clamp(Math.round(v / st) * st);
  };
  Field.prototype.parse = function (txt) {
    var t = String(txt).replace(/[₹,%\s]|yrs?|years?/gi, "");
    if (t === "" || t === "-" || t === ".") return NaN;
    return /^-?\d*\.?\d*$/.test(t) ? parseFloat(t) : NaN;
  };
  // Typing: validate and recalculate with a clamped value; commit (reformat) on blur/Enter.
  Field.prototype.fromText = function (commit) {
    var v = this.parse(this.input.value);
    if (isNaN(v)) {
      if (commit) { this.set(this.value, false); return; }
      this.showErr("Enter a number between " + this.fmtLimit(this.min) + " and " + this.fmtLimit(this.max) + ".");
      return;
    }
    var c = this.clamp(v);
    if (this.unit === "inr" || (this.unit === "yr" && this.step >= 1)) c = Math.round(c);
    if (commit) { this.set(c, true); return; }
    if (c !== v) this.showErr((v < this.min ? "Minimum is " + this.fmtLimit(this.min) : "Maximum is " + this.fmtLimit(this.max)) + ". Using " + this.fmtLimit(c) + ".");
    else this.showErr("");
    this.apply(c, true);
  };
  Field.prototype.showErr = function (msg) {
    this.err.textContent = msg;
    if (msg) this.input.setAttribute("aria-invalid", "true"); else this.input.removeAttribute("aria-invalid");
  };
  Field.prototype.set = function (v, notify) {
    v = this.clamp(v);
    this.showErr("");
    this.input.value = this.fmt(v);
    this.apply(v, notify !== false);
  };
  Field.prototype.apply = function (v, notify) {
    this.value = v;
    this.range.value = this.log ? this.toSlider(v) : v;
    var vt = this.unit === "inr" ? rupee(v) + (words(v) ? ", " + words(v) : "") : this.fmt(v) + (this.unit === "pct" ? " percent" : " years");
    this.range.setAttribute("aria-valuetext", vt);
    this.words.textContent = this.unit === "inr" ? words(v) : "";
    var p = this.log ? this.range.value / 10 : ((v - this.min) / (this.max - this.min)) * 100;
    this.range.style.setProperty("--fill", p + "%");
    if (notify !== false && this.onChange) this.onChange();
  };

  /* ---------------- Charts ---------------- */
  var chartsReady = !!(window.Chart && window.ET_CHART && window.ET_CHART.init());
  var COL = (window.ET_CHART && window.ET_CHART.colors) || { slate: "#8B98AB", gold: "#C99A2E", text: "#5B6A7D", grid: "rgba(11,27,51,0.08)" };
  var tipINR = { callbacks: { label: function (c) { return " " + c.dataset.label + ": " + rupee(c.parsed.y != null ? c.parsed.y : c.parsed); } } };
  var axisINR = { ticks: { callback: function (v) { return ET.formatINRShort(v); }, maxTicksLimit: 6 }, grid: { color: COL.grid }, border: { display: false } };

  function donut(canvas) {
    if (!chartsReady) return null;
    return new Chart(canvas, {
      type: "doughnut",
      data: { labels: ["Invested", "Returns"], datasets: [{ data: [1, 1], backgroundColor: [COL.slate, COL.gold], borderWidth: 0, hoverOffset: 4 }] },
      options: { cutout: "72%", plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return " " + c.label + ": " + rupee(c.parsed); } } } } }
    });
  }
  function bars(canvas, withLine) {
    if (!chartsReady) return null;
    var ds = [
      { label: "Invested", data: [], backgroundColor: COL.slate, stack: "s", borderRadius: 2, maxBarThickness: 36, order: 2 },
      { label: "Returns", data: [], backgroundColor: COL.gold, stack: "s", borderRadius: 2, maxBarThickness: 36, order: 2 }
    ];
    if (withLine) ds.push({ label: "Goal", type: "line", data: [], borderColor: COL.text || "#5B6A7D", borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0, order: 1 });
    return new Chart(canvas, {
      type: "bar",
      data: { labels: [], datasets: ds },
      options: {
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { display: false }, tooltip: tipINR },
        scales: { x: { stacked: true, grid: { display: false }, ticks: { maxRotation: 0, autoSkipPadding: 8 } }, y: Object.assign({ stacked: true }, axisINR) }
      }
    });
  }
  function line(canvas) {
    if (!chartsReady) return null;
    return new Chart(canvas, {
      type: "line",
      data: { labels: [], datasets: [{ label: "Value", data: [], borderColor: COL.gold, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.25, fill: true,
        backgroundColor: function (ctx) { return window.ET_CHART.gradient(ctx.chart.ctx, ctx.chart.chartArea, COL.goldFill || "rgba(226,177,60,0.2)"); } }] },
      options: { interaction: { mode: "index", intersect: false }, plugins: { legend: { display: false }, tooltip: tipINR },
        scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkipPadding: 8 } }, y: axisINR } }
    });
  }
  function setDonut(ch, invested, returns) {
    if (!ch) return;
    ch.data.datasets[0].data = [Math.max(invested, 0), Math.max(returns, 0)];
    ch.update();
  }
  function setBars(ch, rows, goal) {
    if (!ch) return;
    ch.data.labels = rows.map(function (r) { return "Yr " + r.year; });
    ch.data.datasets[0].data = rows.map(function (r) { return Math.round(r.invested); });
    ch.data.datasets[1].data = rows.map(function (r) { return Math.max(0, Math.round(r.value - r.invested)); });
    if (goal != null) ch.data.datasets[2].data = rows.map(function () { return Math.round(goal); });
    ch.update();
  }

  /* ---------------- Tool panels ---------------- */
  function Tool(name, compute) {
    var panel = document.getElementById("panel-" + name);
    var self = this;
    this.name = name; this.panel = panel; this.fields = {}; this.charts = null;
    var t;
    var recalc = function () { self.render(); clearTimeout(t); t = setTimeout(function () { self.announce(); }, 700); };
    panel.querySelectorAll(".cf").forEach(function (el) { var f = new Field(el, recalc); self.fields[f.key] = f; });
    this.compute = compute;
    this.recalc = recalc;
    var btn = panel.querySelector("[data-share]");
    if (btn) btn.addEventListener("click", function () { share(self, btn); });
  }
  Tool.prototype.values = function () {
    var o = {};
    for (var k in this.fields) if (!this.fields[k].el.hidden) o[k] = this.fields[k].value;
    return o;
  };
  Tool.prototype.out = function (map) {
    var p = this.panel;
    Object.keys(map.inr || {}).forEach(function (k) {
      var v = map.inr[k];
      p.querySelectorAll('[data-out="' + k + '"]').forEach(function (el) { el.textContent = rupee(v); });
      p.querySelectorAll('[data-short="' + k + '"]').forEach(function (el) { el.textContent = short(v); });
    });
    Object.keys(map.text || {}).forEach(function (k) {
      p.querySelectorAll('[data-out-text="' + k + '"]').forEach(function (el) { el.textContent = map.text[k]; });
    });
  };
  Tool.prototype.render = function () {
    if (this.panel.hidden) { this.stale = true; return; }
    this.stale = false;
    this.summary = this.compute(this, this.values());
  };
  Tool.prototype.announce = function () {
    var s = this.panel.querySelector("[data-summary]");
    if (s && this.summary) s.textContent = this.summary;
  };

  // Totals are rounded first, then returns = total − invested, so the three figures always add up to the rupee.
  var tools = {
    sip: new Tool("sip", function (t, v) {
      if (!t.charts) t.charts = { d: donut(document.getElementById("sip-donut")), b: bars(document.getElementById("sip-bars")) };
      var r = C.sipSchedule(v.amt, v.r, v.y, v.su);
      var tot = Math.round(r.value), inv = Math.round(r.invested), ret = tot - inv;
      t.out({ inr: { invested: inv, returns: ret, total: tot },
        text: { multiple: nf2.format(tot / inv) + "×",
          note: v.su > 0 ? "Your instalment rises " + v.su + "% a year, reaching " + rupee(r.lastInstalment) + " a month in year " + v.y + "." : "Instalments at the start of each month; monthly compounding at " + pct(v.r, 1).replace(".0%", "%") + " a year." } });
      setDonut(t.charts.d, inv, ret);
      setBars(t.charts.b, r.years);
      return "Investing " + rupee(v.amt) + " a month for " + v.y + " years: invested " + rupee(inv) + ", estimated returns " + rupee(ret) + ", total value " + rupee(tot) + ".";
    }),
    lumpsum: new Tool("lumpsum", function (t, v) {
      if (!t.charts) t.charts = { d: donut(document.getElementById("ls-donut")), b: bars(document.getElementById("ls-bars")) };
      var r = C.lumpsumSchedule(v.amt, v.r, v.y);
      var tot = Math.round(r.value), inv = Math.round(r.invested), ret = tot - inv;
      var dbl = Math.log(2) / Math.log(1 + v.r / 100);
      t.out({ inr: { invested: inv, returns: ret, total: tot },
        text: { multiple: nf2.format(tot / inv) + "×", note: "At this rate money doubles roughly every " + nf2.format(Math.round(dbl * 10) / 10) + " years." } });
      setDonut(t.charts.d, inv, ret);
      setBars(t.charts.b, r.years);
      return "A lump sum of " + rupee(inv) + " for " + v.y + " years: estimated returns " + rupee(ret) + ", total value " + rupee(tot) + ".";
    }),
    goal: new Tool("goal", function (t, v) {
      if (!t.charts) t.charts = { b: bars(document.getElementById("goal-bars"), true) };
      var g = C.goalPlan(v.tgt, v.y, v.inf, v.r);
      var sip = Math.round(g.sip);
      t.out({ inr: { future: g.future, sip: sip, lump: g.lump, invested: sip * v.y * 12 },
        text: { note: "At " + pct(v.inf, 1).replace(".0%", "%") + " inflation, " + rupee(v.tgt) + " today costs about " + rupee(g.future) + " in " + v.y + (v.y === 1 ? " year." : " years.") } });
      setBars(t.charts.b, C.sipSchedule(g.sip, v.r, v.y, 0).years, g.future);
      return "Goal of " + rupee(v.tgt) + " in today's money becomes " + rupee(g.future) + ". Monthly SIP needed " + rupee(sip) + ", or a lump sum today of " + rupee(g.lump) + ".";
    }),
    cagr: new Tool("cagr", function (t, v) {
      if (!t.charts) t.charts = { l: line(document.getElementById("cagr-line")) };
      var mode = cagrMode(), rate, fin;
      if (mode === "fv") { rate = v.c; fin = C.fvFromCagr(v.iv, rate, v.y); }
      else { fin = v.fv; rate = C.cagr(v.iv, fin, v.y); }
      var gain = Math.round(fin) - Math.round(v.iv);
      t.out({ inr: { gain: gain },
        text: { headLabel: mode === "fv" ? "Final value" : "CAGR",
          head: mode === "fv" ? rupee(fin) : pct(rate, 2),
          headShort: mode === "fv" ? short(fin) : "",
          abs: pct((fin / v.iv - 1) * 100, 1),
          multiple: nf2.format(fin / v.iv) + "×",
          note: mode === "fv" ? "Compounded once a year at " + pct(rate, 1) + "." : rupee(v.iv) + " growing to " + rupee(fin) + " is the same as earning " + pct(rate, 2) + " every year." } });
      if (t.charts.l) {
        var labels = [], data = [], n = Math.ceil(v.y);
        for (var y = 0; y <= n; y++) { var yy = Math.min(y, v.y); labels.push(yy === 0 ? "Start" : "Yr " + nf2.format(yy)); data.push(Math.round(C.fvFromCagr(v.iv, rate, yy))); }
        t.charts.l.data.labels = labels; t.charts.l.data.datasets[0].data = data; t.charts.l.update();
      }
      return mode === "fv" ? "Final value " + rupee(fin) + " after " + v.y + " years at " + pct(rate, 1) + "." : "CAGR " + pct(rate, 2) + " over " + v.y + " years.";
    })
  };

  /* CAGR mode toggle: show the field that is an input in this mode. */
  var cagrPanel = document.getElementById("panel-cagr");
  function cagrMode() { var c = cagrPanel.querySelector('input[name="cagr-mode"]:checked'); return c ? c.value : "cagr"; }
  function setCagrMode(mode) {
    var r = cagrPanel.querySelector('input[name="cagr-mode"][value="' + mode + '"]');
    if (r) r.checked = true;
    cagrPanel.querySelectorAll(".cf[data-mode]").forEach(function (el) { el.hidden = el.getAttribute("data-mode") !== mode; });
  }
  cagrPanel.querySelectorAll('input[name="cagr-mode"]').forEach(function (r) {
    r.addEventListener("change", function () { setCagrMode(cagrMode()); tools.cagr.recalc(); });
  });

  /* ---------------- Share links: #sip?amt=10000&r=12&y=10 ---------------- */
  function shareURL(tool) {
    var q = [];
    var vals = tool.values();
    if (tool.name === "cagr") q.push("mode=" + cagrMode());
    Object.keys(vals).forEach(function (k) { q.push(k + "=" + encodeURIComponent(+vals[k].toFixed(2))); });
    return location.origin + location.pathname + "#" + tool.name + "?" + q.join("&");
  }
  function share(tool, btn) {
    var url = shareURL(tool), status = btn.parentNode.querySelector(".share__status");
    history.replaceState(null, "", url.slice(url.indexOf("#")));
    var done = function (ok) {
      status.textContent = ok ? "Link copied" : "Copy this link: " + url;
      status.classList.toggle("is-long", !ok);
      clearTimeout(status._t);
      if (ok) status._t = setTimeout(function () { status.textContent = ""; }, 3000);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(fallbackCopy(url)); });
    else done(fallbackCopy(url));
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }
  function parseHash() {
    var h = "";
    try { h = decodeURIComponent(location.hash.replace(/^#/, "")); } catch (e) { h = ""; }
    var parts = h.split("?"), name = parts[0], params = {};
    (parts[1] || "").split("&").forEach(function (kv) {
      var i = kv.indexOf("="); if (i > 0) params[kv.slice(0, i)] = kv.slice(i + 1);
    });
    return { tab: TOOLS.indexOf(name) >= 0 ? name : null, params: params };
  }
  function applyParams(name, params) {
    var tool = tools[name];
    if (!tool) return;
    if (name === "cagr" && (params.mode === "fv" || params.mode === "cagr")) setCagrMode(params.mode);
    Object.keys(params).forEach(function (k) {
      var f = tool.fields[k], v = parseFloat(params[k]);
      if (f && isFinite(v)) f.set(v, false);
    });
  }

  /* ---------------- Tabs (WAI-ARIA tabs, automatic activation) ---------------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tablist [role="tab"]'));
  function select(name, opts) {
    opts = opts || {};
    tabs.forEach(function (tab) {
      var on = tab.getAttribute("data-tab") === name;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !on;
      if (on) {
        if (opts.focus) tab.focus();
        var list = tab.parentNode;
        if (list.scrollWidth > list.clientWidth) list.scrollTo({ left: tab.offsetLeft - 16, behavior: window.ET && ET.reduceMotion ? "auto" : "smooth" });
      }
    });
    var tool = tools[name];
    if (tool) tool.render();
    if (opts.hash !== false) history.replaceState(null, "", "#" + name);
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { select(tab.getAttribute("data-tab")); });
    tab.addEventListener("keydown", function (e) {
      var k = e.key, j = null;
      if (k === "ArrowRight") j = (i + 1) % tabs.length;
      else if (k === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      else if (k === "Home") j = 0;
      else if (k === "End") j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      select(tabs[j].getAttribute("data-tab"), { focus: true });
    });
  });

  // Hero index links and any in-page #tool link: select the tab, then bring the tools into view.
  function fromHash(scroll) {
    var h = parseHash();
    if (!h.tab) return false;
    applyParams(h.tab, h.params);
    select(h.tab, { hash: false });
    if (scroll) document.getElementById("tools").scrollIntoView({ behavior: window.ET && ET.reduceMotion ? "auto" : "smooth" });
    return true;
  }
  window.addEventListener("hashchange", function () { fromHash(true); });

  /* ---------------- Risk-profile quiz ---------------- */
  var NAMES = {
    "equity-portfolio": "Long-term Equity Portfolio Management",
    "options-selling": "Index Options Selling (Nifty/Sensex) using Collateral Margins",
    "weekly-expiry": "Weekly Expiry Trading Strategies",
    "ipo": "IPO Research & Premium Listing Strategies",
    "intraday-swing": "Intraday & Swing Trading",
    "gold-silver": "Commodity Investments in Gold & Silver ETFs",
    "mtf": "Margin Trading Fund (MTF) Optimization",
    "risk-management": "Comprehensive Portfolio Structuring & Risk Management"
  };
  var DESC = {
    Conservative: "You put protecting what you have ahead of growing it quickly. A plan for you would lean on diversification, a clear asset allocation and steady long-term holdings, with no leverage and no derivatives.",
    Moderate: "You accept some ups and downs for better long-term growth, but large drawdowns would worry you. A balanced mix of quality equity and diversifiers such as gold and silver, held with discipline, suits this profile.",
    Growth: "You are comfortable with volatility in pursuit of higher long-term returns, and you have the time to ride out falls. Equity compounding could be paired with carefully sized, risk-controlled options income.",
    Aggressive: "You have a long horizon, experience and the temperament to stay calm through sharp falls. A wider set of strategies, including shorter-term and derivative approaches, could be discussed, always within strict risk limits."
  };
  var quizForm = document.querySelector(".quiz__form");
  var resBox = document.querySelector("[data-quiz-result]");
  var bar = document.querySelector(".quiz__bar span");
  var lastProfile = null;
  var quizStatus = document.querySelector("[data-quiz-status]");
  function quizUpdate() {
    var answers = [], n = 0;
    for (var q = 1; q <= 7; q++) {
      var c = quizForm.querySelector('input[name="q' + q + '"]:checked');
      answers.push(c ? +c.value : 0); if (c) n++;
      var fs = quizForm.querySelector('input[name="q' + q + '"]').closest(".q");
      fs.classList.toggle("is-done", !!c);
    }
    document.querySelector("[data-answered]").textContent = n;
    bar.style.width = (n / 7 * 100) + "%";
    if (n < 7) { resBox.hidden = true; lastProfile = null; quizStatus.textContent = ""; return; }
    var r = C.riskProfile(answers);
    resBox.hidden = false;
    resBox.querySelector("[data-profile-name]").textContent = r.profile;
    resBox.querySelector("[data-score]").textContent = r.score;
    resBox.querySelector("[data-capped]").textContent = r.capped ? " · adjusted for " + r.capReason : "";
    resBox.querySelector("[data-profile-desc]").textContent = DESC[r.profile];
    resBox.querySelectorAll(".meter li").forEach(function (li, i) {
      li.classList.toggle("is-on", i <= r.level);
      if (i === r.level) li.setAttribute("aria-current", "true"); else li.removeAttribute("aria-current");
    });
    var ids = C.strategiesFor(r.profile), hasFno = false;
    resBox.querySelector("[data-strategies]").innerHTML = ids.map(function (id) {
      var f = C.FNO.indexOf(id) >= 0; if (f) hasFno = true;
      return '<li><a href="/services.html#' + id + '"><span>' + NAMES[id].replace(/&/g, "&amp;") + "</span>" +
        (f ? '<span class="badge badge--loss">Higher risk</span>' : "") + '<svg aria-hidden="true"><use href="/assets/img/icons.svg#i-arrow"/></svg></a></li>';
    }).join("");
    resBox.querySelector("[data-fno-note]").hidden = !hasFno;
    resBox.querySelector("[data-profile-cta]").href = "/contact.html?profile=" + encodeURIComponent(r.profile) + "#consult";
    quizStatus.textContent = " Your profile: " + r.profile + ".";
    if (lastProfile === null) resBox.scrollIntoView({ block: "nearest", behavior: window.ET && ET.reduceMotion ? "auto" : "smooth" });
    lastProfile = r.profile;
  }
  quizForm.addEventListener("change", quizUpdate);
  document.querySelector("[data-quiz-reset]").addEventListener("click", function () {
    quizForm.reset(); quizUpdate();
    quizForm.querySelector("input").focus();
  });

  /* ---------------- Init ---------------- */
  if (!fromHash(!!location.hash)) select("sip", { hash: false });
  quizUpdate();
})();
