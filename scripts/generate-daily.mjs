// 매일 국·영·수·과·사 수능형 문제를 "생성 → 독립 검증 → 수정/폐기" 다단계로 만드는 에이전트.
// 핵심: AI가 만든 정답을 신뢰하지 않고, 별도 검증 패스에서 '처음부터 다시 풀어' 정답·완성도를 점검.
// GitHub Actions 크론에서 실행 → public/daily/*.json 으로 커밋 → 게임이 '오늘의 문제'로 로드.
// 모델: claude-opus-4-8 + 적응형 사고. (비용↓ 시 검증만 sonnet 으로 바꿔도 됨)
import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";

const MODEL = "claude-opus-4-8";
const OVERGEN = 2; // 과생성 여유분(검증 탈락 대비) — count+OVERGEN 개 생성 후 통과분에서 count 개 채택
const client = new Anthropic(); // ANTHROPIC_API_KEY 는 환경변수에서 자동 인식

// 한국 시간(KST) 기준 날짜
const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

const SUBJECTS = [
  { subj: "국어", count: 2, brief: "독서(비문학: 인문·사회·과학·기술·예술)와 문학(현대시·소설·고전) 중 서로 다른 두 유형. 지문(passage) 포함 필수." },
  { subj: "영어", count: 2, brief: "빈칸추론·주제/요지·어법 중 서로 다른 두 유형. 영어 지문(passage) 포함, 보기·해설은 한국어." },
  { subj: "수학", count: 2, brief: "수학Ⅰ(지수로그·삼각함수·수열)·수학Ⅱ(극한·미분·적분)·확률과 통계 중 서로 다른 두 단원. passage 는 \"\"." },
  { subj: "과학", count: 2, brief: "통합과학(물리·화학·생명·지구) 개념 또는 자료해석. 필요하면 짧은 자료/지문(passage), 모두 한국어." },
  { subj: "사회", count: 2, brief: "통합사회(정치·경제·법·윤리·지리·문화) 개념 또는 자료해석. 필요하면 짧은 자료/지문(passage), 모두 한국어." },
];

function sysPrompt(subj, brief, n) {
  return `당신은 대한민국 수능 1등급을 목표로 하는 고등학생을 위한 ${subj} 출제위원입니다.
원본(직접 창작) ${subj} 수능형 5지선다 문제를 정확히 ${n}개 만드세요.

규칙:
- ${brief}
- 각 문제: 보기(opts) 정확히 5개, 정답 1개. a = 정답 보기의 0부터 시작하는 인덱스(0~4).
- 정답은 반드시 하나만 명확해야 하며, 나머지 4개는 분명히 틀린 매력적 오답이어야 합니다(복수정답·정답없음 금지).
- 지문이 필요한 유형은 passage 에 지문을 넣고, 필요 없으면 passage="".
- q = 발문, label = "${subj} · 단원/유형" 형식, type = 단원/유형 키워드.
- exp = 정답 근거와 주요 오답 이유를 담은 한국어 해설.
- reason = 문제를 푸는 단계별 사고과정(접근법 → 핵심 단서 포착 → 풀이 → 결론)을 1인칭으로 서술. "왜 그렇게 생각하는지"가 드러나게.
- followups = 이 유형에서 더 나올 수 있는 예상 질문·확인 포인트 2~3개(한국어 문자열 배열).
- 실제 수능 기출을 그대로 베끼지 말고, 같은 난이도·유형의 새 문항을 창작하세요.
- 출제 전 반드시 스스로 풀어 검산하고, 정답이 하나임을 확인하세요.`;
}

const FORMAT = `아래 JSON 객체 하나만 출력하세요. 코드펜스(\`\`\`)나 다른 설명을 절대 붙이지 마세요.
{"problems":[{"type":"","label":"","passage":"","q":"","opts":["","","","",""],"a":0,"exp":"","reason":"","followups":["",""]}]}`;

function verifySys(subj) {
  return `당신은 대한민국 수능 ${subj} 검수위원입니다. 주어진 각 문제를, 표시된 정답을 신뢰하지 말고 "처음부터 직접" 풀어 다음을 엄격히 검증하세요:
1) 표시 정답 인덱스(a)가 실제로 유일한 정답인가?
2) 정답이 정확히 하나이며 모호하지 않은가? (복수정답·정답없음·논쟁의 여지 금지)
3) 사실·계산·번역·논리 오류가 없는가? 지문과 발문이 정합적인가?
4) 해설(exp)·사고과정(reason)이 올바른 정답을 정확히 설명하는가?

판정(verdict):
- "keep": 완벽함.
- "fix": 정답 인덱스 또는 해설/사고과정만 고치면 되는 경미한 결함 → correctedA(올바른 0~4)와 개선된 exp·reason 제시.
- "drop": 사실오류·복수정답·모호함 등 본질적 결함.
의심스러우면 보수적으로 fix 또는 drop 하세요. 완성도와 정답 정확성이 최우선입니다.`;
}
const VERIFY_FORMAT = `아래 JSON 하나만 출력(코드펜스 금지):
{"checks":[{"i":0,"solvedA":0,"answerCorrect":true,"oneCorrect":true,"errors":[],"verdict":"keep","correctedA":0,"exp":"","reason":""}]}`;

