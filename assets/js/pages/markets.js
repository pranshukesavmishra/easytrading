/* Market Desk: IST clock and an honest market-status badge (NSE/BSE cash session, Mon to Fri 09:15 to 15:30 IST).
   Exchange holidays are not modelled, so the badge reads "Market open" only inside regular hours on weekdays. Widgets are mounted by main.js. */
(function () {
  "use strict";
  var el = document.querySelector("[data-desk-time]");
  var badge = document.querySelector("[data-market-status]");
  var label = document.querySelector("[data-market-label]");
  if (!window.Intl) return;
  var fmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, weekday: "short" });
  var parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short", hour: "numeric", minute: "numeric", hour12: false });
  function isOpen(d) {
    var o = {};
    parts.formatToParts(d).forEach(function (p) { o[p.type] = p.value; });
    if (o.weekday === "Sat" || o.weekday === "Sun") return false;
    var m = (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10);
    return m >= 555 && m < 930; // 09:15 to 15:30
  }
  function tick() {
    var now = new Date();
    if (el) el.textContent = fmt.format(now);
    if (badge && label) {
      var open = isOpen(now);
      badge.setAttribute("data-state", open ? "open" : "closed");
      label.textContent = open ? "Market open" : "Market closed";
    }
  }
  tick();
  setInterval(tick, 1000);
})();
