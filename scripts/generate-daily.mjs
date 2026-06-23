// 매일 국·영·수·과·사 수능형 문제를 생성하는 에이전트.
// GitHub Actions 크론에서 실행 → public/daily/*.json 으로 커밋 → 게임이 '오늘의 문제'로 로드.
// 모델: claude-opus-4-8 (비용을 줄이려면 MODEL 을 "claude-sonnet-4-6" 로 교체).
import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";

const MODEL = "claude-opus-4-8";
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

function sysPrompt(s) {
  return `당신은 대한민국 수능 1등급을 목표로 하는 고등학생을 위한 ${s.subj} 출제위원입니다.
원본(직접 창작) ${s.subj} 수능형 5지선다 문제를 정확히 ${s.count}개 만드세요.

규칙:
- ${s.brief}
- 각 문제: 보기(opts) 정확히 5개, 정답 1개. a = 정답 보기의 0부터 시작하는 인덱스(0~4).
- 지문이 필요한 유형은 passage 에 지문을 넣고, 필요 없으면 passage="".
- q = 발문, label = "${s.subj} · 단원/유형" 형식, type = 단원/유형 키워드.
- exp = 정답 근거와 주요 오답 이유를 담은 한국어 해설.
- reason = 문제를 푸는 단계별 사고과정(접근법 → 핵심 단서 포착 → 풀이 → 결론)을 1인칭으로 서술. "왜 그렇게 생각하는지"가 드러나게.
- followups = 이 유형에서 더 나올 수 있는 예상 질문·확인 포인트 2~3개(한국어 문자열 배열).
- 실제 수능 기출을 그대로 베끼지 말고, 같은 난이도·유형의 새 문항을 창작하세요.
- 사실·계산 오류가 없도록 반드시 검산하세요.`;
}

const FORMAT = `아래 JSON 객체 하나만 출력하세요. 코드펜스(\`\`\`)나 다른 설명을 절대 붙이지 마세요.
{"problems":[{"type":"","label":"","passage":"","q":"","opts":["","","","",""],"a":0,"exp":"","reason":"","followups":["",""]}]}`;

function parseJson(text) {
  let t = (text || "").trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const m = t.match(/\{[\s\S]*\}/);
  if (m) t = m[0];
  return JSON.parse(t);
}

async function genSubject(s) {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: sysPrompt(s),
    messages: [{ role: "user", content: `오늘의 ${s.subj} 문제 ${s.count}개를 생성하세요.\n\n${FORMAT}` }],
  });
  const text = res.content.find((b) => b.type === "text")?.text || "{}";
  const data = parseJson(text);
  const probs = (data.problems || [])
    .filter((p) => Array.isArray(p.opts) && p.opts.length === 5 && Number.isInteger(p.a) && p.a >= 0 && p.a <= 4 && p.q)
    .map((p) => ({ subj: s.subj, type: p.type || s.subj, label: p.label || s.subj, passage: p.passage || "", q: p.q, opts: p.opts, a: p.a, exp: p.exp || "", reason: p.reason || "", followups: Array.isArray(p.followups) ? p.followups.slice(0, 3) : [] }));
  return probs;
}

const all = [];
for (const s of SUBJECTS) {
  try {
    const probs = await genSubject(s);
    all.push(...probs);
    console.log(`${s.subj}: ${probs.length}문제`);
  } catch (e) {
    console.error(`${s.subj} 생성 실패: ${e.message}`);
  }
}

if (all.length === 0) {
  console.error("생성된 문제가 없습니다 — 기존 파일을 유지하고 종료합니다.");
  process.exit(1);
}

const dir = "public/daily";
mkdirSync(dir, { recursive: true });
const payload = { date: today, generated_by: MODEL, count: all.length, problems: all };
writeFileSync(`${dir}/today.json`, JSON.stringify(payload, null, 2), "utf8");
writeFileSync(`${dir}/${today}.json`, JSON.stringify(payload, null, 2), "utf8");

let index = [];
try { index = JSON.parse(readFileSync(`${dir}/index.json`, "utf8")); } catch {}
if (!index.includes(today)) index.unshift(today);
index = index.slice(0, 90);
writeFileSync(`${dir}/index.json`, JSON.stringify(index, null, 2), "utf8");

console.log(`완료: ${today} · 총 ${all.length}문제 → ${dir}/today.json`);