function parseJson(text) {
  let t = (text || "").trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const m = t.match(/\{[\s\S]*\}/);
  if (m) t = m[0];
  return JSON.parse(t);
}

// 스트리밍 + 적응형 사고 (긴 출력·고품질 추론). 사고 블록은 건너뛰고 text 만 반환.
async function ask(system, user, maxTokens) {
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    thinking: { type: "adaptive" },
    system,
    messages: [{ role: "user", content: user }],
  });
  const res = await stream.finalMessage();
  return res.content.find((b) => b.type === "text")?.text || "{}";
}

// 1) 생성
async function genSubject(s, n) {
  const text = await ask(sysPrompt(s.subj, s.brief, n), `오늘의 ${s.subj} 문제 ${n}개를 생성하세요.\n\n${FORMAT}`, 14000);
  const data = parseJson(text);
  return (data.problems || [])
    .filter((p) => Array.isArray(p.opts) && p.opts.length === 5 && Number.isInteger(p.a) && p.a >= 0 && p.a <= 4 && p.q)
    .map((p) => ({ subj: s.subj, type: p.type || s.subj, label: p.label || s.subj, passage: p.passage || "", q: p.q, opts: p.opts, a: p.a, exp: p.exp || "", reason: p.reason || "", followups: Array.isArray(p.followups) ? p.followups.slice(0, 3) : [] }));
}

// 2) 독립 검증 (처음부터 다시 풀어 점검)
async function verifySubject(subj, probs) {
  const listing = probs.map((p, i) =>
    `[${i}] 유형:${p.type}\n${p.passage ? "지문: " + p.passage + "\n" : ""}발문: ${p.q}\n보기: ${p.opts.map((o, j) => `(${j}) ${o}`).join(" / ")}\n표시정답 a=${p.a}\n해설: ${p.exp}`
  ).join("\n\n");
  const text = await ask(verifySys(subj), `다음 ${probs.length}개 ${subj} 문제를 각각 독립적으로 직접 풀어 검증하세요.\n\n${listing}\n\n${VERIFY_FORMAT}`, 16000);
  return parseJson(text).checks || [];
}

// 3) 생성 → 검증 → 수정/폐기 → 채택
async function genVerified(s) {
  let raw = [];
  try { raw = await genSubject(s, s.count + OVERGEN); }
  catch (e) { console.error(`${s.subj} 생성 실패: ${e.message}`); }
  if (!raw.length) return [];

  let checks = [];
  try { checks = await verifySubject(s.subj, raw); }
  catch (e) { console.error(`${s.subj} 검증 실패(원본 사용): ${e.message}`); }
  if (!checks.length) return raw.slice(0, s.count); // 검증 불가 시 원본 일부

  const out = [];
  raw.forEach((p, i) => {
    const c = checks.find((x) => x.i === i);
    if (!c) { out.push(p); return; }            // 검증 누락분은 통과
    if (c.verdict === "drop") return;            // 본질적 결함 폐기
    if (c.oneCorrect === false) return;          // 복수정답/모호 폐기
    if (c.answerCorrect === false || c.verdict === "fix") {
      if (Number.isInteger(c.correctedA) && c.correctedA >= 0 && c.correctedA <= 4) p.a = c.correctedA;
      else if (c.answerCorrect === false) return; // 고칠 정답 정보 없으면 폐기
      if (c.exp) p.exp = c.exp;
      if (c.reason) p.reason = c.reason;
    }
    out.push(p);
  });
  const kept = out.slice(0, s.count);
  console.log(`${s.subj}: 생성 ${raw.length} → 통과 ${out.length} → 채택 ${kept.length}`);
  return kept;
}

const all = [];
for (const s of SUBJECTS) {
  try { all.push(...(await genVerified(s))); }
  catch (e) { console.error(`${s.subj} 처리 실패: ${e.message}`); }
}

if (all.length === 0) {
  console.error("생성된 문제가 없습니다 — 기존 파일을 유지하고 종료합니다.");
  process.exit(1);
}

const dir = "public/daily";
mkdirSync(dir, { recursive: true });
const payload = { date: today, generated_by: MODEL + " (generate+verify)", count: all.length, problems: all };
writeFileSync(`${dir}/today.json`, JSON.stringify(payload, null, 2), "utf8");
writeFileSync(`${dir}/${today}.json`, JSON.stringify(payload, null, 2), "utf8");

let index = [];
try { index = JSON.parse(readFileSync(`${dir}/index.json`, "utf8")); } catch {}
if (!index.includes(today)) index.unshift(today);
index = index.slice(0, 90);
writeFileSync(`${dir}/index.json`, JSON.stringify(index, null, 2), "utf8");

console.log(`완료: ${today} · 총 ${all.length}문제(생성+검증) → ${dir}/today.json`);
