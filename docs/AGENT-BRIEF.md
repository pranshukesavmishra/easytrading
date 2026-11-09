# Brief for page-building agents

You are building part of a premium website for **Easy Trading**, a real investment management client.
The bar is "best in the world" for a boutique wealth/portfolio firm: editorial, calm, data-rich, flawless.

## Read first (mandatory)
1. `CLAUDE.md` (rules), `docs/PLAN.md` (architecture, verified TradingView symbols), `docs/CLIENT-FACTS.md` (the ONLY source of client claims)
2. Reference implementation: `index.html`, `assets/css/main.css`, `assets/css/pages/home.css`, `assets/js/main.js`, `assets/js/charts.js`, `assets/js/pages/home.js`, `assets/img/icons.svg`

## Hard rules
- **Never invent facts**: no names of people, testimonials, awards, registration numbers, hours, minimum investment amounts, fees, new statistics or addresses. Quote figures exactly as in CLIENT-FACTS.md. You MAY write explanatory or educational copy (how a strategy works in general, its risks) because that is not a factual claim about the client.
- Compliance: never say "guaranteed", "assured", "risk-free", or "consistent returns irrespective of market". Wrap every returns figure or performance element in an element with the `data-performance` attribute (config can hide them). Label calculators "illustrative".
- Start every page by copying the skeleton of `index.html`: same `<head>` structure (unique title, description, canonical, OG and Twitter tags with the og-image URL), `<!-- @head --><!-- /@head -->`, `<!-- @header --><!-- /@header -->`, `<main id="main">`, `<!-- @footer --><!-- /@footer -->`, `<html lang="en-IN" class="no-js">`. Use root-relative URLs (`/about.html`).
- Inner pages start with the `.page-hero` pattern (breadcrumb `<ol class="breadcrumb">`, eyebrow, h1 with an `<em class="serif-i">` accent, lead).
- Use design-system classes and tokens from `main.css` (container, section, section--alt, grid-*, split, card, card--hover, icon, eyebrow, h2, lead, btn, badge, note, faq, table.data, check-list, cta-band, stat, reveal, …). Icons: `<svg aria-hidden="true"><use href="/assets/img/icons.svg#i-NAME"/></svg>`.
- **Do NOT edit** shared files: `assets/css/main.css`, `assets/js/main.js`, `assets/js/charts.js`, `assets/js/config.js`, `partials/*`, `index.html`, `scripts/*`, `docs/*`. Put page styles in `assets/css/pages/<page>.css` and scripts in `assets/js/pages/<page>.js`. If you think a shared change is needed, describe it in your final report instead.
- Charts: Chart.js 4.4.1 from `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js` (defer), then `/assets/js/charts.js`, then your page script. Use `ET_CHART.init()`, `ET_CHART.colors`, `ET_DATA` and `ET.formatINR`. Every canvas gets `role="img"` and a descriptive `aria-label`.
- Live market widgets: only the verified symbols in `docs/PLAN.md` §8, mounted via `.tv-embed` (see main.js). Give each embed container an explicit height in CSS so the layout does not jump.
- Accessibility: semantic headings in order, one h1, labelled form controls, alt text, visible focus, contrast AA, 44px tap targets.
- Mobile: no horizontal overflow at 390px, 16px gutters.
- Plain HTML/CSS/vanilla JS. No frameworks, no build tools beyond `node scripts/build.mjs`.

## Workflow
1. Write your files.
2. Run `node scripts/build.mjs` from the repo root (stamps header/footer/head into pages; idempotent).
3. A static server is already running on http://localhost:8080 (if not: `cd /home/user/easytrading && python3 -m http.server 8080 &`).
   Run `node scripts/shoot.cjs /yourpage.html <scratch-dir>`. It prints console errors, 404s, hidden reveals and horizontal overflow, and saves desktop and mobile screenshots. LOOK at the screenshots (Read the PNGs; crop tall ones with Python PIL into ~2000px slices first) and fix every visual problem. Repeat until clean: 0 errors, 0 overflow.
4. Do NOT git commit or push; the lead does that.
5. Final report: files created, a short summary of each section, any client facts you needed but could not verify, and any shared-file changes you recommend.

## DESIGN DIRECTION UPDATE (owner request): bespoke identity, must NOT look like a generic AI/template site
The lead is re-skinning the shared `main.css` right now. Shared class NAMES stay the same, so keep using them. In your page CSS and markup:
- Use ONLY the tokens (`var(--radius*)`, `var(--font-*)`, colours). Never hard-code border-radius, font-family or brand colours, so the new identity flows through.
- Avoid template clichés: no rounded "icon in a tinted square" feature tiles (use `.card .icon` markup; it gets restyled), no glassmorphism blobs, no emoji, no gradient pill buttons, no 3-identical-cards-in-a-row as the only layout. Prefer editorial layouts: big index numbers, hairline rules, asymmetric splits, data-dense tables, horizontal strips.
- Don't add new italic serif accent words. Keep any existing `<em class="serif-i">` markup (it is being restyled as a non-italic highlight).
- Copy style: avoid em-dashes (—) in visible copy; use commas, colons or full stops. Avoid cliché taglines like "No shortcuts", "Unlock", "Elevate", "Empower your journey", "In today's fast-paced world".
