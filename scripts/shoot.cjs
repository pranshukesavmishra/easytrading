// QA helper: node scripts/shoot.cjs <path> [outdir]  -> desktop + mobile full-page screenshots + console errors.
// Requires a local server: python3 -m http.server 8080 (from repo root).
const { chromium } = require("playwright");
const path = process.argv[2] || "/";
const out = process.argv[3] || ".";
(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" } : undefined;
  const browser = await chromium.launch({ proxy });
  const name = path.replace(/[^a-z0-9]/gi, "_") || "home";
  for (const [label, vp] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport: vp, ignoreHTTPSErrors: true });
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
    page.on("requestfailed", (r) => { if (r.url().includes("localhost")) errors.push("404/FAIL " + r.url()); });
    page.on("response", (r) => { if (r.url().includes("localhost") && r.status() >= 400) errors.push(r.status() + " " + r.url()); });
    await page.goto("http://localhost:8080" + path, { waitUntil: "load", timeout: 60000 });
    // scroll through to trigger reveals / lazy embeds
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 160)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(2500);
    const hiddenReveals = await page.evaluate(() => document.querySelectorAll(".reveal:not(.is-visible)").length);
    if (hiddenReveals) errors.push("reveal elements still hidden: " + hiddenReveals);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await page.screenshot({ path: `${out}/${name}-${label}.png`, fullPage: true });
    console.log(`${label}: horizontal overflow=${overflow}px; errors=${errors.length}`);
    errors.forEach((e) => console.log("  - " + e));
    await page.close();
  }
  await browser.close();
})();
