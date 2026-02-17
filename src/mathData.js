// MATH RUSH - Dynamic Math Problem Generator
// Categories: add_sub, multiply, divide, mixed, fraction, percent, power, binary, logic, cs_math, ai_math, random

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
  const type = rand(0, 13);
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
  } else if (type === 7) {
    // 2의 거듭제곱
    const exp = rand(1, 16);
    answer = Math.pow(2, exp);
    question = `2^${exp} = ?`;
    hint = `2를 ${exp}번 곱하면 ${answer}`;
    return { question, answer, hint };
  } else if (type === 8) {
    // BCD (Binary Coded Decimal) - 각 십진 자릿수를 4비트로 표현
    const n = rand(10, 99);
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    answer = tens.toString(2).padStart(4, '0') + ' ' + ones.toString(2).padStart(4, '0');
    question = `${n}의 BCD 코드는?`;
    hint = `BCD: 각 십진 자릿수를 4비트로 → ${tens}=${tens.toString(2).padStart(4, '0')}, ${ones}=${ones.toString(2).padStart(4, '0')}`;
    // Generate plausible wrong BCD answers
    const w1tens = (tens + 1) % 10;
    const w2ones = (ones + 1) % 10;
    const w3tens = tens > 0 ? tens - 1 : tens + 2;
    wrongs = [
      w1tens.toString(2).padStart(4, '0') + ' ' + ones.toString(2).padStart(4, '0'),
      tens.toString(2).padStart(4, '0') + ' ' + w2ones.toString(2).padStart(4, '0'),
      w3tens.toString(2).padStart(4, '0') + ' ' + w2ones.toString(2).padStart(4, '0'),
    ];
    const wrongSet = new Set(wrongs.filter(w => w !== answer));
    let fbk = 2;
    while (wrongSet.size < 3) {
      const wt = ((tens + fbk) % 10).toString(2).padStart(4, '0');
      const wo = ones.toString(2).padStart(4, '0');
      const w = wt + ' ' + wo;
      if (w !== answer) wrongSet.add(w);
      fbk++;
    }
    wrongs = [...wrongSet].slice(0, 3);
    return { question, answer, hint, isBinary: true, wrongs };
  } else if (type === 9) {
    // 1의 보수 (4비트) - 비트 반전
    const n = rand(1, 14);
    const binStr = n.toString(2).padStart(4, '0');
    const complement = binStr.split('').map(b => b === '0' ? '1' : '0').join('');
    answer = complement;
    question = `${binStr}의 1의 보수는?`;
    hint = `1의 보수: 각 비트를 반전 → ${binStr} → ${complement}`;
    wrongs = [
      binStr, // original (common mistake)
      ((~n & 0xF) + 1 & 0xF).toString(2).padStart(4, '0'), // 2's complement (common confusion)
      (((~n & 0xF) + 2) & 0xF).toString(2).padStart(4, '0'),
    ];
    const wrongSet = new Set(wrongs.filter(w => w !== answer));
    let fbk = 1;
    while (wrongSet.size < 3) {
      const w = ((parseInt(complement, 2) + fbk) & 0xF).toString(2).padStart(4, '0');
      if (w !== answer) wrongSet.add(w);
      fbk++;
    }
    wrongs = [...wrongSet].slice(0, 3);
    return { question, answer, hint, isBinary: true, wrongs };
  } else if (type === 10) {
    // 2의 보수 (4비트) - 1의 보수 + 1, 음수 표현
    const n = rand(1, 14);
    const binStr = n.toString(2).padStart(4, '0');
    const onesComp = (~n & 0xF);
    const twosComp = (onesComp + 1) & 0xF;
    answer = twosComp.toString(2).padStart(4, '0');
    question = `${binStr}의 2의 보수는?`;
    hint = `2의 보수: 1의 보수(${onesComp.toString(2).padStart(4, '0')}) + 1 = ${answer}`;
    wrongs = [
      onesComp.toString(2).padStart(4, '0'), // 1's complement (common confusion)
      binStr, // original
      ((twosComp + 1) & 0xF).toString(2).padStart(4, '0'),
    ];
    const wrongSet = new Set(wrongs.filter(w => w !== answer));
    let fbk = 2;
    while (wrongSet.size < 3) {
      const w = ((twosComp + fbk) & 0xF).toString(2).padStart(4, '0');
      if (w !== answer) wrongSet.add(w);
      fbk++;
    }
    wrongs = [...wrongSet].slice(0, 3);
    return { question, answer, hint, isBinary: true, wrongs };
  } else if (type === 11) {
    // 비트 시프트 - 왼쪽/오른쪽 시프트
    const isLeft = Math.random() > 0.5;
    if (isLeft) {
      const n = rand(1, 15);
      const shift = rand(1, 3);
      answer = n << shift;
      question = `${n} << ${shift} = ?`;
      hint = `왼쪽 시프트: ${n} × 2^${shift} = ${n} × ${Math.pow(2, shift)} = ${answer}`;
    } else {
      const shift = rand(1, 2);
      const n = rand(Math.pow(2, shift), 63);
      answer = n >> shift;
      question = `${n} >> ${shift} = ?`;
      hint = `오른쪽 시프트: ${n} ÷ 2^${shift} = ${n} ÷ ${Math.pow(2, shift)} = ${answer} (소수점 버림)`;
    }
    return { question, answer, hint };
  } else if (type === 12) {
    // 2진법 덧셈 (4비트)
    const a = rand(1, 7);
    const b = rand(1, 7);
    const sum = a + b;
    const aStr = a.toString(2).padStart(4, '0');
    const bStr = b.toString(2).padStart(4, '0');
    answer = sum.toString(2).padStart(4, '0');
    question = `${aStr} + ${bStr} = ? (2진법)`;
    hint = `${a} + ${b} = ${sum} → ${answer}`;
    wrongs = [
      (a | b).toString(2).padStart(4, '0'),
      (a ^ b).toString(2).padStart(4, '0'),
      ((sum + 1) & 0xF).toString(2).padStart(4, '0'),
    ];
    const wrongSet = new Set(wrongs.filter(w => w !== answer));
    let fbk = 2;
    while (wrongSet.size < 3) {
      const w = ((sum + fbk) & 0xF).toString(2).padStart(4, '0');
      if (w !== answer) wrongSet.add(w);
      fbk++;
    }
    wrongs = [...wrongSet].slice(0, 3);
    return { question, answer, hint, isBinary: true, wrongs };
  } else {
    // 16진 덧셈
    const a = rand(1, 14);
    const b = rand(1, 14);
    const sum = a + b;
    const aHex = '0x' + a.toString(16).toUpperCase();
    const bHex = '0x' + b.toString(16).toUpperCase();
    answer = '0x' + sum.toString(16).toUpperCase();
    question = `${aHex} + ${bHex} = ?`;
    hint = `${a} + ${b} = ${sum} → ${answer}`;
    wrongs = [
      '0x' + (sum + 1).toString(16).toUpperCase(),
      '0x' + (sum > 1 ? sum - 1 : sum + 2).toString(16).toUpperCase(),
      '0x' + (sum + rand(2, 4)).toString(16).toUpperCase(),
    ];
    const wrongSet = new Set(wrongs.filter(w => w !== answer));
    let fbk = 3;
    while (wrongSet.size < 3) {
      const w = '0x' + (sum + fbk).toString(16).toUpperCase();
      if (w !== answer) wrongSet.add(w);
      fbk++;
    }
    wrongs = [...wrongSet].slice(0, 3);
    return { question, answer, hint, isBinary: true, wrongs };
  }
}

