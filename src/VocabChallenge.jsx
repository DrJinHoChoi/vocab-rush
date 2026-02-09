import { useState, useEffect, useCallback, useRef } from "react";

const VOCAB_DATA = {
  business: [
    { en: "Revenue", ko: "수익", hint: "회사의 총 매출액" },
    { en: "Deadline", ko: "마감일", hint: "작업 완료 기한" },
    { en: "Negotiate", ko: "협상하다", hint: "조건을 논의하다" },
    { en: "Implement", ko: "실행하다", hint: "계획을 실제로 행하다" },
    { en: "Stakeholder", ko: "이해관계자", hint: "프로젝트에 관련된 사람" },
    { en: "Benchmark", ko: "기준점", hint: "성과 비교 기준" },
    { en: "Leverage", ko: "활용하다", hint: "자원을 효과적으로 사용" },
    { en: "Scalable", ko: "확장 가능한", hint: "규모를 키울 수 있는" },
    { en: "Compliance", ko: "준수", hint: "규정을 따르는 것" },
    { en: "Acquisition", ko: "인수", hint: "회사를 사들이는 것" },
    { en: "Allocate", ko: "배분하다", hint: "자원을 나누어 주다" },
    { en: "Audit", ko: "감사", hint: "회계 검토 작업" },
    { en: "Feasibility", ko: "타당성", hint: "실현 가능 여부" },
    { en: "Procurement", ko: "조달", hint: "필요 물자를 구입" },
    { en: "Synergy", ko: "시너지", hint: "협력의 상승 효과" },
  ],
  tech: [
    { en: "Algorithm", ko: "알고리즘", hint: "문제 해결 절차" },
    { en: "Deploy", ko: "배포하다", hint: "서비스를 출시하다" },
    { en: "Latency", ko: "지연 시간", hint: "응답까지 걸리는 시간" },
    { en: "Bandwidth", ko: "대역폭", hint: "데이터 전송 용량" },
    { en: "Encryption", ko: "암호화", hint: "데이터를 보호하는 기술" },
    { en: "Repository", ko: "저장소", hint: "코드를 보관하는 곳" },
    { en: "Debugging", ko: "디버깅", hint: "오류를 찾아 수정" },
    { en: "Throughput", ko: "처리량", hint: "단위 시간당 처리 능력" },
    { en: "Scalability", ko: "확장성", hint: "시스템 성장 가능성" },
    { en: "Middleware", ko: "미들웨어", hint: "소프트웨어 중간 계층" },
    { en: "Authentication", ko: "인증", hint: "사용자 신원 확인" },
    { en: "Redundancy", ko: "이중화", hint: "백업 시스템 구성" },
    { en: "Refactoring", ko: "리팩토링", hint: "코드 구조 개선" },
    { en: "Iteration", ko: "반복", hint: "개발 주기 반복" },
    { en: "Deprecated", ko: "지원 중단된", hint: "더 이상 사용 권장 안 됨" },
  ],
  daily: [
    { en: "Procrastinate", ko: "미루다", hint: "할 일을 나중으로 넘기다" },
    { en: "Overwhelmed", ko: "압도된", hint: "감당할 수 없는 느낌" },
    { en: "Commute", ko: "통근하다", hint: "집과 직장 오가기" },
    { en: "Exhausted", ko: "지친", hint: "매우 피곤한 상태" },
    { en: "Collaborate", ko: "협업하다", hint: "함께 일하다" },
    { en: "Prioritize", ko: "우선순위를 정하다", hint: "중요한 것을 먼저" },
    { en: "Efficient", ko: "효율적인", hint: "낭비 없이 잘 하는" },
    { en: "Delegate", ko: "위임하다", hint: "업무를 다른 사람에게" },
    { en: "Multitask", ko: "멀티태스킹", hint: "여러 일을 동시에" },
    { en: "Proactive", ko: "능동적인", hint: "미리 행동하는" },
    { en: "Resilient", ko: "회복력 있는", hint: "어려움에서 다시 일어나는" },
    { en: "Versatile", ko: "다재다능한", hint: "여러 방면에 능한" },
    { en: "Meticulous", ko: "꼼꼼한", hint: "세부사항에 주의하는" },
    { en: "Pragmatic", ko: "실용적인", hint: "현실적으로 접근하는" },
    { en: "Ambitious", ko: "야심 찬", hint: "큰 목표를 가진" },
  ],
};

