// 국·영·수·과·사 수능형 문제 대량 생성기 — 목표 과목당 TARGET(기본 1000) → 총 5000+.
// 파이프라인: 생성(과생성) → 독립 검증(처음부터 재풀이) → 수정/폐기 → 누적.
// 100% 원본 창작(기출 스크래핑 금지). 재실행 가능: 기존 결과를 이어서 채우고 중복(q) 제거.
// 실행: ANTHROPIC_API_KEY=... node scripts/build-suneung-bank.mjs
// 옵션(env): TARGET_PER_SUBJECT(기본 1000), BATCH(배치당 생성 기본 5), ONLY(특정 과목만, 예: "수학,영어")
import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";

const MODEL = "claude-opus-4-8";
const TARGET = parseInt(process.env.TARGET_PER_SUBJECT || "1000", 10);
const BATCH = parseInt(process.env.BATCH || "5", 10);
const ONLY = (process.env.ONLY || "").split(",").map((x) => x.trim()).filter(Boolean);
const MAX_NEW = parseInt(process.env.MAX_NEW || "1000000", 10); // 1회 실행당 신규 상한(CI 시간·비용 제어; 재실행으로 이어서 누적)
const OUT = "public/daily/bank-suneung.json";
const client = new Anthropic();

// 주제 매트릭스 — 다양성 확보(같은 문제 반복 방지)
const TOPICS = {
  국어: ["독서-인문", "독서-사회", "독서-과학", "독서-기술", "독서-예술", "문학-현대시", "문학-현대소설", "문학-고전시가", "문학-고전소설", "언어와매체-문법", "화법과작문"],
  영어: ["빈칸추론(단어)", "빈칸추론(구)", "주제", "요지", "제목", "어법성판단", "어휘적절성", "글의순서", "문장삽입", "함축의미", "도표/실용문", "심경/분위기"],
  수학: ["수학Ⅰ-지수와로그", "수학Ⅰ-삼각함수", "수학Ⅰ-수열", "수학Ⅱ-함수의극한", "수학Ⅱ-미분", "수학Ⅱ-적분", "확률과통계-경우의수", "확률과통계-확률", "확률과통계-통계"],
  과학: ["통합과학-역학(힘과에너지)", "통합과학-화학반응", "통합과학-생명(세포·유전)", "통합과학-지구(지권·대기)", "통합과학-전기와자기", "통합과학-자료해석"],
  사회: ["통합사회-정치", "통합사회-경제", "통합사회-법", "통합사회-윤리", "통합사회-지리", "통합사회-사회문화", "통합사회-자료해석"],
};

function sysPrompt(subj, topic, n) {
  return `당신은 대한민국 수능 1등급 대비 ${subj} 출제위원입니다. 주제 "${topic}"의 원본 수능형 5지선다 문제 ${n}개를 창작하세요.
규칙:
- 각 문제: 보기(opts) 5개, 정답 1개(a=0~4 인덱스). 정답은 유일·명확, 오답 4개는 분명히 틀린 매력적 오답(복수정답·정답없음 금지).
- 지문 필요 유형은 passage 에, 아니면 passage="". (국어 독서/문학·영어는 지문 필수, 영어 지문만 영어·나머지 한국어)
- q=발문, label="${subj} · ${topic}", type="${topic}".
- exp=정답 근거+오답 이유 해설. reason=단계별 사고과정(1인칭). followups=예상 질문 2~3개.
- 실제 기출을 베끼지 말고 같은 난이도·유형으로 새로 창작. 출제 전 스스로 풀어 검산하고 정답이 하나임을 확인.`;
}
const GEN_FORMAT = `JSON 하나만 출력(코드펜스 금지): {"problems":[{"type":"","label":"","passage":"","q":"","opts":["","","","",""],"a":0,"exp":"","reason":"","followups":["",""]}]}`;

function verifySys(subj) {
  return `당신은 수능 ${subj} 검수위원입니다. 각 문제를 표시 정답을 신뢰하지 말고 "처음부터 직접" 풀어 검증: 1)표시정답(a)이 유일한 정답인가 2)정답이 정확히 하나·모호하지 않은가 3)사실·계산·번역·논리 오류 없는가 4)해설/사고과정이 정답을 옳게 설명하는가. 판정: keep(완벽)/fix(정답·해설만 수정→correctedA·exp·reason)/drop(본질결함). 의심되면 보수적으로 fix/drop. 품질 최우선.`;
}
const VERIFY_FORMAT = `JSON 하나만 출력(코드펜스 금지): {"checks":[{"i":0,"answerCorrect":true,"oneCorrect":true,"verdict":"keep","correctedA":0,"exp":"","reason":""}]}`;