function genLogic() {
  const type = rand(0, 12);
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
  } else if (type === 7) {
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
  } else if (type === 8) {
    // NAND gate - NOT(A AND B)
    const a = rand(0, 1), b = rand(0, 1);
    answer = (a & b) ? 0 : 1;
    question = `NAND(${a}, ${b}) = ?`;
    hint = `NAND = NOT(AND): ${a} AND ${b} = ${a & b} → NOT = ${answer}`;
    return { question, answer, hint };
  } else if (type === 9) {
    // NOR gate - NOT(A OR B)
    const a = rand(0, 1), b = rand(0, 1);
    answer = (a | b) ? 0 : 1;
    question = `NOR(${a}, ${b}) = ?`;
    hint = `NOR = NOT(OR): ${a} OR ${b} = ${a | b} → NOT = ${answer}`;
    return { question, answer, hint };
  } else if (type === 10) {
    // XNOR gate - NOT(A XOR B)
    const a = rand(0, 1), b = rand(0, 1);
    answer = (a ^ b) ? 0 : 1;
    question = `XNOR(${a}, ${b}) = ?`;
    hint = `XNOR = NOT(XOR): ${a} XOR ${b} = ${a ^ b} → NOT = ${answer}`;
    return { question, answer, hint };
  } else if (type === 11) {
    // 비트 마스킹 - AND를 이용한 특정 비트 추출
    const val = rand(1, 15);
    const masks = [
      { mask: 0b1100, desc: '상위 2비트', maskStr: '1100' },
      { mask: 0b0110, desc: '가운데 2비트', maskStr: '0110' },
      { mask: 0b0011, desc: '하위 2비트', maskStr: '0011' },
      { mask: 0b1010, desc: '짝수 위치 비트', maskStr: '1010' },
      { mask: 0b0101, desc: '홀수 위치 비트', maskStr: '0101' },
    ];
    const m = masks[rand(0, masks.length - 1)];
    const result = val & m.mask;
    const valStr = val.toString(2).padStart(4, '0');
    answer = result.toString(2).padStart(4, '0');
    question = `${valStr} AND ${m.maskStr} = ? (${m.desc} 추출)`;
    hint = `마스킹: 각 비트별 AND → ${answer}`;
    wrongs = [
      (val | m.mask).toString(2).padStart(4, '0'),
      (val ^ m.mask).toString(2).padStart(4, '0'),
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
  } else {
    // 부울 대수 간소화
    const laws = [
      {
        q: 'A AND (A OR B) = ?',
        a: 'A',
        h: '흡수법칙: A AND (A OR B) = A',
        w: ['B', 'A OR B', 'A AND B'],
      },
      {
        q: 'A OR (A AND B) = ?',
        a: 'A',
        h: '흡수법칙: A OR (A AND B) = A',
        w: ['B', 'A AND B', 'A OR B'],
      },
      {
        q: 'A OR (NOT A) = ?',
        a: '1',
        h: '보수법칙: A OR (NOT A) = 1 (항상 참)',
        w: ['0', 'A', 'NOT A'],
      },
      {
        q: 'A AND (NOT A) = ?',
        a: '0',
        h: '보수법칙: A AND (NOT A) = 0 (항상 거짓)',
        w: ['1', 'A', 'NOT A'],
      },
      {
        q: 'A OR 0 = ?',
        a: 'A',
        h: '항등법칙: A OR 0 = A',
        w: ['0', '1', 'NOT A'],
      },
      {
        q: 'A AND 1 = ?',
        a: 'A',
        h: '항등법칙: A AND 1 = A',
        w: ['1', '0', 'NOT A'],
      },
      {
        q: 'A OR A = ?',
        a: 'A',
        h: '멱등법칙: A OR A = A',
        w: ['0', '1', '2A'],
      },
      {
        q: 'A AND A = ?',
        a: 'A',
        h: '멱등법칙: A AND A = A',
        w: ['0', '1', 'A²'],
      },
    ];
    const law = laws[rand(0, laws.length - 1)];
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
  const type = rand(0, 14);
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
  } else if (type === 7) {
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
  } else if (type === 8) {
    // 행렬 기본 - 2x2 행렬 덧셈 또는 원소 곱
    const isAdd = Math.random() > 0.5;
    if (isAdd) {
      // 2x2 행렬 덧셈: 특정 원소의 합을 물어봄
      const a = [rand(1, 9), rand(1, 9), rand(1, 9), rand(1, 9)];
      const b = [rand(1, 9), rand(1, 9), rand(1, 9), rand(1, 9)];
      const pos = rand(0, 3);
      const posNames = ['(1,1)', '(1,2)', '(2,1)', '(2,2)'];
      answer = a[pos] + b[pos];
      question = `행렬 A=[[${a[0]},${a[1]}],[${a[2]},${a[3]}]], B=[[${b[0]},${b[1]}],[${b[2]},${b[3]}]]일 때, (A+B)의 ${posNames[pos]} 원소는?`;
      hint = `행렬 덧셈: 같은 위치의 원소끼리 더함 → ${a[pos]} + ${b[pos]} = ${answer}`;
    } else {
      // 2x2 행렬의 특정 원소 곱
      const a = [rand(1, 9), rand(1, 9), rand(1, 9), rand(1, 9)];
      const b = [rand(1, 9), rand(1, 9), rand(1, 9), rand(1, 9)];
      // A*B의 (1,1) 원소 = a[0]*b[0] + a[1]*b[2]
      const results = [
        a[0]*b[0] + a[1]*b[2], // (1,1)
        a[0]*b[1] + a[1]*b[3], // (1,2)
        a[2]*b[0] + a[3]*b[2], // (2,1)
        a[2]*b[1] + a[3]*b[3], // (2,2)
      ];
      const pos = rand(0, 3);
      const posNames = ['(1,1)', '(1,2)', '(2,1)', '(2,2)'];
      answer = results[pos];
      const row = pos < 2 ? 0 : 1;
      const col = pos % 2;
      question = `행렬 A=[[${a[0]},${a[1]}],[${a[2]},${a[3]}]], B=[[${b[0]},${b[1]}],[${b[2]},${b[3]}]]일 때, (A×B)의 ${posNames[pos]} 원소는?`;
      hint = `행렬 곱: ${a[row*2]}×${b[col]} + ${a[row*2+1]}×${b[col+2]} = ${a[row*2]*b[col]} + ${a[row*2+1]*b[col+2]} = ${answer}`;
    }
    return { question, answer, hint };
  } else if (type === 9) {
    // 그래프 이론 기초 - 완전 그래프
    const isEdge = Math.random() > 0.5;
    if (isEdge) {
      // 꼭짓점 → 간선 수
      const v = rand(3, 8);
      answer = v * (v - 1) / 2;
      question = `꼭짓점 ${v}개인 완전그래프(K${v})의 간선 수는?`;
      hint = `완전그래프 간선 수 = V×(V-1)/2 = ${v}×${v - 1}/2 = ${answer}`;
    } else {
      // 간선 수 → 꼭짓점 수 (정확히 맞는 쌍만 사용)
      const vList = [3, 4, 5, 6, 7, 8];
      const v = vList[rand(0, vList.length - 1)];
      const e = v * (v - 1) / 2;
      answer = v;
      question = `간선이 ${e}개인 완전그래프의 꼭짓점 수는?`;
      hint = `V×(V-1)/2 = ${e} → V = ${v}`;
    }
    return { question, answer, hint };
  } else if (type === 10) {
    // 이진 탐색 트리 - 완전 이진 트리의 높이
    const nodes = [1, 3, 7, 15, 31, 63];
    const heights = [0, 1, 2, 3, 4, 5];
    const idx = rand(1, nodes.length - 1);
    answer = heights[idx];
    question = `${nodes[idx]}개의 노드가 있는 완전 이진 트리의 높이는?`;
    hint = `높이 = floor(log\u2082(${nodes[idx]})) = ${answer} (레벨 0부터 시작)`;
    return { question, answer, hint };
  } else if (type === 11) {
    // 해시 함수 - key % divisor
    const divisors = [7, 11, 13, 17];
    const divisor = divisors[rand(0, divisors.length - 1)];
    const key = rand(20, 200);
    answer = key % divisor;
    question = `해시함수 h(k) = k % ${divisor}일 때, h(${key}) = ?`;
    hint = `${key} % ${divisor} = ${key} - ${Math.floor(key / divisor)}×${divisor} = ${answer}`;
    return { question, answer, hint };
  } else if (type === 12) {
    // 진수 연산 혼합
    const subType = rand(0, 2);
    if (subType === 0) {
      // 0xFF - 0xF0 style
      const a = rand(1, 15) * 16; // multiples of 16: 16,32,...,240
      const b = rand(1, Math.floor(a / 16)) * 16;
      const diff = a - b;
      answer = '0x' + diff.toString(16).toUpperCase();
      question = `0x${a.toString(16).toUpperCase()} - 0x${b.toString(16).toUpperCase()} = ?`;
      hint = `${a} - ${b} = ${diff} → ${answer}`;
      wrongs = [
        '0x' + (diff + 16).toString(16).toUpperCase(),
        '0x' + (Math.abs(diff - 16) || 1).toString(16).toUpperCase(),
        '0x' + (diff + rand(1, 8)).toString(16).toUpperCase(),
      ];
      const wrongSet = new Set(wrongs.filter(w => w !== answer));
      let fb = 1;
      while (wrongSet.size < 3) {
        const w = '0x' + (diff + fb * 4).toString(16).toUpperCase();
        if (w !== answer) wrongSet.add(w);
        fb++;
      }
      wrongs = [...wrongSet].slice(0, 3);
      return { question, answer, hint, isBinary: true, wrongs };
    } else if (subType === 1) {
      // 0xA + 0xB style (small hex addition)
      const a = rand(1, 12);
      const b = rand(1, 12);
      const sum = a + b;
      answer = '0x' + sum.toString(16).toUpperCase();
      question = `0x${a.toString(16).toUpperCase()} + 0x${b.toString(16).toUpperCase()} = ?`;
      hint = `${a} + ${b} = ${sum} → ${answer}`;
      wrongs = [
        '0x' + (sum + 1).toString(16).toUpperCase(),
        '0x' + (sum > 1 ? sum - 1 : sum + 2).toString(16).toUpperCase(),
        '0x' + (sum + rand(2, 5)).toString(16).toUpperCase(),
      ];
      const wrongSet = new Set(wrongs.filter(w => w !== answer));
      let fb = 3;
      while (wrongSet.size < 3) {
        const w = '0x' + (sum + fb).toString(16).toUpperCase();
        if (w !== answer) wrongSet.add(w);
        fb++;
      }
      wrongs = [...wrongSet].slice(0, 3);
      return { question, answer, hint, isBinary: true, wrongs };
    } else {
      // 0b1010 * 2 style (binary shift multiplication)
      const n = rand(1, 7);
      const multiplier = [2, 4][rand(0, 1)];
      const result = n * multiplier;
      const shift = multiplier === 2 ? 1 : 2;
      answer = '0b' + result.toString(2);
      question = `0b${n.toString(2)} × ${multiplier} = ?`;
      hint = `2진수 × ${multiplier} = 왼쪽으로 ${shift}비트 시프트 → 0b${n.toString(2)} → ${answer}`;
      wrongs = [
        '0b' + (result + 1).toString(2),
        '0b' + (result > 1 ? result - 1 : result + 2).toString(2),
        '0b' + (result + rand(2, 4)).toString(2),
      ];
      const wrongSet = new Set(wrongs.filter(w => w !== answer));
      let fb = 3;
      while (wrongSet.size < 3) {
        const w = '0b' + (result + fb).toString(2);
        if (w !== answer) wrongSet.add(w);
        fb++;
      }
      wrongs = [...wrongSet].slice(0, 3);
      return { question, answer, hint, isBinary: true, wrongs };
    }
  } else if (type === 13) {
    // 네트워크 수학 - 서브넷 호스트 수
    const prefixes = [24, 25, 26, 27, 28, 29, 30];
    const prefix = prefixes[rand(0, prefixes.length - 1)];
    const hostBits = 32 - prefix;
    answer = Math.pow(2, hostBits) - 2;
    question = `서브넷 마스크 /${prefix}의 사용 가능한 호스트 수는?`;
    hint = `호스트 비트 = 32-${prefix} = ${hostBits}, 호스트 수 = 2^${hostBits} - 2 = ${answer} (네트워크/브로드캐스트 주소 제외)`;
    return { question, answer, hint };
  } else {
    // ASCII 코드
    const asciiQuestions = [
      { q: "문자 'A'의 ASCII 코드는?", a: 65, h: "'A' = 65 (대문자 A부터 65, B=66, ...)" },
      { q: "문자 'Z'의 ASCII 코드는?", a: 90, h: "'Z' = 90 (A=65이므로 65+25=90)" },
      { q: "문자 'a'의 ASCII 코드는?", a: 97, h: "'a' = 97 (소문자 a부터 97)" },
      { q: "문자 'z'의 ASCII 코드는?", a: 122, h: "'z' = 122 (a=97이므로 97+25=122)" },
      { q: "문자 '0'의 ASCII 코드는?", a: 48, h: "'0' = 48 (숫자 0부터 48, 1=49, ...)" },
      { q: "문자 '9'의 ASCII 코드는?", a: 57, h: "'9' = 57 (0=48이므로 48+9=57)" },
      { q: "ASCII 코드 65는 어떤 문자?", a: 'A', h: "65 = 'A' (대문자 알파벳의 시작)", w: ['a', 'B', '0'] },
      { q: "ASCII 코드 48은 어떤 문자?", a: '0', h: "48 = '0' (숫자의 시작)", w: ['A', '1', 'a'] },
      { q: "ASCII 코드 97은 어떤 문자?", a: 'a', h: "97 = 'a' (소문자 알파벳의 시작)", w: ['A', 'b', '0'] },
      { q: "'A'와 'a'의 ASCII 코드 차이는?", a: 32, h: "'a'(97) - 'A'(65) = 32" },
      { q: "공백(space)의 ASCII 코드는?", a: 32, h: "공백(space) = 32" },
    ];
    const q = asciiQuestions[rand(0, asciiQuestions.length - 1)];
    if (q.w) {
      // String answer with wrongs
      return { question: q.q, answer: q.a, hint: q.h, isBinary: true, wrongs: q.w };
    }
    return { question: q.q, answer: q.a, hint: q.h };
  }
}

