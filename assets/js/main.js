/* Easy Trading — shared behaviour for every page. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.remove("no-js");
  var SITE = window.SITE || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Formatting helpers (shared with page scripts) ---------- */
  var inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  window.ET = {
    reduceMotion: reduceMotion,
    formatINR: function (n) { return "₹" + inr.format(Math.round(n)); },
    // Compact Indian notation: 1,25,000 -> ₹1.25 L ; 2,40,00,000 -> ₹2.4 Cr
    formatINRShort: function (n) {
      var a = Math.abs(n), s = n < 0 ? "-" : "";
      if (a >= 1e7) return s + "₹" + trim(a / 1e7) + " Cr";
      if (a >= 1e5) return s + "₹" + trim(a / 1e5) + " L";
      return s + "₹" + inr.format(Math.round(a));
    },
    formatNum: function (n) { return inr.format(Math.round(n)); }
  };
  function trim(x) { return (Math.round(x * 100) / 100).toString(); }

  /* ---------- Config-driven content ---------- */
  if (SITE.showPerformance === false) {
    document.querySelectorAll("[data-performance]").forEach(function (el) { el.hidden = true; el.remove(); });
    document.querySelectorAll('a[href="/performance.html"]').forEach(function (a) {
      var li = a.closest("li"); (li || a).remove();
    });
  }
  var regBox = document.querySelector("[data-registrations]");
  if (regBox && Array.isArray(SITE.registrations) && SITE.registrations.length) {
    regBox.textContent = SITE.registrations.map(function (r) { return r.label + ": " + r.value; }).join(" · ");
    regBox.hidden = false;
  }
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Header ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var toggle = document.querySelector(".menu-toggle");
  var mobileNav = document.getElementById("mobile-nav");
  function setMenu(open) {
    doc.classList.toggle("menu-open", open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    if (mobileNav) {
      if (open) mobileNav.removeAttribute("inert"); else mobileNav.setAttribute("inert", "");
    }
  }
  if (toggle && mobileNav) {
    setMenu(false);
    toggle.addEventListener("click", function () { setMenu(!doc.classList.contains("menu-open")); });
    mobileNav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && doc.classList.contains("menu-open")) { setMenu(false); toggle.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1100) setMenu(false); });
  }

  /* ---------- Scroll progress bar ---------- */
  (function () {
    var bar = document.createElement("div");
    bar.className = "scroll-progress"; bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    var tick = false;
    function upd() {
      tick = false;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ")";
    }
    window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  })();

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Count-up numbers: <span data-count="40" data-prefix="" data-suffix="%+" data-decimals="0"> ---------- */
  function runCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var pre = el.getAttribute("data-prefix") || "";
    var suf = el.getAttribute("data-suffix") || "";
    var fmt = function (v) { return pre + v.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; };
    if (reduceMotion) { el.textContent = fmt(target); return; }
    var start = null, dur = 1600;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(target);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(runCount);
  }

  /* ---------- Deep links: re-align to #hash once fonts and layout settle ---------- */
  if (location.hash.length > 1) {
    var realign = function () {
      var t = null;
      try { t = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { t = null; }
      if (t) t.scrollIntoView({ block: "start" });
    };
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fontsReady.then(function () { setTimeout(realign, 60); });
    window.addEventListener("load", function () { setTimeout(realign, 60); });
  }

  /* ---------- Lazy TradingView embeds: <div class="tv-embed" data-tv="ticker-tape" data-tv-config='{...}'> ---------- */
  function mountTV(el) {
    if (el.dataset.mounted) return;
    el.dataset.mounted = "1";
    var type = el.getAttribute("data-tv");
    var cfg = {};
    try { cfg = JSON.parse(el.getAttribute("data-tv-config") || "{}"); } catch (e) { cfg = {}; }
    cfg.colorTheme = cfg.colorTheme || "light";
    cfg.locale = cfg.locale || "en";
    if (cfg.isTransparent === undefined) cfg.isTransparent = false;
    var wrap = document.createElement("div");
    wrap.className = "tradingview-widget-container";
    var inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    wrap.appendChild(inner);
    var s = document.createElement("script");
    s.src = "https://s3.tradingview.com/external-embedding/embed-widget-" + type + ".js";
    s.async = true;
    s.text = JSON.stringify(cfg);
    wrap.appendChild(s);
    el.appendChild(wrap);
  }
  var tvs = document.querySelectorAll(".tv-embed[data-tv]");
  if ("IntersectionObserver" in window) {
    var tvo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { mountTV(en.target); tvo.unobserve(en.target); } });
    }, { rootMargin: "300px 0px" });
    tvs.forEach(function (el) { tvo.observe(el); });
  } else {
    tvs.forEach(mountTV);
  }
})();
