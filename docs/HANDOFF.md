# Handoff: Easy Trading premium website (read this first in a new session)

Last updated: 9 Nov 2026. Branch: `claude/confident-lovelace-jrcv1l` (the only branch; GitHub Actions deploys it).
Preview: https://pranshukesavmishra.github.io/easytrading/ (GitHub Pages, Source = GitHub Actions, already enabled).
Repo: github.com/pranshukesavmishra/easytrading. Owner: a developer building this for a client (Easy Trading, New Delhi).

## What this is
A new, exclusive, premium static website (plain HTML/CSS/JS, no framework) replacing the client's basic React site at
https://easytrading.co.in/ . Client: NISM-certified investment management firm, est. 2020, Chhatarpur, New Delhi.
All client facts are in `docs/CLIENT-FACTS.md` (the ONLY allowed source of claims). Rules are in `CLAUDE.md`.
Open questions for the client (SEBI registration, audited returns, "Award-Winning", team names, hours): `docs/CLIENT-CHECKLIST.md`.

## Owner's feedback history (important)
1. First build (dark graphite + gold, wide uppercase Archivo type, sharp corners, WebGL hero) was REJECTED: "didn't like even 5%".
2. Owner chose: **light, premium, trustworthy** rebuild. Disliked colours/dark look, layout/fonts/style, plain-vs-busy balance, and content/claims.
3. Owner also asked: must not look like generic AI/Claude-made output; extremely high-quality graphics; no mistakes.
4. Status of the redesign: v2 is built and pushed. The owner has NOT yet reviewed it. Next step is their feedback on the live preview.

## Current design system (v2, in `assets/css/main.css`)
Warm-white page `--ink-1 #fbfaf6`, white cards, soft grey alt sections, navy `--navy #0b2447` (primary/dark bands), antique gold
(`--gold #94680a` for text, `--gold-2 #e2b13c` for fills). Fonts: Source Serif 4 (headings), Plus Jakarta Sans (UI), IBM Plex Mono (tabular
numbers only). Sentence-case headings, rounded cards, soft shadows, pill buttons (`.btn--gold`, `.btn--navy`, `.btn--ghost`).
Home hero has a three.js (r128) light "dot terrain" (`assets/js/hero3d.js`) with a 2D canvas fallback. Charts: Chart.js 4.4.1 via `assets/js/charts.js`
(`ET_DATA`, `ET_CHART.colors`). Live data: TradingView embeds (`.tv-embed`, mounted by `assets/js/main.js`), BSE/TVC symbols only (see PLAN.md section 8; NSE symbols are blocked).

## Pages (all built)
`/` `about` `services` `performance` `markets` (Market Desk) `tools` (SIP/lump-sum/goal/CAGR calculators + risk quiz) `contact`
`legal/disclaimer|privacy|terms` `404`, plus `robots.txt`, `sitemap.xml`, `site.webmanifest`, `.htaccess` (cPanel), `assets/img/og-image.png`.
Shared header/footer/head are in `partials/` and stamped into pages by `node scripts/build.mjs` (run it after any partial change; idempotent).

## Verified numbers (do not change without updating CLIENT-FACTS)
Client-reported yearly returns 2020-24: 50, 39, 35, 38, 41 % => CAGR ~40.5%, Rs 1,00,000 -> Rs 5,47,694. Nifty 50 (price index, from closes)
=> ~14.2% CAGR, Rs 1,94,312 (derived in `charts.js` from `niftyCloses`). All performance elements carry `data-performance`;
`window.SITE.showPerformance=false` in `assets/js/config.js` hides them all (tested, no errors).

## Deployment
`.github/workflows/pages.yml` assembles the site, rewrites root-relative URLs (`/assets/...`) to `/easytrading/...` in the deployed copy only, and
publishes. Every push to the branch redeploys (~1 min). Production plan: upload the repo (excluding docs, scripts, partials, .github) to the
client's GoDaddy cPanel `public_html`; `.htaccess` handles HTTPS and 404.

## QA tooling
Local server: `cd /home/user/easytrading && python3 -m http.server 8080 &`. Per-page check: `node scripts/shoot.cjs /page.html <scratch-dir>`
(prints console errors/overflow, saves desktop+mobile screenshots; widgets render lazily so use a tall viewport for TradingView). Calculator tests:
`node scripts/test-calculators.cjs` (9 checks). Playwright is preinstalled; for external sites launch chromium with the HTTPS_PROXY.

## Session log (10 Nov 2026, session 3)
- Steps 1-2 done: build OK; all 11 pages x 390/768/1440 = 0 console errors, 0 overflow, 0 hidden reveals. All 8 TradingView embeds mount on desktop+mobile
  (they only look blank in full-page screenshots because they load lazily; test by scrolling, not by fullPage).
- Fixed: performance table first-column border glitch; contact email wrapping mid-word.
- With `showPerformance=false` every return figure, Rs 50 Cr and 98% hide. Left visible on purpose (verified facts, not returns): "100+ clients", "15+ yrs team experience".
- Owner feedback on v2 (10 Nov): "still doesn't look premium and good, too old-looking and boring". Redesign iteration in progress; see below.

## What is left to do (in order)
1. **Verify the last uncommitted change** (may or may not have been applied): `assets/js/main.js` TradingView defaults should be
   `colorTheme = "light"` and `isTransparent = false` (grep `colorTheme =`). Then run `node scripts/build.mjs`, run `shoot.cjs` on all 11 pages
   (expect 0 errors, 0 overflow at 390/768/1440), commit and push.
2. **Final visual audit of v2**: look at every page (desktop + mobile). Known small items: `.page-hero` shows a faint grey wedge at the left on desktop;
   performance table header style; Performance and Market Desk mobile only partly eyeballed; no 768px screenshots taken for the v2 pages.
3. **Get the owner's feedback** on the live preview and iterate. Ask for a reference site if they have one.
4. **Content judgement calls still open** (see the last QA report): about-page claims "Maximum loss known before entry" / "Hedged or defined-risk derivative structures"
   and "a team that picks up the phone" are unverified operational promises: soften or remove (about.html ~line 175, index.html lead). Decide whether the "98% retention"
   and "100+ clients" figures should also hide under `showPerformance=false` (CHECKLIST groups them with performance claims). "Free consultation" was removed everywhere
   because it is not in CLIENT-FACTS; add back only if the client confirms. Legal pages mention "its partners" and New Delhi jurisdiction: need the client's/lawyer's review.
5. **Client confirmations** (CLIENT-CHECKLIST.md): SEBI registration status (critical, performance advertising is regulated), audited returns, awards, team, hours.
6. Optional polish ideas: real photography/illustrations once the client supplies assets; a "market closed" holiday calendar; analytics (then update the privacy page).

## Working rules (also in CLAUDE.md)
No invented facts; no guaranteed-returns language; every returns figure inside `data-performance`; commit with clear messages and push only to the assigned branch;
no PR unless asked; verify in a real browser before saying done. Commit trailers used in this project:
`Co-Authored-By: Claude <noreply@anthropic.com>` is fine (use the model name the session shows).
