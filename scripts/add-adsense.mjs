// STUDY RUSH 정적 콘텐츠 페이지 전체에 Google AdSense Auto Ads 로더 삽입.
// DOYOU 비즈니스/데모 페이지(doyou-*, doyu-*)는 제외. 이미 있으면 건너뜀.
// 실행: node scripts/add-adsense.mjs
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const PUB = "ca-pub-6402470001589987";
const SNIPPET = `\n    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUB}" crossorigin="anonymous"></script>`;
const isDoyou = (f) => /^doy(ou|u)/i.test(f); // doyou-*.html, doyu-popup-match.html

const all = readdirSync("public").filter((f) => f.endsWith(".html"));
const done = [], skip = [], excl = [], nohead = [];
for (const f of all) {
  if (isDoyou(f)) { excl.push(f); continue; }
  const p = "public/" + f;
  let html = readFileSync(p, "utf8");
  if (html.includes("adsbygoogle.js")) { skip.push(f); continue; }
  if (!/<head>/i.test(html)) { nohead.push(f); continue; }
  html = html.replace(/<head>/i, (m) => m + SNIPPET);
  writeFileSync(p, html, "utf8");
  done.push(f);
}
console.log(`✅ 삽입 ${done.length}: ${done.join(", ")}`);
console.log(`⏭️  이미있음 ${skip.length}: ${skip.join(", ")}`);
console.log(`🚫 제외(DOYOU) ${excl.length}: ${excl.join(", ")}`);
if (nohead.length) console.log(`⚠️  <head> 없음 ${nohead.length}: ${nohead.join(", ")}`);
