/* Services page: highlight the in-page sub-nav chip for the strategy in view. */
(function () {
  "use strict";
  var nav = document.querySelector(".svc-nav");
  if (!nav || !("IntersectionObserver" in window)) return;
  var links = {};
  nav.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
  var current = null;

  function setActive(id) {
    if (id === current) return;
    current = id;
    Object.keys(links).forEach(function (k) {
      var on = k === id;
      links[k].classList.toggle("is-active", on);
      if (on) links[k].setAttribute("aria-current", "true"); else links[k].removeAttribute("aria-current");
    });
    var a = links[id];
    if (a) {
      // keep the active chip visible inside the horizontally scrolling list
      var ul = a.closest("ul");
      var left = a.offsetLeft - (ul.clientWidth - a.offsetWidth) / 2;
      ul.scrollTo({ left: Math.max(0, left), behavior: window.ET && ET.reduceMotion ? "auto" : "smooth" });
    }
  }

  var visible = {};
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
    var ids = Object.keys(links).filter(function (k) { return visible[k]; });
    if (ids.length) setActive(ids[0]); else if (window.scrollY < document.getElementById(Object.keys(links)[0]).offsetTop) setActive(null);
  }, { rootMargin: "-40% 0px -55% 0px" });

  Object.keys(links).forEach(function (id) {
    var sec = document.getElementById(id);
    if (sec) io.observe(sec);
  });
})();

/* Bento cards: soft spotlight that follows the pointer (fine pointers, motion allowed). */
(function () {
  "use strict";
  if (window.ET && ET.reduceMotion) return;
  if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.querySelectorAll(".bento").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });
})();
