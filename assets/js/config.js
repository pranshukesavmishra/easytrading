/* Easy Trading — site configuration (single source for tunable values).
   Facts here come from docs/CLIENT-FACTS.md. Open questions: docs/CLIENT-CHECKLIST.md. */
window.SITE = {
  name: "Easy Trading",
  phoneDisplay: "+91 98917 22514",
  phoneE164: "+919891722514",
  whatsapp: "919891722514",
  emailPrimary: "contact@easytrading.co.in",
  emailSecondary: "contact.easytrading@gmail.com",
  address: "Tower 5, UGF–A, Sahana Apartment, Chhatarpur, New Delhi – 110074, India",

  // Set to false to hide every performance/returns figure site-wide
  // (elements marked data-performance). Recommended if no SEBI registration is in place.
  showPerformance: true,

  // Fill in ONLY with numbers the client provides, e.g. [{ label: "SEBI RIA Reg. No.", value: "INA000000000" }].
  // When non-empty they render in the footer automatically.
  registrations: [],

  // Optional form backend (e.g. a Formspree/Web3Forms URL). Empty = form hands off to WhatsApp or email.
  formEndpoint: ""
};