function genAiMath() {
  const type = rand(0, 14);
  let question, answer, hint, wrongs;

  if (type === 0) {
    // Sigmoid function: σ(0) = 0.5
    answer = 0.5;
    question = 'σ(0) = ? (시그모이드 함수)';
    hint = 'σ(x) = 1/(1+e^(-x)), σ(0) = 1/(1+1) = 0.5';
    return { question, answer, hint, isFraction: true };
  } else if (type === 1) {
    // ReLU function: max(0, x)
    const x = rand(-10, 10);
    answer = Math.max(0, x);
    question = `ReLU(${x}) = ? (max(0, x))`;
    hint = `ReLU(${x}) = max(0, ${x}) = ${answer}`;
    return { question, answer, hint };
  } else if (type === 2) {
    // Softmax denominator (2 elements) - exact calculation
    // Use simple e^0=1, e^1≈2.718 → approximate with nice numbers
    // Instead, test understanding: "softmax([2,2])의 첫 번째 원소는?"
    answer = 0.5;
    question = 'softmax([x, x])의 첫 번째 원소는? (같은 값 두 개)';
    hint = 'e^x / (e^x + e^x) = 1/2 = 0.5';
    return { question, answer, hint, isFraction: true };
  } else if (type === 3) {
    // One-hot encoding dimension
    const classes = rand(3, 10);
    const idx = rand(0, classes - 1);
    answer = classes;
    question = `${classes}개 클래스의 원핫 인코딩 벡터 길이는?`;
    hint = `클래스 수 = 벡터 차원 = ${classes}`;
    return { question, answer, hint };
  } else if (type === 4) {
    // Convolution output size: (W - K + 2P)/S + 1
    const W = [28, 32, 64, 224][rand(0, 3)];
    const K = [3, 5, 7][rand(0, 2)];
    const S = [1, 2][rand(0, 1)];
    const P = [0, 1][rand(0, 1)];
    answer = Math.floor((W - K + 2 * P) / S) + 1;
    question = `CNN: 입력=${W}, 커널=${K}, 스트라이드=${S}, 패딩=${P}일 때 출력 크기는?`;
    hint = `(${W}-${K}+2×${P})/${S}+1 = ${answer}`;
    return { question, answer, hint };
  } else if (type === 5) {
    // Attention score dimension: Q·K^T → (seq_len × d_k) · (d_k × seq_len) = seq_len × seq_len
    const seqLen = [4, 8, 16, 32][rand(0, 3)];
    const dk = [8, 16, 32, 64][rand(0, 3)];
    answer = seqLen * seqLen;
    question = `Self-Attention: Q(${seqLen}×${dk}) · K^T(${dk}×${seqLen})의 결과 크기는?`;
    hint = `행렬곱 (${seqLen}×${dk})·(${dk}×${seqLen}) = ${seqLen}×${seqLen} = ${answer}개 원소`;
    return { question, answer, hint };
  } else if (type === 6) {
    // Model parameters: simple MLP layer
    const input_dim = [64, 128, 256, 512][rand(0, 3)];
    const output_dim = [32, 64, 128, 256][rand(0, 3)];
    answer = input_dim * output_dim + output_dim; // weights + bias
    question = `MLP 레이어: 입력=${input_dim}, 출력=${output_dim}일 때 파라미터 수는? (바이어스 포함)`;
    hint = `가중치(${input_dim}×${output_dim}) + 바이어스(${output_dim}) = ${input_dim * output_dim} + ${output_dim} = ${answer}`;
    return { question, answer, hint };
  } else if (type === 7) {
    // Batch processing: total_samples / batch_size = iterations per epoch
    const total = [1000, 5000, 10000, 50000, 60000][rand(0, 4)];
    const batch = [8, 16, 32, 64, 128, 256][rand(0, 5)];
    answer = Math.ceil(total / batch);
    question = `데이터 ${total.toLocaleString()}개, 배치 크기 ${batch}일 때 1에포크의 이터레이션 수는?`;
    hint = `⌈${total}/${batch}⌉ = ${answer}`;
    return { question, answer, hint };
  } else if (type === 8) {
    // Token count estimation: ~4 chars per token (English), rough estimate
    const words = [100, 500, 1000, 2000][rand(0, 3)];
    answer = Math.round(words * 1.3); // ~1.3 tokens per word average
    question = `영어 ${words}단어는 약 몇 토큰? (1단어 ≈ 1.3토큰)`;
    hint = `${words} × 1.3 ≈ ${answer}`;
    return { question, answer, hint };
  } else if (type === 9) {
    // Learning rate: if lr=0.01 and weight=0.5, gradient=2 → new weight = 0.5 - 0.01*2 = 0.48
    const lr_choices = [0.1, 0.01];
    const lr = lr_choices[rand(0, 1)];
    const w = rand(1, 5);
    const grad = rand(1, 5);
    const result = w - lr * grad;
    answer = parseFloat(result.toFixed(2));
    question = `경사하강법: w=${w}, lr=${lr}, 기울기=${grad}일 때 업데이트된 w는?`;
    hint = `w_new = w - lr × grad = ${w} - ${lr}×${grad} = ${answer}`;
    return { question, answer, hint, isFraction: true };
  } else if (type === 10) {
    // Precision/Recall: TP, FP, FN
    const tp = rand(5, 50);
    const fp = rand(1, 20);
    const fn = rand(1, 20);
    // Choose precision or recall
    if (rand(0, 1) === 0) {
      // Precision = TP / (TP + FP)  → use values where division is exact
      const denom = tp + fp;
      answer = Math.round((tp / denom) * 100);
      question = `TP=${tp}, FP=${fp}일 때 정밀도(Precision)는 몇 %? (반올림)`;
      hint = `Precision = TP/(TP+FP) = ${tp}/${denom} ≈ ${answer}%`;
    } else {
      const denom = tp + fn;
      answer = Math.round((tp / denom) * 100);
      question = `TP=${tp}, FN=${fn}일 때 재현율(Recall)은 몇 %? (반올림)`;
      hint = `Recall = TP/(TP+FN) = ${tp}/${denom} ≈ ${answer}%`;
    }
    return { question, answer, hint };
  } else if (type === 11) {
    // Embedding dimension: total memory
    const vocab = [10000, 30000, 50000][rand(0, 2)];
    const dim = [128, 256, 512][rand(0, 2)];
    answer = vocab * dim;
    question = `어휘 ${(vocab/1000)}K, 임베딩 차원 ${dim}일 때 임베딩 테이블의 파라미터 수는?`;
    hint = `${vocab.toLocaleString()} × ${dim} = ${answer.toLocaleString()}`;
    return { question, answer, hint };
  } else if (type === 12) {
    // Transformer head count: d_model / d_k = num_heads
    const d_model = [256, 512, 768, 1024][rand(0, 3)];
    const num_heads = [4, 8, 12, 16][rand(0, 3)];
    const d_k = d_model / num_heads;
    if (d_k !== Math.floor(d_k)) {
      // fallback to safe values
      answer = 8;
      question = `d_model=512, d_k=64일 때 멀티헤드 어텐션의 헤드 수는?`;
      hint = `num_heads = d_model/d_k = 512/64 = 8`;
    } else {
      answer = num_heads;
      question = `d_model=${d_model}, d_k=${d_k}일 때 멀티헤드 어텐션의 헤드 수는?`;
      hint = `num_heads = d_model/d_k = ${d_model}/${d_k} = ${num_heads}`;
    }
    return { question, answer, hint };
  } else if (type === 13) {
    // Pooling output: Max pooling or Average pooling on a small array
    const arr = [rand(1, 9), rand(1, 9), rand(1, 9), rand(1, 9)];
    if (rand(0, 1) === 0) {
      answer = Math.max(...arr);
      question = `MaxPooling([${arr.join(', ')}]) = ?`;
      hint = `최대값 = ${answer}`;
    } else {
      answer = (arr[0] + arr[1] + arr[2] + arr[3]) / 4;
      // Ensure exact
      if (answer !== Math.floor(answer)) {
        // retry with multiples of 4
        const base = rand(1, 5);
        const a2 = [base*4, base*2, base*2, base*4];
        answer = (a2[0]+a2[1]+a2[2]+a2[3])/4;
        question = `AvgPooling([${a2.join(', ')}]) = ?`;
        hint = `평균 = (${a2.join('+')})/4 = ${answer}`;
      } else {
        question = `AvgPooling([${arr.join(', ')}]) = ?`;
        hint = `평균 = (${arr.join('+')})/4 = ${answer}`;
      }
    }
    return { question, answer, hint };
  } else {
    // Dropout: effective neurons
    const total = [100, 256, 512, 1024][rand(0, 3)];
    const rate_choices = [0.1, 0.2, 0.25, 0.5];
    const rate = rate_choices[rand(0, 3)];
    answer = total * (1 - rate);
    question = `뉴런 ${total}개에 드롭아웃 ${rate*100}%를 적용하면 활성 뉴런 수는?`;
    hint = `${total} × (1-${rate}) = ${total} × ${1-rate} = ${answer}`;
    return { question, answer, hint };
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
  ai_math: genAiMath,
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
  { key: "ai_math",  icon: "🤖", label: "AI수학" },
];
