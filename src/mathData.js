// MATH RUSH - Dynamic Math Problem Generator
// Categories: add_sub, multiply, divide, mixed, fraction, percent, power, random

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateWrongAnswers(correct, count = 3) {
  const wrongs = new Set();
  const absVal = Math.abs(correct) || 1;
  let attempts = 0;
  while (wrongs.size < count && attempts < 50) {
    attempts++;
    let offset;
    const strategy = rand(0, 3);
    if (strategy === 0) offset = rand(1, Math.max(5, Math.ceil(absVal * 0.3)));
    else if (strategy === 1) offset = -rand(1, Math.max(5, Math.ceil(absVal * 0.3)));
    else if (strategy === 2) offset = rand(1, 10);
    else offset = -rand(1, 10);
    const wrong = correct + offset;
    if (wrong !== correct && !wrongs.has(wrong)) {
      wrongs.add(wrong);
    }
  }
  // fallback
  let fallback = 1;
  while (wrongs.size < count) {
    if (correct + fallback !== correct && !wrongs.has(correct + fallback)) wrongs.add(correct + fallback);
    else if (correct - fallback !== correct && !wrongs.has(correct - fallback)) wrongs.add(correct - fallback);
    fallback++;
  }
  return [...wrongs];
}

function generateFractionWrongs(correct, count = 3) {
  const wrongs = new Set();
  let attempts = 0;
  while (wrongs.size < count && attempts < 50) {
    attempts++;
    const offset = (rand(1, 8) - 4) / 4; // -0.75 ~ 1.0 in 0.25 steps
    if (offset === 0) continue;
    const wrong = Math.round((correct + offset) * 100) / 100;
    if (wrong !== correct && !wrongs.has(wrong)) wrongs.add(wrong);
  }
  let fallback = 0.25;
  while (wrongs.size < count) {
    const w = Math.round((correct + fallback) * 100) / 100;
    if (w !== correct && !wrongs.has(w)) wrongs.add(w);
    fallback += 0.25;
  }
  return [...wrongs];
}

// ===================== GENERATORS =====================

function genAddSub() {
  const isAdd = Math.random() > 0.4;
  if (isAdd) {
    const a = rand(11, 99);
    const b = rand(11, 99);
    const answer = a + b;
    return {
      question: `${a} + ${b} = ?`,
      answer,
      hint: `${Math.floor(a/10)*10}+${Math.floor(b/10)*10}=${Math.floor(a/10)*10+Math.floor(b/10)*10}, ${a%10}+${b%10}=${a%10+b%10}`,
    };
  } else {
    const b = rand(11, 89);
    const a = b + rand(11, 99);
    const answer = a - b;
    return {
      question: `${a} - ${b} = ?`,
      answer,
      hint: `${a}에서 ${Math.floor(b/10)*10}을 빼면 ${a-Math.floor(b/10)*10}, 다시 ${b%10}을 빼면 ${answer}`,
    };
  }
}

function genMultiply() {
  const type = rand(0, 2);
  let a, b;
  if (type === 0) { a = rand(2, 9); b = rand(2, 9); }         // 구구단
  else if (type === 1) { a = rand(2, 9); b = rand(11, 19); }   // 1자리×2자리
  else { a = rand(11, 25); b = rand(2, 9); }                   // 2자리×1자리
  const answer = a * b;
  return {
    question: `${a} × ${b} = ?`,
    answer,
    hint: `${a}×${Math.floor(b/10)*10||b}=${a*(Math.floor(b/10)*10||b)}${b%10&&b>9?`, ${a}×${b%10}=${a*(b%10)}`:''}`,
  };
}

function genDivide() {
  const divisor = rand(2, 12);
  const quotient = rand(3, 25);
  const dividend = divisor * quotient;
  return {
    question: `${dividend} ÷ ${divisor} = ?`,
    answer: quotient,
    hint: `${divisor}×?=${dividend} → ${divisor}×${quotient}=${dividend}`,
  };
}

function genMixed() {
  const type = rand(0, 3);
  let question, answer, hint;
  if (type === 0) {
    const a = rand(2, 15); const b = rand(2, 10); const c = rand(2, 10);
    answer = a * b + c;
    question = `${a} × ${b} + ${c} = ?`;
    hint = `먼저 ${a}×${b}=${a*b}, 그 다음 +${c}=${answer}`;
  } else if (type === 1) {
    const a = rand(2, 10); const b = rand(2, 10); const c = rand(2, 8);
    answer = (a + b) * c;
    question = `(${a} + ${b}) × ${c} = ?`;
    hint = `괄호 먼저: ${a}+${b}=${a+b}, 그 다음 ×${c}=${answer}`;
  } else if (type === 2) {
    const c = rand(2, 9); const b = rand(2, 9); const a = rand(10, 50);
    const bc = b * c;
    answer = a + bc;
    question = `${a} + ${b} × ${c} = ?`;
    hint = `곱셈 먼저: ${b}×${c}=${bc}, 그 다음 ${a}+${bc}=${answer}`;
  } else {
    const a = rand(2, 8); const b = rand(2, 8); const c = rand(2, 5);
    answer = a * b * c;
    question = `${a} × ${b} × ${c} = ?`;
    hint = `${a}×${b}=${a*b}, 그 다음 ×${c}=${answer}`;
  }
  return { question, answer, hint };
}

