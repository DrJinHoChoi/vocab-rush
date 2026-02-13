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
    // 분수→소수 (깔끔하게 나누어떨어지는 쌍만 사용)
    const pairs = [[1,2,0.5],[1,4,0.25],[3,4,0.75],[1,5,0.2],[2,5,0.4],[3,5,0.6],[4,5,0.8],[1,8,0.125],[3,8,0.375],[5,8,0.625],[7,8,0.875],[1,10,0.1],[3,10,0.3],[7,10,0.7],[9,10,0.9],[1,20,0.05],[1,25,0.04],[3,20,0.15],[7,20,0.35]];
    const [n, d, ans] = pairs[rand(0, pairs.length-1)];
    question = `${n}/${d} = ? (소수)`;
    answer = ans;
    hint = `${n}÷${d}=${ans}`;
    return { question, answer, hint, isFraction: true };
  } else if (type === 1) {
    // 분수 덧셈 → 기약분수 결과 (소수가 아닌 분수로 답)
    const d = [2,4,5,8,10][rand(0,4)]; // 2,4,5,8,10만 사용 (소수로 나누어떨어짐)
    const a = rand(1, d-1); const b = rand(1, d-1);
    const sum = a + b;
    answer = sum / d;
    // 소수로 정확히 나누어떨어지는지 확인
    const check = Math.round(answer * 10000) / 10000;
    if (check !== answer || String(answer).length > 6) {
      // 안전한 폴백: 간단한 분수→소수 변환
      const pairs2 = [[1,2,0.5],[1,4,0.25],[3,4,0.75],[2,5,0.4],[3,5,0.6]];
      const [n2,d2,a2] = pairs2[rand(0,pairs2.length-1)];
      return { question: `${n2}/${d2} = ? (소수)`, answer: a2, hint: `${n2}÷${d2}=${a2}`, isFraction: true };
    }
    question = `${a}/${d} + ${b}/${d} = ? (소수)`;
    hint = `(${a}+${b})/${d} = ${sum}/${d} = ${answer}`;
    return { question, answer, hint, isFraction: true };
  } else {
    // 소수 곱셈 (결과가 정확한 소수)
    const a = [0.1,0.2,0.25,0.5][rand(0,3)];
    const b = rand(2, 20);
    answer = a * b;
    // 부동소수점 보정
    answer = Math.round(answer * 1000) / 1000;
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
    // 비율 구하기 (정확히 정수% 나오는 조합만 사용)
    const total = [10,20,25,50,100][rand(0,4)];
    // part가 total의 배수로 나누어 정수%가 되도록
    const pctTarget = rand(1, 19) * 5; // 5, 10, 15, ..., 95
    const part = total * pctTarget / 100;
    if (part !== Math.floor(part) || part <= 0 || part >= total) {
      // 안전한 폴백
      const safePairs = [[1,4,25],[1,2,50],[3,4,75],[1,5,20],[2,5,40],[3,5,60],[4,5,80],[1,10,10],[3,10,30],[7,10,70],[9,10,90]];
      const [sp, st, sa] = safePairs[rand(0,safePairs.length-1)];
      answer = sa;
      question = `${sp}/${st} = ?%`;
      hint = `${sp}÷${st}=${sp/st}, ×100=${sa}%`;
    } else {
      answer = pctTarget;
      question = `${part}/${total} = ?%`;
      hint = `${part}÷${total}=${part/total}, ×100=${answer}%`;
    }
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
  { key: "random",   icon: "🎲", label: "랜덤 믹스" },
  { key: "add_sub",  icon: "➕", label: "덧셈·뺄셈" },
  { key: "multiply", icon: "✖️", label: "곱셈" },
  { key: "divide",   icon: "➗", label: "나눗셈" },
  { key: "mixed",    icon: "🔢", label: "혼합계산" },
  { key: "fraction", icon: "📊", label: "분수·소수" },
  { key: "percent",  icon: "💯", label: "퍼센트" },
  { key: "power",    icon: "⚡", label: "거듭제곱" },
];
