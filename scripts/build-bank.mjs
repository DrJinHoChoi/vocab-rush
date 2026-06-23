// 원본 영어 어휘 데이터(src/vocabData.js, ~4,500개)를 수능형 5지선다로 변환해
// public/bank.json 문제 은행을 만든다. 저작권 문제 없는 100% 원본 생성.
// 실행: node scripts/build-bank.mjs
import { VOCAB_DATA } from "../src/vocabData.js";
import { writeFileSync } from "node:fs";

const CAP = 3000; // 은행 크기 상한(파일 크기/품질 균형)
const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
const first = (s) => String(s || "").split(/[,;/]/)[0].trim();

// 전 레벨 단어 모으고 중복(en) 제거
const seen = new Set();
let words = [];
for (const lv of Object.keys(VOCAB_DATA)) {
  for (const w of VOCAB_DATA[lv]) {
    if (w && w.en && w.ko && !seen.has(w.en)) { seen.add(w.en); words.push({ ...w, lv }); }
  }
}
words = shuffle(words).slice(0, CAP);

function distractors(answer, pool, n) {
  const out = [], used = new Set([answer.en]);
  let guard = 0;
  while (out.length < n && guard < n * 50) {
    guard++;
    const x = pool[Math.floor(Math.random() * pool.length)];
    if (!x || used.has(x.en)) continue;
    used.add(x.en); out.push(x);
  }
  return out;
}

const allForDistract = [];
for (const lv of Object.keys(VOCAB_DATA)) for (const w of VOCAB_DATA[lv]) if (w && w.en && w.ko) allForDistract.push(w);

const problems = [];
words.forEach((w, i) => {
  const ds = distractors(w, allForDistract, 4);
  if (ds.length < 4) return;
  const reverse = i % 2 === 1; // 번갈아: 뜻 고르기 / 영단어 고르기
  const choices = shuffle([w, ...ds]);
  const a = choices.findIndex((c) => c.en === w.en);
  let q, opts, exp;
  if (!reverse) {
    q = `다음 영단어의 뜻으로 알맞은 것은?  ${w.en}`;
    opts = choices.map((c) => first(c.ko));
    exp = `정답: ${w.ko}${w.pos ? " (" + w.pos + ")" : ""}${w.def ? " — " + w.def : ""}`;
  } else {
    q = `다음 뜻을 가진 영단어는?  ${w.ko.split(",").slice(0, 2).join(", ")}`;
    opts = choices.map((c) => c.en);
    exp = `정답: ${w.en} — ${w.ko}${w.pos ? " (" + w.pos + ")" : ""}`;
  }
  // 보기 중복 제거 실패(같은 첫 뜻) 시 스킵
  if (new Set(opts).size !== opts.length) return;
  // 어휘 은행은 슬림하게(q/opts/exp만) — 사고과정·예상질문은 풍부한 수능형 문제에서 제공
  problems.push({ subj: "영어", type: "vocab", t: 35, label: `영어 · 어휘(${w.lv})`, passage: "", q, opts, a, exp });
});

writeFileSync("public/bank.json", JSON.stringify({ generated_by: "build-bank", subj: "영어", count: problems.length, problems }));
console.log(`bank.json: ${problems.length}문제 생성 (단어 ${words.length}개 기반)`);