function genFraction() {
  const type = rand(0, 2);
  let question, answer, hint;
  if (type === 0) {
    // 분수→소수
    const pairs = [[1,2,0.5],[1,4,0.25],[3,4,0.75],[1,5,0.2],[2,5,0.4],[3,5,0.6],[1,8,0.125],[3,8,0.375],[1,10,0.1],[3,10,0.3],[7,10,0.7]];
    const [n, d, ans] = pairs[rand(0, pairs.length-1)];
    question = `${n}/${d} = ? (소수)`;
    answer = ans;
    hint = `${n}÷${d}=${ans}`;
    return { question, answer, hint, isFraction: true };
  } else if (type === 1) {
    // 분수 덧셈 (같은 분모)
    const d = [2,3,4,5,6,8,10][rand(0,6)];
    const a = rand(1, d-1); const b = rand(1, d-1);
    const sum = a + b;
    answer = Math.round((sum / d) * 100) / 100;
    question = `${a}/${d} + ${b}/${d} = ? (소수)`;
    hint = `(${a}+${b})/${d} = ${sum}/${d} = ${answer}`;
    return { question, answer, hint, isFraction: true };
  } else {
    // 소수 곱셈
    const a = [0.1,0.2,0.25,0.3,0.4,0.5][rand(0,5)];
    const b = rand(2, 20);
    answer = Math.round(a * b * 100) / 100;
    question = `${a} × ${b} = ?`;
    hint = `${a}=${a*100}/100이므로, ${a*100}×${b}÷100=${answer}`;
    return { question, answer, hint, isFraction: true };
  }
}

function genPercent() {
  const type = rand(0, 2);
  let question, answer, hint;
  if (type === 0) {
    const pct = [5,10,15,20,25,30,40,50,75][rand(0,8)];
    const base = [100,200,300,400,500,600,800,1000,1200,1500][rand(0,9)];
    answer = base * pct / 100;
    question = `${base}의 ${pct}% = ?`;
    hint = `${base}×${pct}÷100 = ${base*pct/100}`;
  } else if (type === 1) {
    // 할인 계산
    const price = rand(2, 20) * 100;
    const disc = [10,20,25,30,50][rand(0,4)];
    answer = price - price * disc / 100;
    question = `${price}원의 ${disc}% 할인가 = ?`;
    hint = `할인액: ${price}×${disc}%=${price*disc/100}, 결제액: ${price}-${price*disc/100}=${answer}`;
  } else {
    // 비율 구하기
    const total = [20,25,40,50,80,100,200][rand(0,6)];
    const part = rand(1, total - 1);
    answer = Math.round(part / total * 100);
    question = `${part}/${total} = ?%`;
    hint = `${part}÷${total}=${(part/total).toFixed(2)}, ×100=${answer}%`;
  }
  return { question, answer, hint };
}

function genPower() {
  const type = rand(0, 2);
  let question, answer, hint;
  if (type === 0) {
    // 제곱
    const base = rand(2, 15);
    answer = base * base;
    question = `${base}² = ?`;
    hint = `${base}×${base}=${answer}`;
  } else if (type === 1) {
    // 제곱근
    const root = rand(2, 15);
    const sq = root * root;
    answer = root;
    question = `√${sq} = ?`;
    hint = `?×?=${sq} → ${root}×${root}=${sq}`;
  } else {
    // 거듭제곱
    const base = rand(2, 5);
    const exp = rand(3, 4);
    answer = Math.pow(base, exp);
    question = `${base}${exp===3?'³':'⁴'} = ?`;
    hint = exp === 3
      ? `${base}×${base}=${base*base}, ×${base}=${answer}`
      : `${base}²=${base*base}, ×${base}²=${answer}`;
  }
  return { question, answer, hint };
}

// ===================== MAIN EXPORT =====================

const generators = {
  add_sub: genAddSub,
  multiply: genMultiply,
  divide: genDivide,
  mixed: genMixed,
  fraction: genFraction,
  percent: genPercent,
  power: genPower,
};

const allGeneratorKeys = Object.keys(generators);

export function generateMathQuestions(category, count) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    const gen = category === "random"
      ? generators[allGeneratorKeys[rand(0, allGeneratorKeys.length - 1)]]
      : generators[category];
    const raw = gen();
    const isFrac = raw.isFraction;
    const wrongs = isFrac
      ? generateFractionWrongs(raw.answer, 3)
      : generateWrongAnswers(raw.answer, 3);
    const choices = shuffle([
      { label: String(raw.answer), isCorrect: true },
      ...wrongs.map(w => ({ label: String(w), isCorrect: false })),
    ]);
    questions.push({
      question: raw.question,
      answer: raw.answer,
      choices,
      hint: raw.hint,
      category: category === "random" ? "random" : category,
    });
  }
  return questions;
}

export const MATH_CATEGORIES = [
  { key: "random",   icon: "\uD83C\uDFB2", label: "\uB79C\uB364 \uBB79\uC2A4" },
  { key: "add_sub",  icon: "\u2795", label: "\uB367\uC148\u00B7\uBE84\uC148" },
  { key: "multiply", icon: "\u2716\uFE0F", label: "\uACF1\uC148" },
  { key: "divide",   icon: "\u2797", label: "\uB098\uB217\uC148" },
  { key: "mixed",    icon: "\uD83D\uDD22", label: "\uD63C\uD569\uACC4\uC0B0" },
  { key: "fraction", icon: "\uD83D\uDCCA", label: "\uBD84\uC218\u00B7\uC18C\uC218" },
  { key: "percent",  icon: "\uD83D\uDCAF", label: "\uD37C\uC13C\uD2B8" },
  { key: "power",    icon: "\u26A1", label: "\uAC70\uB4ED\uC81C\uACF1" },
];
