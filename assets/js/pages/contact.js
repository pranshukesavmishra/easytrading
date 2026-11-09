/* Contact page: consultation form validation and hand-off (endpoint, WhatsApp or email). */
(function () {
  "use strict";
  var SITE = window.SITE || {};
  var WA = SITE.whatsapp || "919891722514";
  var EMAIL = SITE.emailPrimary || "contact@easytrading.co.in";

  var form = document.getElementById("consult-form");
  if (!form) return;
  var summary = document.getElementById("error-summary");
  var status = document.getElementById("form-status");
  var success = document.getElementById("form-success");
  var hint = document.getElementById("handoff-hint");
  var submitLabel = form.querySelector(".submit-label");

  var f = {
    name: document.getElementById("f-name"),
    phone: document.getElementById("f-phone"),
    email: document.getElementById("f-email"),
    city: document.getElementById("f-city"),
    amount: document.getElementById("f-amount"),
    message: document.getElementById("f-message"),
    consent: document.getElementById("f-consent"),
    website: document.getElementById("f-website")
  };

  /* ---------- Prefill from the risk-profile quiz: ?profile=Moderate ---------- */
  var PROFILES = ["Conservative", "Moderate", "Growth", "Aggressive"];
  try {
    var profile = new URLSearchParams(window.location.search).get("profile");
    if (profile && PROFILES.indexOf(profile) !== -1 && !f.message.value) {
      f.message.value = "My risk-profile self-assessment result: " + profile;
    }
  } catch (e) { /* URLSearchParams unsupported: skip prefill */ }

  /* ---------- Validation ---------- */
  function normalisePhone(v) {
    var d = String(v).replace(/[\s\-().]/g, "");
    if (/^\+91/.test(d)) d = d.slice(3);
    else if (/^0091/.test(d)) d = d.slice(4);
    else if (/^91\d{10}$/.test(d)) d = d.slice(2);
    else if (/^0\d{10}$/.test(d)) d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d) ? d : null;
  }
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var rules = [
    { el: f.name, test: function () { return f.name.value.trim().length >= 2; }, msg: "Enter your name." },
    { el: f.phone, test: function () { return !!normalisePhone(f.phone.value); },
      msg: function () { return f.phone.value.trim() ? "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9." : "Enter your mobile number."; } },
    { el: f.email, test: function () { var v = f.email.value.trim(); return !v || emailRe.test(v); },
      msg: "Enter a valid email address, for example name@example.com." },
    { el: f.email, test: function () { return method() !== "Email" || f.email.value.trim(); },
      msg: "Enter your email address, or choose WhatsApp or Call as your contact method." },
    { el: f.consent, test: function () { return f.consent.checked; }, msg: "Please confirm you agree to be contacted." }
  ];

  function method() {
    var r = form.querySelector('input[name="method"]:checked');
    return r ? r.value : "WhatsApp";
  }
  function errEl(input) { return document.getElementById(input.id + "-err"); }
  function setError(input, message) {
    var e = errEl(input);
    if (message) { input.setAttribute("aria-invalid", "true"); if (e) e.textContent = message; }
    else { input.removeAttribute("aria-invalid"); if (e) e.textContent = ""; }
  }
  function validate() {
    var errors = [], seen = {};
    [f.name, f.phone, f.email, f.consent].forEach(function (el) { setError(el, ""); });
    rules.forEach(function (r) {
      if (seen[r.el.id]) return;
      if (!r.test()) {
        var m = typeof r.msg === "function" ? r.msg() : r.msg;
        seen[r.el.id] = true;
        setError(r.el, m);
        errors.push({ el: r.el, msg: m });
      }
    });
    return errors;
  }
  function showSummary(errors) {
    var ul = summary.querySelector("ul");
    ul.innerHTML = "";
    errors.forEach(function (er) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + er.el.id;
      a.textContent = er.msg;
      a.addEventListener("click", function (ev) { ev.preventDefault(); er.el.focus(); });
      li.appendChild(a);
      ul.appendChild(li);
    });
    summary.hidden = false;
    summary.focus();
  }

  // Re-validate a field once it has been flagged, so errors clear as the user fixes them.
  [f.name, f.phone, f.email].forEach(function (el) {
    el.addEventListener("blur", function () { if (el.getAttribute("aria-invalid") === "true") validate(); });
    el.addEventListener("input", function () { if (el.getAttribute("aria-invalid") === "true") validate(); });
  });
  f.consent.addEventListener("change", function () { if (f.consent.getAttribute("aria-invalid") === "true") validate(); });

  /* ---------- Hand-off copy reflects the chosen method ---------- */
  function updateHint() {
    if (SITE.formEndpoint) { hint.textContent = "Your details are sent securely to Easy Trading."; return; }
    var m = method();
    hint.textContent = m === "Email"
      ? "Submitting opens your email app with your details pre-filled, so you can review them before sending."
      : "Submitting opens WhatsApp with your details pre-filled, so you can review them before sending.";
  }
  form.querySelectorAll('input[name="method"]').forEach(function (r) { r.addEventListener("change", updateHint); });
  updateHint();

  /* ---------- Message composition ---------- */
  function collect() {
    return {
      name: f.name.value.trim(),
      phone: "+91 " + normalisePhone(f.phone.value),
      email: f.email.value.trim(),
      city: f.city.value.trim(),
      interests: Array.prototype.map.call(form.querySelectorAll('input[name="interest"]:checked'), function (c) { return c.value; }),
      amount: f.amount.value,
      method: method(),
      message: f.message.value.trim()
    };
  }
  function compose(d) {
    var lines = [
      "Hello Easy Trading, I'd like to book a free consultation.",
      "",
      "Name: " + d.name,
      "Mobile: " + d.phone
    ];
    if (d.email) lines.push("Email: " + d.email);
    if (d.city) lines.push("City: " + d.city);
    if (d.interests.length) lines.push("Interested in: " + d.interests.join(", "));
    if (d.amount) lines.push("Investable amount: " + d.amount);
    lines.push("Preferred contact: " + d.method);
    if (d.message) { lines.push("", "Message:", d.message); }
    return lines.join("\n");
  }

  /* ---------- Success / reset ---------- */
  function showSuccess(d, opts) {
    opts = opts || {};
    form.hidden = true;
    success.hidden = false;
    success.querySelector(".success-name").textContent = d.name ? ", " + d.name.split(/\s+/)[0] : "";
    var text = success.querySelector(".success-text");
    var fb = success.querySelector(".success-fallback");
    if (opts.link) {
      text.textContent = d.method === "Email"
        ? "Your email app should now be open with your request ready. Press send and we'll reply as soon as we can."
        : "WhatsApp should now be open with your request ready. Press send and we'll reply as soon as we can.";
      var a = document.getElementById("success-link");
      a.href = opts.link;
      if (/^mailto:/.test(opts.link)) a.removeAttribute("target"); else a.setAttribute("target", "_blank");
      fb.hidden = false;
    } else {
      text.textContent = "We've received your request and will be in touch soon on your preferred channel.";
      fb.hidden = true;
    }
    success.focus();
  }
  document.getElementById("form-reset").addEventListener("click", function () {
    form.reset();
    updateHint();
    success.hidden = true;
    form.hidden = false;
    summary.hidden = true;
    f.name.focus();
  });

  /* ---------- Submit ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.textContent = "";
    status.classList.remove("is-error");

    var errors = validate();
    if (errors.length) { showSummary(errors); return; }
    summary.hidden = true;

    var d = collect();
    // Honeypot filled: almost certainly a bot. Pretend success, send nothing.
    if (f.website.value) { showSuccess(d); return; }

    if (SITE.formEndpoint) {
      form.classList.add("is-busy");
      submitLabel.textContent = "Sending…";
      fetch(SITE.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: d.name, phone: d.phone, email: d.email, city: d.city,
          interests: d.interests.join(", "), amount: d.amount, method: d.method,
          message: d.message, consent: true, page: window.location.pathname,
          _subject: "New consultation request: " + d.name
        })
      }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        showSuccess(d);
      }).catch(function () {
        status.classList.add("is-error");
        status.innerHTML = "";
        status.appendChild(document.createTextNode("Sorry, your request could not be sent. Please try again, or message us on "));
        var a = document.createElement("a");
        a.className = "gold";
        a.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(compose(d));
        a.target = "_blank"; a.rel = "noopener";
        a.textContent = "WhatsApp";
        status.appendChild(a);
        status.appendChild(document.createTextNode("."));
      }).then(function () {
        form.classList.remove("is-busy");
        submitLabel.textContent = "Send my request";
      });
      return;
    }

    var body = compose(d);
    var link;
    if (d.method === "Email") {
      link = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Consultation request: " + d.name) + "&body=" + encodeURIComponent(body);
      window.location.href = link;
    } else {
      link = "https://wa.me/" + WA + "?text=" + encodeURIComponent(body);
      window.open(link, "_blank", "noopener");
    }
    showSuccess(d, { link: link });
  });
})();
