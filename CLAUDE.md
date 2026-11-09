# Project brief — Easy Trading premium website

Standing instructions from the owner (developer building this for a client). Read before any work.

## The client (verified facts: docs/CLIENT-FACTS.md)
- Current site: https://easytrading.co.in/ — works but is "too basic".
- Business: NISM-certified investment management firm (est. 2020, New Delhi): equity portfolios, index options selling,
  IPO research, intraday/swing, gold & silver ETFs, MTF, portfolio structuring and risk management.

## The goal
Build a new, exclusive, premium website that showcases the client's work: portfolio management,
investing, market analysis and related services. It must clearly feel a level above the current site.

## Working rules (do not forget)
1. Plan first, then implement. Keep the plan in `docs/PLAN.md` and update it as work progresses.
2. Upgrade every page and every corner: design, copy, responsiveness, accessibility, performance,
   SEO, trust signals and compliance. Review each step before moving on.
3. **No mistakes, no invented facts.** Client claims come ONLY from `docs/CLIENT-FACTS.md` (verified from the live site). Never fabricate registration numbers, people, testimonials, hours or new figures.
   Open questions live in `docs/CLIENT-CHECKLIST.md`; tunable values live in `assets/js/config.js`.
4. Financial-site compliance: show risk disclaimers ("Investments in securities market are subject to
   market risks…"), never promise or guarantee returns, and label calculators as illustrative.
5. Commit with clear messages and push to the assigned branch only. No PR unless asked.
6. Verify in a real browser (Playwright) on desktop and mobile before calling work done.

## Architecture (see docs/PLAN.md)
Static HTML/CSS/JS for cPanel hosting. Shared header and footer live in `partials/`; run `node scripts/build.mjs`
after any partial change. Design tokens are in `assets/css/main.css`; page-specific files go in
`assets/css/pages/` and `assets/js/pages/`.

## DESIGN DECISION (owner feedback, 9 Nov 2026) — supersedes any earlier dark/gold direction
The owner disliked the first build (dark graphite + gold, wide uppercase type, sharp-corner HUD style). Rebuild direction, confirmed by the owner:
- **Light, premium, trustworthy** (modern private bank): warm white and soft grey surfaces, deep navy text and primary, restrained gold accent, green for gains.
- New typography, new layout language. Calm, spacious, not shouty: sentence-case headlines, no all-caps display type, no outlined text, no grain, no corner-tick motif.
- Balance: richer visuals where it felt plain (illustrated charts, graphics), fewer repeated sections where it felt busy.
- Content: lead with the service and the process, not with returns. Performance figures stay but are secondary, clearly labelled, and hideable (`showPerformance`).
- Must still not look like a generic template or AI output; keep verified facts only (docs/CLIENT-FACTS.md).