const DIFFICULTY = {
  easy: { time: 15, label: "Easy", points: 10, color: "#4ade80" },
  medium: { time: 10, label: "Medium", points: 20, color: "#facc15" },
  hard: { time: 6, label: "Hard", points: 35, color: "#f87171" },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateChoices(correct, allWords) {
  const others = allWords.filter((w) => w.en !== correct.en);
  const wrong = shuffle(others).slice(0, 3);
  return shuffle([correct, ...wrong]);
}

export default function VocabChallenge() {
  const [screen, setScreen] = useState("menu");
  const [category, setCategory] = useState("business");
  const [difficulty, setDifficulty] = useState("medium");
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selected, setSelected] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [results, setResults] = useState([]);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [comboFlash, setComboFlash] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const allWords = [
    ...VOCAB_DATA.business,
    ...VOCAB_DATA.tech,
    ...VOCAB_DATA.daily,
  ];

  const startGame = useCallback(() => {
    const words = shuffle(VOCAB_DATA[category]).slice(0, 10);
    const qs = words.map((w) => ({
      word: w,
      choices: generateChoices(w, allWords),
    }));
    setQuestions(qs);
    setCurrent(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSelected(null);
    setShowHint(false);
    setResults([]);
    setTimeLeft(DIFFICULTY[difficulty].time);
    setScreen("play");
    startTimeRef.current = Date.now();
  }, [category, difficulty]);

  useEffect(() => {
    if (screen !== "play" || selected !== null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, current, selected]);

  const handleAnswer = (choice) => {
    if (selected !== null) return;
    clearInterval(timerRef.current);
    const q = questions[current];
    const correct = choice && choice.en === q.word.en;
    const speedBonus =
      correct && timeLeft > DIFFICULTY[difficulty].time * 0.6
        ? Math.floor(timeLeft * 2)
        : 0;
    const newStreak = correct ? streak + 1 : 0;
    const streakBonus = correct && newStreak >= 3 ? newStreak * 5 : 0;
    const pts = correct ? DIFFICULTY[difficulty].points + speedBonus + streakBonus : 0;

    if (correct && newStreak >= 3) {
      setComboFlash(true);
      setTimeout(() => setComboFlash(false), 800);
    }
    if (!correct) {
      setShakeWrong(true);
      setTimeout(() => setShakeWrong(false), 500);
    }

    setSelected(choice || { en: "__timeout__" });
    setScore((s) => s + pts);
    setStreak(newStreak);
    setBestStreak((b) => Math.max(b, newStreak));
    setResults((r) => [
      ...r,
      {
        word: q.word,
        chosen: choice,
        correct,
        points: pts,
        timeUsed: DIFFICULTY[difficulty].time - timeLeft,
      },
    ]);

    setTimeout(() => {
      if (current + 1 >= questions.length) {
        setScreen("result");
      } else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setShowHint(false);
        setTimeLeft(DIFFICULTY[difficulty].time);
      }
    }, 1500);
  };

  const timerPercent = (timeLeft / DIFFICULTY[difficulty].time) * 100;
  const timerColor =
    timerPercent > 50 ? "#4ade80" : timerPercent > 25 ? "#facc15" : "#ef4444";

  const totalTime = results.reduce((a, r) => a + r.timeUsed, 0);
  const correctCount = results.filter((r) => r.correct).length;

  // --- MENU ---
  if (screen === "menu") {
    return (
      <div style={styles.container}>
        <div style={styles.menuCard}>
          <div style={styles.logoArea}>
            <div style={styles.logoIcon}>⚡</div>
            <h1 style={styles.title}>VOCAB RUSH</h1>
            <p style={styles.subtitle}>직장인 영어 어휘 타이머 챌린지</p>
          </div>

          <div style={styles.section}>
            <p style={styles.sectionLabel}>카테고리</p>
            <div style={styles.optionRow}>
              {[
                { key: "business", icon: "💼", label: "비즈니스" },
                { key: "tech", icon: "💻", label: "테크" },
                { key: "daily", icon: "☕", label: "직장생활" },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  style={{
                    ...styles.optionBtn,
                    ...(category === c.key ? styles.optionBtnActive : {}),
                  }}
                >
                  <span style={{ fontSize: 22 }}>{c.icon}</span>
                  <span style={{ fontSize: 13, marginTop: 4 }}>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <p style={styles.sectionLabel}>난이도</p>
            <div style={styles.optionRow}>
              {Object.entries(DIFFICULTY).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setDifficulty(key)}
                  style={{
                    ...styles.optionBtn,
                    ...(difficulty === key ? styles.optionBtnActive : {}),
                    borderColor:
                      difficulty === key ? val.color : "rgba(255,255,255,0.1)",
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 700, color: difficulty === key ? val.color : "#aaa" }}>
                    {val.time}s
                  </span>
                  <span style={{ fontSize: 12, marginTop: 2, color: difficulty === key ? val.color : "#888" }}>
                    {val.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={startGame} style={styles.startBtn}>
            <span style={{ fontSize: 18 }}>🚀</span>
            <span>게임 시작</span>
          </button>

          <div style={styles.rules}>
            <p style={{ fontWeight: 600, marginBottom: 6, color: "#ccc" }}>게임 규칙</p>
            <p>• 한국어 뜻을 보고 영어 단어를 고르세요</p>
            <p>• 빠를수록 보너스 점수!</p>
            <p>• 3연속 정답 시 콤보 보너스 🔥</p>
            <p>• 힌트 사용 가능 (점수 감소 없음)</p>
          </div>
        </div>
      </div>
    );
  }

  // --- PLAY ---
  if (screen === "play") {
    const q = questions[current];
    return (
      <div style={styles.container}>
        <div style={styles.gameCard}>
          {comboFlash && (
            <div style={styles.comboOverlay}>
              🔥 {streak} COMBO!
            </div>
          )}

          {/* Header */}
          <div style={styles.gameHeader}>
            <div style={styles.scoreDisplay}>
              <span style={{ fontSize: 12, color: "#888" }}>SCORE</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{score}</span>
            </div>
            <div style={styles.progressText}>
              {current + 1} / {questions.length}
            </div>
            <div style={styles.streakDisplay}>
              <span style={{ fontSize: 12, color: "#888" }}>STREAK</span>
              <span style={{
                fontSize: 22,
                fontWeight: 800,
                color: streak >= 3 ? "#f59e0b" : "#fff",
              }}>
                {streak >= 3 ? "🔥" : ""}{streak}
              </span>
            </div>
          </div>

          {/* Timer bar */}
          <div style={styles.timerBarBg}>
            <div
              style={{
                ...styles.timerBarFill,
                width: `${timerPercent}%`,
                backgroundColor: timerColor,
                transition: "width 1s linear, background-color 0.3s",
              }}
            />
          </div>

          <div style={styles.timerNumber}>
            <span style={{ color: timerColor, fontSize: 28, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
              {timeLeft}
            </span>
            <span style={{ fontSize: 12, color: "#666", marginLeft: 4 }}>초</span>
          </div>

          {/* Question */}
          <div style={styles.questionArea}>
            <p style={styles.questionLabel}>이 뜻의 영어 단어는?</p>
            <div style={styles.koreanWord}>{q.word.ko}</div>
            {showHint && (
              <div style={styles.hintBox}>💡 {q.word.hint}</div>
            )}
            {!showHint && selected === null && (
              <button onClick={() => setShowHint(true)} style={styles.hintBtn}>
                힌트 보기
              </button>
            )}
          </div>

          {/* Choices */}
          <div style={styles.choicesGrid}>
            {q.choices.map((ch, i) => {
              const isSelected = selected && selected.en === ch.en;
              const isCorrect = ch.en === q.word.en;
              const revealed = selected !== null;
              let bg = "rgba(255,255,255,0.04)";
              let border = "rgba(255,255,255,0.1)";
              let textColor = "#e2e8f0";

              if (revealed) {
                if (isCorrect) {
                  bg = "rgba(74,222,128,0.15)";
                  border = "#4ade80";
                  textColor = "#4ade80";
                } else if (isSelected && !isCorrect) {
                  bg = "rgba(248,113,113,0.15)";
                  border = "#f87171";
                  textColor = "#f87171";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(ch)}
                  disabled={selected !== null}
                  style={{
                    ...styles.choiceBtn,
                    backgroundColor: bg,
                    borderColor: border,
                    color: textColor,
                    transform:
                      shakeWrong && isSelected && !isCorrect
                        ? "translateX(-4px)"
                        : "none",
                    cursor: selected !== null ? "default" : "pointer",
                  }}
                >
                  <span style={styles.choiceNumber}>{["A", "B", "C", "D"][i]}</span>
                  <span style={styles.choiceText}>{ch.en}</span>
                  {revealed && isCorrect && <span style={{ marginLeft: "auto" }}>✓</span>}
                  {revealed && isSelected && !isCorrect && <span style={{ marginLeft: "auto" }}>✗</span>}
                </button>
              );
            })}
          </div>

          {/* Progress dots */}
          <div style={styles.progressDots}>
            {questions.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor:
                    i < results.length
                      ? results[i].correct
                        ? "#4ade80"
                        : "#f87171"
                      : i === current
                      ? "#60a5fa"
                      : "rgba(255,255,255,0.15)",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- RESULT ---
  if (screen === "result") {
    const grade =
      correctCount >= 9
        ? { emoji: "🏆", text: "완벽해요!", color: "#fbbf24" }
        : correctCount >= 7
        ? { emoji: "🌟", text: "훌륭해요!", color: "#4ade80" }
        : correctCount >= 5
        ? { emoji: "👍", text: "좋아요!", color: "#60a5fa" }
        : { emoji: "💪", text: "다시 도전!", color: "#f87171" };

    return (
      <div style={styles.container}>
        <div style={styles.resultCard}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>{grade.emoji}</div>
          <h2 style={{ ...styles.gradeText, color: grade.color }}>{grade.text}</h2>

          <div style={styles.statGrid}>
            <div style={styles.statBox}>
              <span style={styles.statNum}>{score}</span>
              <span style={styles.statLabel}>총 점수</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statNum}>
                {correctCount}/{questions.length}
              </span>
              <span style={styles.statLabel}>정답</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statNum}>{bestStreak}</span>
              <span style={styles.statLabel}>최고 연속</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statNum}>{totalTime}s</span>
              <span style={styles.statLabel}>총 시간</span>
            </div>
          </div>

          <div style={styles.resultList}>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#aaa", marginBottom: 10 }}>
              오답 복습
            </p>
            {results.filter((r) => !r.correct).length === 0 ? (
              <p style={{ color: "#4ade80", fontSize: 14 }}>모두 정답! 완벽합니다 🎉</p>
            ) : (
              results
                .filter((r) => !r.correct)
                .map((r, i) => (
                  <div key={i} style={styles.reviewItem}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#f87171", fontSize: 14 }}>✗</span>
                      <span style={{ color: "#fff", fontWeight: 600 }}>{r.word.en}</span>
                      <span style={{ color: "#888" }}>—</span>
                      <span style={{ color: "#cbd5e1" }}>{r.word.ko}</span>
                    </div>
                    {r.chosen && r.chosen.en !== "__timeout__" && (
                      <span style={{ fontSize: 12, color: "#f87171" }}>
                        선택: {r.chosen.en}
                      </span>
                    )}
                    {(!r.chosen || r.chosen.en === "__timeout__") && (
                      <span style={{ fontSize: 12, color: "#888" }}>⏱ 시간 초과</span>
                    )}
                  </div>
                ))
            )}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button onClick={startGame} style={styles.retryBtn}>
              🔄 다시 도전
            </button>
            <button onClick={() => setScreen("menu")} style={styles.menuBtn}>
              메뉴로
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(145deg, #0a0a1a 0%, #0f172a 50%, #0a0a1a 100%)",
    padding: 16,
    fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  menuCard: {
    width: "100%",
    maxWidth: 420,
    padding: "36px 28px",
    borderRadius: 24,
    background: "linear-gradient(180deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
  },
  logoArea: {
    textAlign: "center",
    marginBottom: 32,
  },
  logoIcon: {
    fontSize: 42,
    marginBottom: 12,
    filter: "drop-shadow(0 0 20px rgba(250,204,21,0.4))",
  },
  title: {
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: 6,
    color: "#f8fafc",
    margin: 0,
    textShadow: "0 0 30px rgba(96,165,250,0.3)",
  },
  subtitle: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 8,
    letterSpacing: 1,
  },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 10,
  },
  optionRow: { display: "flex", gap: 10 },
  optionBtn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 8px",
    borderRadius: 14,
    border: "1.5px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)",
    color: "#e2e8f0",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  optionBtnActive: {
    background: "rgba(96,165,250,0.12)",
    borderColor: "#60a5fa",
    boxShadow: "0 0 20px rgba(96,165,250,0.15)",
  },
  startBtn: {
    width: "100%",
    padding: "16px 0",
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
    color: "#fff",
    fontSize: 17,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    letterSpacing: 2,
    boxShadow: "0 8px 30px rgba(99,102,241,0.35)",
    transition: "transform 0.15s",
    marginTop: 8,
  },
  rules: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    background: "rgba(255,255,255,0.03)",
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.8,
  },
  gameCard: {
    width: "100%",
    maxWidth: 460,
    padding: "24px 24px 20px",
    borderRadius: 24,
    background: "linear-gradient(180deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
    position: "relative",
    overflow: "hidden",
  },
  comboOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: 36,
    fontWeight: 900,
    color: "#fbbf24",
    textShadow: "0 0 40px rgba(251,191,36,0.6)",
    zIndex: 20,
    pointerEvents: "none",
    animation: "none",
    letterSpacing: 4,
  },
  gameHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  scoreDisplay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  progressText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 600,
  },
  streakDisplay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  timerBarBg: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    background: "rgba(255,255,255,0.06)",
    marginBottom: 8,
    overflow: "hidden",
  },
  timerBarFill: {
    height: "100%",
    borderRadius: 3,
    boxShadow: "0 0 12px currentColor",
  },
  timerNumber: {
    textAlign: "center",
    marginBottom: 20,
    display: "flex",
    alignItems: "baseline",
    justifyContent: "center",
  },
  questionArea: {
    textAlign: "center",
    marginBottom: 24,
  },
  questionLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 12,
    fontWeight: 500,
  },
  koreanWord: {
    fontSize: 36,
    fontWeight: 800,
    color: "#f8fafc",
    letterSpacing: 2,
    textShadow: "0 0 30px rgba(248,250,252,0.1)",
  },
  hintBox: {
    marginTop: 12,
    padding: "8px 16px",
    borderRadius: 10,
    background: "rgba(250,204,21,0.08)",
    border: "1px solid rgba(250,204,21,0.2)",
    color: "#fbbf24",
    fontSize: 13,
    display: "inline-block",
  },
  hintBtn: {
    marginTop: 10,
    padding: "6px 16px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "#64748b",
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  choicesGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 20,
  },
  choiceBtn: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 18px",
    borderRadius: 14,
    border: "1.5px solid",
    background: "rgba(255,255,255,0.04)",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "left",
  },
  choiceNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    flexShrink: 0,
  },
  choiceText: {
    flex: 1,
  },
  progressDots: {
    display: "flex",
    justifyContent: "center",
    gap: 8,
  },
  resultCard: {
    width: "100%",
    maxWidth: 440,
    padding: "36px 28px",
    borderRadius: 24,
    background: "linear-gradient(180deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
    textAlign: "center",
  },
  gradeText: {
    fontSize: 28,
    fontWeight: 800,
    margin: "0 0 24px 0",
    letterSpacing: 2,
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px 12px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  statNum: {
    fontSize: 24,
    fontWeight: 800,
    color: "#f8fafc",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  resultList: {
    textAlign: "left",
    padding: 16,
    borderRadius: 14,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  reviewItem: {
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  retryBtn: {
    flex: 1,
    padding: "14px 0",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 1,
    boxShadow: "0 8px 25px rgba(99,102,241,0.3)",
  },
  menuBtn: {
    flex: 1,
    padding: "14px 0",
    borderRadius: 14,
    border: "1.5px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: 1,
  },
};