function parseJson(text) {
  let t = (text || "").trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const m = t.match(/\{[\s\S]*\}/);
  if (m) t = m[0];
  return JSON.parse(t);
}
async function ask(system, user, maxTokens) {
  const stream = client.messages.stream({ model: MODEL, max_tokens: maxTokens, thinking: { type: "adaptive" }, system, messages: [{ role: "user", content: user }] });
  const res = await stream.finalMessage();
  return res.content.find((b) => b.type === "text")?.text || "{}";
}

async function genVerifiedTopic(subj, topic, n) {
  const gtext = await ask(sysPrompt(subj, topic, n + 2), `주제 "${topic}" 문제 ${n + 2}개 생성.\n\n${GEN_FORMAT}`, 16000);
  let raw = (parseJson(gtext).problems || [])
    .filter((p) => Array.isArray(p.opts) && p.opts.length === 5 && Number.isInteger(p.a) && p.a >= 0 && p.a <= 4 && p.q)
    .map((p) => ({ subj, type: p.type || topic, label: p.label || `${subj} · ${topic}`, passage: p.passage || "", q: p.q, opts: p.opts, a: p.a, exp: p.exp || "", reason: p.reason || "", followups: Array.isArray(p.followups) ? p.followups.slice(0, 3) : [] }));
  if (!raw.length) return [];
  let checks = [];
  try {
    const listing = raw.map((p, i) => `[${i}] ${p.passage ? "지문:" + p.passage + "\n" : ""}발문:${p.q}\n보기:${p.opts.map((o, j) => `(${j})${o}`).join(" / ")}\n표시정답 a=${p.a}\n해설:${p.exp}`).join("\n\n");
    const vtext = await ask(verifySys(subj), `다음 ${raw.length}개를 각각 직접 풀어 검증.\n\n${listing}\n\n${VERIFY_FORMAT}`, 16000);
    checks = parseJson(vtext).checks || [];
  } catch (e) { /* 검증 실패 시 원본 사용 */ }
  if (!checks.length) return raw.slice(0, n);
  const out = [];
  raw.forEach((p, i) => {
    const c = checks.find((x) => x.i === i);
    if (!c) { out.push(p); return; }
    if (c.verdict === "drop" || c.oneCorrect === false) return;
    if (c.answerCorrect === false || c.verdict === "fix") {
      if (Number.isInteger(c.correctedA) && c.correctedA >= 0 && c.correctedA <= 4) p.a = c.correctedA;
      else if (c.answerCorrect === false) return;
      if (c.exp) p.exp = c.exp;
      if (c.reason) p.reason = c.reason;
    }
    out.push(p);
  });
  return out.slice(0, n);
}

// ===== 누적 실행 (재실행 가능) =====
mkdirSync("public/daily", { recursive: true });
let bank = { problems: [] };
if (existsSync(OUT)) { try { bank = JSON.parse(readFileSync(OUT, "utf8")); } catch {} }
if (!Array.isArray(bank.problems)) bank.problems = [];
const seen = new Set(bank.problems.map((p) => p.q));
const countBy = (subj) => bank.problems.filter((p) => p.subj === subj).length;
const save = () => writeFileSync(OUT, JSON.stringify({ generated_by: MODEL + " (bulk gen+verify)", count: bank.problems.length, problems: bank.problems }), "utf8");

const subjects = Object.keys(TOPICS).filter((s) => !ONLY.length || ONLY.includes(s));
let addedThisRun = 0;
outer:
for (const subj of subjects) {
  let ti = 0, stale = 0;
  while (countBy(subj) < TARGET && stale < 6) {
    if (addedThisRun >= MAX_NEW) { console.log(`이번 실행 상한(${MAX_NEW}) 도달 — 중단(재실행하면 이어서 누적).`); break outer; }
    const topic = TOPICS[subj][ti % TOPICS[subj].length]; ti++;
    try {
      const verified = await genVerifiedTopic(subj, topic, BATCH);
      let added = 0;
      for (const p of verified) { if (p.q && !seen.has(p.q)) { seen.add(p.q); bank.problems.push(p); added++; addedThisRun++; } }
      save();
      stale = added ? 0 : stale + 1;
      console.log(`${subj}/${topic}: +${added} (누적 ${countBy(subj)}/${TARGET} · 총 ${bank.problems.length} · 이번 ${addedThisRun})`);
    } catch (e) { stale++; console.error(`${subj}/${topic} 실패: ${e.message}`); }
  }
}
console.log(`완료: 총 ${bank.problems.length}문제 (이번 +${addedThisRun}) → ${OUT}`);
