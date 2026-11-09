/* Market Desk: IST clock in the hero status panel. Widgets are mounted by main.js (.tv-embed). */
(function () {
  "use strict";
  var el = document.querySelector("[data-desk-time]");
  if (!el || !window.Intl) return;
  var fmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, weekday: "short" });
  function tick() { el.textContent = fmt.format(new Date()); }
  tick();
  setInterval(tick, 1000);
})();
