// 남은 STUDY RUSH 정적 페이지(다크)를 크림 큐비즘으로 일괄 전환.
// DOYOU 브랜드 페이지(doyou-*, doyu-*)와 이미 처리된 페이지는 제외.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const dir = "public";
const skip = /^(doyou|doyu)/;
const done = new Set(["suneung-quiz.html", "plan.html"]);

// 긴 토큰 → 짧은 토큰 순(부분 매칭 방지). split/join 으로 전역 치환.
const map = [
  ["rgba(255,255,255,0.03)", "#FFFEFB"],
  ["rgba(255,255,255,0.04)", "#FBF8F0"],
  ["rgba(255,255,255,0.05)", "#F3EEE2"],
  ["rgba(255,255,255,0.06)", "#EFE9DC"],
  ["rgba(255,255,255,0.08)", "#E3DCCB"],
  ["rgba(255,255,255,0.12)", "#E3DCCB"],
  ["rgba(255,255,255,0.14)", "#E3DCCB"],
  ["rgba(255,255,255,0.15)", "#E3DCCB"],
  ["rgba(255,255,255,0.1)", "#E3DCCB"],
  ["rgba(96,165,250,0.12)", "#DCE6F1"],
  ["rgba(96,165,250,0.15)", "#DCE6F1"],
  ["rgba(96,165,250,0.2)", "#CFDDEC"],
  ["rgba(96,165,250,0.3)", "#B8CBE0"],
  ["rgba(96,165,250,0.1)", "#EAF0F6"],
  ["#0a0a1a", "#FAF5EB"],
  ["#0f172a", "#F3EEE2"],
  ["#111827", "#FBF8F0"],
  ["#1f2937", "#E3DCCB"],
  ["#f8fafc", "#141413"],
  ["#f1f5f9", "#141413"],
  ["#e2e8f0", "#1F1B16"],
  ["#cbd5e1", "#3F3A33"],
  ["#94a3b8", "#6E6657"],
  ["#64748b", "#6E6657"],
  ["#93c5fd", "#1d4ed8"],
  ["#60a5fa", "#1d4ed8"],
  ["#34d399", "#15803D"],
  ["#4ade80", "#15803D"],
  ["#fbbf24", "#A16207"],
  ["#fb923c", "#C75D3A"],
];

let count = 0;
for (const f of readdirSync(dir)) {
  if (!f.endsWith(".html") || skip.test(f) || done.has(f)) continue;
  let s = readFileSync(`${dir}/${f}`, "utf8");
  const orig = s;
  for (const [a, b] of map) s = s.split(a).join(b);
  if (s !== orig) { writeFileSync(`${dir}/${f}`, s, "utf8"); count++; console.log("reskinned:", f); }
}
console.log(`완료: ${count}개 페이지 크림 전환`);
