// MATH RUSH - Dynamic Math Problem Generator
// Categories: add_sub, multiply, divide, mixed, fraction, percent, power, binary, logic, cs_math, random

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

function generateStringWrongs(correct, count = 3) {
  const wrongs = new Set();
  // Try using a provided pool first; otherwise generate plausible alternatives
  let attempts = 0;
  while (wrongs.size < count && attempts < 50) {
    attempts++;
    // Flip a random bit/char in the correct string
    const idx = rand(0, correct.length - 1);
    const ch = correct[idx];
    let replacement;
    if (/[01]/.test(ch)) {
      replacement = ch === '0' ? '1' : '0';
    } else if (/[0-9]/.test(ch)) {
      replacement = String((parseInt(ch) + rand(1, 9)) % 10);
    } else if (/[A-F]/i.test(ch)) {
      const hexChars = 'ABCDEF'.replace(ch.toUpperCase(), '');
      replacement = hexChars[rand(0, hexChars.length - 1)];
    } else {
      replacement = String(rand(0, 9));
    }
    const wrong = correct.substring(0, idx) + replacement + correct.substring(idx + 1);
    if (wrong !== correct && !wrongs.has(wrong)) {
      wrongs.add(wrong);
    }
  }
  // Fallback: append/remove characters
  let fallback = 0;
  while (wrongs.size < count) {
    fallback++;
    const w = correct + String(fallback);
    if (!wrongs.has(w) && w !== correct) wrongs.add(w);
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

function genBinary() {
  const type = rand(0, 7);
  let question, answer, hint, wrongs;

  if (type === 0) {
    // 10진 → 2진
    const n = rand(5, 63);
    answer = n.toString(2);
    question = `${n}을(를) 2진법으로 변환하면?`;
    hint = `${n}을 2로 계속 나누어 나머지를 아래에서 위로 읽으면 ${answer}`;
    wrongs = [
      (n + 1).toString(2),
      (n > 2 ? n - 1 : n + 2).toString(2),
      (n + rand(2, 5)).toString(2),
    ];
    return { question, answer, hint, isBinary: true, wrongs };
  } else if (type === 1) {
    // 2진 → 10진
    const n = rand(5, 63);
    const bin = n.toString(2);
    answer = n;
    question = `${bin}(2) = ?(10)`;
    hint = `각 자릿수에 2의 거듭제곱을 곱해 더합니다: ${bin.split('').reverse().map((b, i) => b === '1' ? `2^${i}` : '').filter(Boolean).join('+')} = ${n}`;
    return { question, answer, hint };
  } else if (type === 2) {
    // 10진 → 16진
    const n = rand(16, 255);
    answer = n.toString(16).toUpperCase();
    question = `${n}을(를) 16진법으로 변환하면?`;
    hint = `${n} ÷ 16 = ${Math.floor(n / 16)} 나머지 ${n % 16} → ${answer}`;
    wrongs = [
      (n + 1).toString(16).toUpperCase(),
      (n > 17 ? n - 1 : n + 2).toString(16).toUpperCase(),
      (n + rand(2, 10)).toString(16).toUpperCase(),
    ];
    // Deduplicate wrongs
    const wrongSet = new Set(wrongs.filter(w => w !== answer));
    let fb = 3;
    while (wrongSet.size < 3) {
      const w = (n + fb).toString(16).toUpperCase();
      if (w !== answer) wrongSet.add(w);
      fb++;
    }
    wrongs = [...wrongSet].slice(0, 3);
    return { question, answer, hint, isBinary: true, wrongs };
  } else if (type === 3) {
    // 16진 → 10진
    const n = rand(16, 255);
    const hex = n.toString(16).toUpperCase();
    answer = n;
    question = `${hex}(16) = ?(10)`;
    hint = `각 자릿수에 16의 거듭제곱을 곱해 더합니다: ${hex.split('').map((c, i) => `${parseInt(c, 16)}×16^${hex.length - 1 - i}`).join('+')} = ${n}`;
    return { question, answer, hint };
  } else if (type === 4) {
    // 비트 최대값: 8비트로 표현 가능한 최대 양수(부호 없음)
    const bits = [4, 8, 16][rand(0, 2)];
    answer = Math.pow(2, bits) - 1;
    question = `${bits}비트로 표현 가능한 최대 양수(부호없음)는?`;
    hint = `2^${bits} - 1 = ${answer} (모든 비트가 1)`;
    return { question, answer, hint };
  } else if (type === 5) {
    // 바이트 변환
    const pairs = [
      ['1KB', 1024, '2^10 = 1024'],
      ['1MB', 1048576, '2^20 = 1,048,576'],
      ['2KB', 2048, '2 × 1024 = 2048'],
      ['4KB', 4096, '4 × 1024 = 4096'],
      ['0.5KB', 512, '1024 / 2 = 512'],
    ];
    const [unit, ans, h] = pairs[rand(0, pairs.length - 1)];
    answer = ans;
    question = `${unit} = ? bytes`;
    hint = h;
    return { question, answer, hint };
  } else if (type === 6) {
    // 10진 → 8진
    const n = rand(8, 127);
    answer = n.toString(8);
    question = `${n}을(를) 8진법으로 변환하면?`;
    hint = `${n}을 8로 나누어 나머지를 역순으로: ${answer}`;
    wrongs = [
      (n + 1).toString(8),
      (n > 9 ? n - 1 : n + 2).toString(8),
      (n + rand(2, 5)).toString(8),
    ];
    const wrongSet = new Set(wrongs.filter(w => w !== answer));
    let fb = 3;
    while (wrongSet.size < 3) {
      const w = (n + fb).toString(8);
      if (w !== answer) wrongSet.add(w);
      fb++;
    }
    wrongs = [...wrongSet].slice(0, 3);
    return { question, answer, hint, isBinary: true, wrongs };
  } else {
    // 2의 거듭제곱
    const exp = rand(1, 16);
    answer = Math.pow(2, exp);
    question = `2^${exp} = ?`;
    hint = `2를 ${exp}번 곱하면 ${answer}`;
    return { question, answer, hint };
  }
}

function genLogic() {
  const type = rand(0, 7);
  let question, answer, hint, wrongs;

  if (type === 0) {
    // Single-bit AND
    const a = rand(0, 1), b = rand(0, 1);
    answer = a & b;
    question = `${a} AND ${b} = ?`;
    hint = `AND는 둘 다 1일 때만 1`;
    return { question, answer, hint };
  } else if (type === 1) {
    // Single-bit OR
    const a = rand(0, 1), b = rand(0, 1);
    answer = a | b;
    question = `${a} OR ${b} = ?`;
    hint = `OR는 하나라도 1이면 1`;
    return { question, answer, hint };
  } else if (type === 2) {
    // Single-bit XOR
    const a = rand(0, 1), b = rand(0, 1);
    answer = a ^ b;
    question = `${a} XOR ${b} = ?`;
    hint = `XOR는 두 값이 다를 때 1`;
    return { question, answer, hint };
  } else if (type === 3) {
    // NOT
    const a = rand(0, 1);
    answer = a === 1 ? 0 : 1;
    question = `NOT ${a} = ?`;
    hint = `NOT은 0↔1 반전`;
    return { question, answer, hint };
  } else if (type === 4) {
    // Bitwise AND on 4-bit binary
    const a = rand(1, 15), b = rand(1, 15);
    const result = a & b;
    const aStr = a.toString(2).padStart(4, '0');
    const bStr = b.toString(2).padStart(4, '0');
    answer = result.toString(2).padStart(4, '0');
    question = `${aStr} AND ${bStr} = ?`;
    hint = `각 비트별로 AND 연산: 둘 다 1인 자리만 1`;
    wrongs = [
      (a | b).toString(2).padStart(4, '0'),
      (a ^ b).toString(2).padStart(4, '0'),
      ((~a & 0xF) & b).toString(2).padStart(4, '0'),
    ];
    // Ensure uniqueness
    const wrongSet = new Set(wrongs.filter(w => w !== answer));
    let fb = 1;
    while (wrongSet.size < 3) {
      const w = ((result + fb) & 0xF).toString(2).padStart(4, '0');
      if (w !== answer) wrongSet.add(w);
      fb++;
    }
    wrongs = [...wrongSet].slice(0, 3);
    return { question, answer, hint, isBinary: true, wrongs };
  } else if (type === 5) {
    // Bitwise OR on 4-bit binary
    const a = rand(1, 15), b = rand(1, 15);
    const result = a | b;
    const aStr = a.toString(2).padStart(4, '0');
    const bStr = b.toString(2).padStart(4, '0');
    answer = result.toString(2).padStart(4, '0');
    question = `${aStr} OR ${bStr} = ?`;
    hint = `각 비트별로 OR 연산: 하나라도 1이면 1`;
    wrongs = [
      (a & b).toString(2).padStart(4, '0'),
      (a ^ b).toString(2).padStart(4, '0'),
      ((~result) & 0xF).toString(2).padStart(4, '0'),
    ];
    const wrongSet = new Set(wrongs.filter(w => w !== answer));
    let fb = 1;
    while (wrongSet.size < 3) {
      const w = ((result + fb) & 0xF).toString(2).padStart(4, '0');
      if (w !== answer) wrongSet.add(w);
      fb++;
    }
    wrongs = [...wrongSet].slice(0, 3);
    return { question, answer, hint, isBinary: true, wrongs };
  } else if (type === 6) {
    // Truth table: A AND B / A OR B
    const a = Math.random() > 0.5;
    const b = Math.random() > 0.5;
    const op = rand(0, 1);
    if (op === 0) {
      answer = (a && b) ? 'True' : 'False';
      question = `A=${a ? 'True' : 'False'}, B=${b ? 'True' : 'False'}일 때 A AND B = ?`;
      hint = `AND는 둘 다 True일 때만 True`;
    } else {
      answer = (a || b) ? 'True' : 'False';
      question = `A=${a ? 'True' : 'False'}, B=${b ? 'True' : 'False'}일 때 A OR B = ?`;
      hint = `OR는 하나라도 True이면 True`;
    }
    wrongs = answer === 'True' ? ['False', '0', '1'] : ['True', '1', '0'];
    return { question, answer, hint, isBinary: true, wrongs };
  } else {
    // De Morgan's Law
    const laws = [
      {
        q: 'NOT (A AND B) = ?',
        a: 'NOT A OR NOT B',
        h: '드모르간 법칙: NOT (A AND B) = NOT A OR NOT B',
        w: ['NOT A AND NOT B', 'A OR B', 'A AND NOT B'],
      },
      {
        q: 'NOT (A OR B) = ?',
        a: 'NOT A AND NOT B',
        h: '드모르간 법칙: NOT (A OR B) = NOT A AND NOT B',
        w: ['NOT A OR NOT B', 'A AND B', 'NOT A OR B'],
      },
    ];
    const law = laws[rand(0, 1)];
    return { question: law.q, answer: law.a, hint: law.h, isBinary: true, wrongs: law.w };
  }
}

function factorial(n) {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function perm(n, r) {
  return factorial(n) / factorial(n - r);
}

function comb(n, r) {
  return factorial(n) / (factorial(r) * factorial(n - r));
}

function genCsMath() {
  const type = rand(0, 7);
  let question, answer, hint, wrongs;

  if (type === 0) {
    // 순열 nPr
    const n = rand(4, 8);
    const r = rand(2, Math.min(4, n - 1));
    answer = perm(n, r);
    question = `${n}명 중 ${r}명을 뽑아 줄세우는 경우의 수(${n}P${r}) = ?`;
    hint = `${n}P${r} = ${n}!/${n - r}! = ${Array.from({ length: r }, (_, i) => n - i).join('×')} = ${answer}`;
    return { question, answer, hint };
  } else if (type === 1) {
    // 조합 nCr
    const n = rand(4, 10);
    const r = rand(2, Math.min(4, n - 1));
    answer = comb(n, r);
    question = `${n}명 중 ${r}명을 뽑는 경우의 수(${n}C${r}) = ?`;
    hint = `${n}C${r} = ${n}! / (${r}! × ${n - r}!) = ${answer}`;
    return { question, answer, hint };
  } else if (type === 2) {
    // 팩토리얼
    const n = rand(3, 8);
    answer = factorial(n);
    question = `${n}! = ?`;
    hint = `${Array.from({ length: n }, (_, i) => n - i).join('×')} = ${answer}`;
    return { question, answer, hint };
  } else if (type === 3) {
    // 2의 거듭제곱
    const exp = rand(4, 16);
    answer = Math.pow(2, exp);
    question = `2^${exp} = ?`;
    hint = `2를 ${exp}번 곱하면 ${answer}`;
    return { question, answer, hint };
  } else if (type === 4) {
    // 로그 base 2
    const exp = rand(1, 10);
    const val = Math.pow(2, exp);
    answer = exp;
    question = `log\u2082(${val}) = ?`;
    hint = `2^? = ${val} → 2^${exp} = ${val}`;
    return { question, answer, hint };
  } else if (type === 5) {
    // 피보나치 수열
    const fibs = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];
    const idx = rand(5, 13); // 6th ~ 14th term (1-indexed)
    answer = fibs[idx];
    question = `피보나치 수열의 ${idx + 1}번째 항은? (1,1,2,3,5,...)`;
    hint = `F(${idx}) = ${fibs[idx - 1]} + ${fibs[idx - 2]} = ${fibs[idx]}`;
    return { question, answer, hint };
  } else if (type === 6) {
    // Big-O 근사
    const scenarios = [
      { q: 'n=1000일 때 O(n log n) ≈ ?', a: 10000, h: '1000 × log₂(1000) ≈ 1000 × 10 = 10,000', w: [1000, 100000, 3000] },
      { q: 'n=100일 때 O(n²) = ?', a: 10000, h: '100² = 10,000', w: [1000, 100000, 20000] },
      { q: 'n=10일 때 O(2^n) = ?', a: 1024, h: '2^10 = 1024', w: [512, 2048, 100] },
      { q: 'n=1000일 때 O(n) = ?', a: 1000, h: 'O(n)은 입력 크기 그대로 → 1000', w: [100, 10000, 500] },
      { q: 'O(1), O(log n), O(n) 중 가장 빠른 것은?', a: 1, h: 'O(1)은 상수 시간으로 가장 빠름', w: [2, 3, 0] },
    ];
    // For the last scenario, we use numeric codes: 1=O(1), 2=O(log n), 3=O(n)
    const s = scenarios[rand(0, scenarios.length - 1)];
    if (s.q.includes('가장 빠른')) {
      // Special: string answer
      answer = 'O(1)';
      question = s.q;
      hint = s.h;
      wrongs = ['O(log n)', 'O(n)', 'O(n²)'];
      return { question, answer, hint, isBinary: true, wrongs };
    }
    answer = s.a;
    question = s.q;
    hint = s.h;
    return { question, answer, hint };
  } else {
    // 확률 (분수 형태)
    const probs = [
      { q: '동전 3개를 던져 모두 앞면일 확률은?', a: '1/8', h: '(1/2)³ = 1/8', w: ['1/4', '1/6', '3/8'] },
      { q: '주사위 1개를 던져 짝수가 나올 확률은?', a: '1/2', h: '짝수: 2,4,6 → 3/6 = 1/2', w: ['1/3', '1/6', '2/3'] },
      { q: '주사위 1개를 던져 6이 나올 확률은?', a: '1/6', h: '경우의 수: 1개/전체 6개 = 1/6', w: ['1/3', '1/2', '1/5'] },
      { q: '카드 52장에서 에이스를 뽑을 확률은?', a: '1/13', h: '에이스 4장/전체 52장 = 4/52 = 1/13', w: ['1/4', '1/52', '1/26'] },
      { q: '동전 2개를 던져 모두 앞면일 확률은?', a: '1/4', h: '(1/2)² = 1/4', w: ['1/2', '1/3', '3/4'] },
      { q: '주사위 2개를 던져 합이 7일 확률은?', a: '1/6', h: '(1,6)(2,5)(3,4)(4,3)(5,2)(6,1) → 6/36 = 1/6', w: ['1/12', '1/9', '1/3'] },
    ];
    const p = probs[rand(0, probs.length - 1)];
    return { question: p.q, answer: p.a, hint: p.h, isBinary: true, wrongs: p.w };
  }
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
  binary: genBinary,
  logic: genLogic,
  cs_math: genCsMath,
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
    const isBin = raw.isBinary;
    let wrongs;
    if (isBin) {
      wrongs = raw.wrongs || generateStringWrongs(String(raw.answer), 3);
    } else if (isFrac) {
      wrongs = generateFractionWrongs(raw.answer, 3);
    } else {
      wrongs = generateWrongAnswers(raw.answer, 3);
    }
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
  { key: "binary",   icon: "🔟", label: "진법변환" },
  { key: "logic",    icon: "🧠", label: "논리연산" },
  { key: "cs_math",  icon: "🖥️", label: "CS수학" },
];
