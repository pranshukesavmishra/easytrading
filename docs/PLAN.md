# Easy Trading — Premium Website Plan

## 1. What we learned from the current site (easytrading.co.in, crawled 2026-11-09)
- Single-page React app on GoDaddy cPanel hosting. One long scroll, no sub-pages, no SEO depth,
  no tools, no market content, empty OG image, generic copy, and an empty white block below the hero.
- Verified facts are recorded in `docs/CLIENT-FACTS.md` and are the **only** source for client claims.

## 2. Positioning
"Institutional-grade discipline for individual investors." The site must feel like a private
wealth desk: calm, precise, data-rich and trustworthy. It should not look like a flashy tip-selling
trading site. The brand comes from the logo: deep ink background with a gold ₹ accent.

## 3. Design system
| Token | Value | Use |
|---|---|---|
| Ink | `#070B14` / `#0C1322` / `#111A2E` | backgrounds, layered surfaces |
| Gold | `#F5B800` → `#FFD369` | brand accent, CTAs, the ₹ |
| Gain | `#22C55E`-family | positive numbers only |
| Loss | `#F43F5E`-family | negative numbers only |
| Text | `#EEF2F8` / `#9AA6BD` | body / muted |
- Type: *Fraunces* (editorial serif headlines), *Inter* (UI/body), *JetBrains Mono* (numbers and tickers).
- Motion: subtle reveal-on-scroll, animated candlestick hero canvas, count-up stats, all off under
  `prefers-reduced-motion`.
- Mobile first. 16px gutters, no horizontal scroll, 44px tap targets, WCAG AA contrast.

## 4. Information architecture (static multi-page, no build step needed to host)
| Page | Purpose |
|---|---|
| `index.html` | Hero + live market ticker, stats, services, performance snapshot, philosophy, process, CTA |
| `about.html` | Story since 2020, philosophy, vision and values, team credentials (NISM), timeline |
| `services.html` | All 8 strategies in depth: who it's for, how it works, risk level, horizon |
| `performance.html` | Year-wise returns vs Nifty 50, ₹1 lakh growth chart, return mix, methodology and disclaimers |
| `markets.html` | "Market Desk": live TradingView widgets (indices, Nifty heatmap, gold/silver, chart, calendar) + YouTube |
| `tools.html` | SIP, Lumpsum, Goal planner, CAGR calculators + investor risk-profile quiz |
| `contact.html` | Consultation form (WhatsApp / email hand-off), phone, email, map, hours, FAQ |
| `legal/disclaimer.html`, `legal/privacy.html`, `legal/terms.html` | Compliance pages |
| `404.html`, `robots.txt`, `sitemap.xml`, `site.webmanifest`, `.htaccess` | Production plumbing |

## 5. Engineering
- Plain HTML/CSS/JS, so it can be uploaded straight to cPanel `public_html`.
- Shared header and footer live in `partials/`. `node scripts/build.mjs` stamps them into every page
  between `<!-- @header -->`/`<!-- @footer -->` markers, so nav is real HTML (SEO) with one source of truth.
- `assets/css/main.css` holds the design system. Page-specific CSS/JS goes in `assets/css/pages/`, `assets/js/pages/`.
- Charts use Chart.js 4.4.1 (cdnjs). Live market data comes from official TradingView embeds, so there is no fake data.
- SEO: unique titles and descriptions, OG/Twitter cards with a real OG image, JSON-LD (`FinancialService`,
  `FAQPage`), canonical URLs, sitemap.
- Performance: no framework, deferred scripts, lazy embeds, preconnect for fonts.

## 6. Compliance guardrails (India / SEBI context)
- Every page footer carries the market-risk disclaimer.
- Performance figures are labelled "client-reported, unaudited, past performance is not indicative of
  future returns", and the section can be switched off in one place (`SITE.showPerformance`).
- No words like "guaranteed", "assured", or "consistent returns irrespective of market volatility".
- Calculators are labelled illustrative. The Nifty comparison uses published index closing levels.
- Open items for the client are listed in `docs/CLIENT-CHECKLIST.md`.

## 7. Delivery plan (parallel agents, each on its own files)
1. Foundation (lead): design system, partials, build script, home page as reference implementation.
2. Agent A: `about.html` + `services.html`
3. Agent B: `performance.html` + `markets.html`
4. Agent C: `tools.html` (calculators + risk quiz)
5. Agent D: `contact.html`, legal pages, 404, SEO/plumbing files
6. QA agent: full audit (links, a11y, mobile, console errors, copy accuracy against CLIENT-FACTS)
7. Lead: fix, verify in Playwright at 390px and 1440px, commit, push.

## 8. TradingView symbols verified to render in free embeds (tested 2026-11-09)
NSE symbols (NSE:NIFTY, NSE:BANKNIFTY, NSE:*) are licence-restricted and show "only available on TradingView", so **do not use them**.
Working: `BSE:SENSEX`, `BSE:SNSX50` (Sensex 50), `BSE:BSE100`, `BSE:BSE500`, `BSE:BANK` (Bankex), `BSE:NIFTYBEES` (Nifty 50 ETF),
`BSE:BANKBEES`, `BSE:JUNIORBEES`, `BSE:GOLDBEES`, `BSE:SILVERBEES`, BSE equities (`BSE:RELIANCE`, `BSE:HDFCBANK`, `BSE:TCS`, `BSE:INFY` …),
`TVC:GOLD`, `TVC:SILVER`, `TVC:USOIL`, `FX_IDC:USDINR`.
Not working: `BSE:MIDCAP`, `BSE:SMLCAP`, `BSE:BSEIT`, `TVC:DXY`, `TVC:US10Y`, `MCX:*`, `SGX:*`, `NSEIX:*`.
Embed via `<div class="tv-embed" data-tv="WIDGET" data-tv-config='{…}'></div>`; `main.js` lazy-mounts it.
