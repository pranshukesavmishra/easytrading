# Items to confirm with the client before going live

## Must confirm (compliance)
1. **SEBI registration.** Is Easy Trading (or a team member) registered as a SEBI Investment Adviser (RIA),
   Research Analyst (RA), or PMS, or an AMFI-registered MF distributor (ARN)? In India, paid advisory and
   portfolio management need SEBI registration, and SEBI's advertisement rules restrict publishing return
   or performance claims. If registered, add the numbers to `assets/js/config.js` (`registrations`) and they
   appear in the footer automatically. If not, we strongly recommend turning off the performance section
   (`showPerformance: false`) and checking the wording with a compliance adviser.
2. **Performance figures** (2020–2024 yearly returns, 40%+ CAGR, ₹50 Cr, 98% retention): are these audited?
   Gross or net of fees? Which portfolio or composite? The site currently labels them "client-reported, unaudited".
3. **"15+ years experience"** vs "established 2020": the site words this as the team's combined/market
   experience. Please confirm.
4. **"Award-Winning"** (on the old site): which award? This claim was left out until it can be named.
5. **2025 return figure**: the old site stops at 2024. Add it if available.

## Nice to have
6. Founder or team names, photos and NISM certificate numbers for the About page (currently generic).
7. Client testimonials with written consent (none were invented).
8. Business hours: not shown on the site until the client provides them.
9. Form handling: the contact form opens WhatsApp or email with a prefilled message (works with no
   backend). For a server inbox, add a Formspree/Web3Forms endpoint in `config.js` (`formEndpoint`).
10. Instagram, LinkedIn or X handles, if any.
11. A Google Business profile link for the map.
