// Self-test for the pure calculator maths in assets/js/pages/tools.js.
// Usage: node scripts/test-calculators.cjs
const assert = require("node:assert/strict");
const path = require("node:path");
const C = require(path.join(__dirname, "..", "assets", "js", "pages", "tools.js"));

let passed = 0;
function check(name, fn) { fn(); passed++; console.log("ok  " + name); }
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: got ${a}, expected ${b} ± ${tol}`);

check("SIP ₹10,000/month, 12%, 10 yrs = ₹23,23,391", () => {
  assert.equal(Math.round(C.sipFV(10000, 12, 10)), 2323391);
});
check("SIP month-by-month simulation (no step-up) matches the closed formula", () => {
  const s = C.sipSchedule(10000, 12, 10, 0);
  assert.equal(Math.round(s.value), 2323391);
  assert.equal(Math.round(s.invested), 1200000);
  assert.equal(s.years.length, 10);
  near(s.years[9].value, s.value, 1e-6, "last year row");
});
check("SIP step-up raises the instalment every 12 months", () => {
  const s = C.sipSchedule(10000, 12, 3, 10);
  near(s.invested, 120000 + 132000 + 145200, 1e-6, "invested with 10% step-up");
  near(s.lastInstalment, 12100, 1e-6, "year-3 instalment");
  assert.ok(s.value > C.sipFV(10000, 12, 3));
});
check("SIP at 0% return equals the sum of instalments", () => {
  assert.equal(C.sipFV(5000, 0, 2), 120000);
});
check("Lump sum ₹1,00,000 at 12% for 10 yrs = ₹3,10,585", () => {
  assert.equal(Math.round(C.lumpsumFV(100000, 12, 10)), 310585);
  assert.equal(Math.round(C.lumpsumSchedule(100000, 12, 10).value), 310585);
});
check("Goal planner round-trips through the SIP and lump-sum formulas", () => {
  const g = C.goalPlan(5000000, 15, 6, 12);
  near(g.future, 5000000 * Math.pow(1.06, 15), 1e-6, "inflated target");
  near(C.sipFV(g.sip, 12, 15), g.future, 1e-6, "SIP reaches target");
  near(C.lumpsumFV(g.lump, 12, 15), g.future, 1e-6, "lump sum reaches target");
  near(C.sipForTarget(2323390.7635194054, 12, 10), 10000, 1e-6, "inverse of sanity SIP");
});
check("CAGR forward and reverse", () => {
  near(C.cagr(100000, 310584.8208344212, 10), 12, 1e-9, "CAGR of the lump-sum check");
  near(C.fvFromCagr(100000, 12, 10), 310584.8208344212, 1e-6, "reverse mode");
  near(C.cagr(100000, 547694, 5), 40.5, 0.05, "client 5-yr example ≈ 40.5%");
  assert.ok(Number.isNaN(C.cagr(0, 100, 5)));
});
check("Risk profile bands and safety caps", () => {
  assert.equal(C.riskProfile([1, 1, 1, 1, 1, 1, 1]).profile, "Conservative");
  assert.equal(C.riskProfile([2, 2, 2, 2, 2, 2, 2]).profile, "Moderate");
  assert.equal(C.riskProfile([3, 3, 3, 3, 3, 3, 3]).profile, "Growth");
  assert.equal(C.riskProfile([4, 4, 4, 4, 4, 4, 4]).profile, "Aggressive");
  const capped = C.riskProfile([4, 4, 4, 1, 4, 4, 4]);
  assert.equal(capped.profile, "Moderate"); assert.ok(capped.capped);
  assert.equal(C.riskProfile([4, 4, 4, 4, 1, 4, 4]).profile, "Growth");
});
check("Conservative is never shown F&O or leverage", () => {
  const ids = C.strategiesFor("Conservative");
  for (const f of ["options-selling", "weekly-expiry", "intraday-swing", "mtf"]) assert.ok(!ids.includes(f), f);
  const all = ["equity-portfolio", "options-selling", "weekly-expiry", "ipo", "intraday-swing", "gold-silver", "mtf", "risk-management"];
  for (const p of C.PROFILES) for (const id of C.strategiesFor(p)) assert.ok(all.includes(id), id);
});
console.log(`\n${passed} checks passed`);
