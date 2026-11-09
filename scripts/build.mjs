// Stamps shared partials into every HTML page and marks the active nav link.
// Usage: node scripts/build.mjs        (idempotent; safe to run repeatedly)
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const partial = (n) => readFileSync(join(root, "partials", n + ".html"), "utf8").trim();
const parts = { head: partial("head"), header: partial("header"), footer: partial("footer") };
const SKIP = new Set(["partials", "node_modules", ".git", "docs", "scripts"]);

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return SKIP.has(f) ? [] : walk(p);
    return f.endsWith(".html") ? [p] : [];
  });
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
let count = 0;
for (const file of walk(root)) {
  let html = readFileSync(file, "utf8");
  const urlPath = "/" + relative(root, file).split(sep).join("/");
  const navHref = urlPath === "/index.html" ? "/" : urlPath;
  let changed = false;
  for (const [name, body] of Object.entries(parts)) {
    const re = new RegExp(`([ \\t]*)<!-- @${name} -->[\\s\\S]*?<!-- /@${name} -->`);
    const m = html.match(re);
    if (!m) continue;
    const indent = m[1];
    let content = body;
    if (name === "header") {
      content = content.replace(new RegExp(`<a href="${escape(navHref)}">`, "g"), `<a href="${navHref}" aria-current="page">`);
    }
    const block = `${indent}<!-- @${name} -->\n${content.split("\n").map((l) => indent + l).join("\n")}\n${indent}<!-- /@${name} -->`;
    html = html.replace(re, () => block);
    changed = true;
  }
  if (changed) { writeFileSync(file, html); count++; }
}
console.log(`build: stamped partials into ${count} page(s)`);
