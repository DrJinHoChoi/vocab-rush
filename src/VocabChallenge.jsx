import { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// 5,000+ VOCABULARY DATABASE - loaded from vocabData.js
// ============================================================
import { VOCAB_DATA } from "./vocabData.js";
import { generateMathQuestions, MATH_CATEGORIES } from "./mathData.js";
import { generateKoreanQuestions, KOREAN_CATEGORIES } from "./koreanData.js";

// ============================================================
// ADSENSE CONFIG — 발급 후 여기에 입력
// ============================================================
const AD_CONFIG = {
  publisherId: "ca-pub-6402470001589987",
  slots: {
    menuBanner:   "1234567890", // 메뉴 하단 배너 — AdSense 승인 후 실제 슬롯 ID로 교체
    resultBanner: "1234567891", // 결과 화면 배너 — AdSense 승인 후 실제 슬롯 ID로 교체
    sidebarAd:    "1234567892", // PC 왼쪽 사이드바 — AdSense 승인 후 실제 슬롯 ID로 교체
  },
};

// ============================================================
// AD BANNER COMPONENT (Google AdSense)
// ============================================================
function AdBanner({ slot, format = "auto", style = {} }) {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      if (adRef.current && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      }
    } catch (e) {}
  }, []);

  const isConfigured = !AD_CONFIG.publisherId.includes("XXXX");

  // AdSense 미설정 → 플레이스홀더 표시
  if (!isConfigured) {
    return (
      <div style={{
        margin: "16px auto", padding: "20px 12px", textAlign: "center",
        background: "rgba(96,165,250,0.08)", borderRadius: 12,
        border: "1px solid rgba(96,165,250,0.25)", ...style,
      }}>
        <p style={{ fontSize: 11, color: "#94a3b8", letterSpacing: 2, fontWeight: 600 }}>AD</p>
        <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>
          📢 광고 영역
        </p>
      </div>
    );
  }

  return (
    <div style={{ margin: "16px auto", textAlign: "center", overflow: "hidden", ...style }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CONFIG.publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

const CATEGORIES = [
  { key: "random", icon: "🎲", label: "랜덤 믹스" },
  { key: "A1", icon: "🟢", label: "기초 A1" },
  { key: "A2", icon: "🔵", label: "초급 A2" },
  { key: "B1", icon: "🟡", label: "중급 B1" },
  { key: "B2", icon: "🟠", label: "중상급 B2" },
  { key: "C1", icon: "🔴", label: "고급 C1" },
  { key: "C2", icon: "🏆", label: "SAT/최상급" },
  { key: "tech", icon: "💻", label: "테크" },
  { key: "toeic", icon: "📋", label: "TOEIC" },
];

// 수능 전용: 비수능 카테고리(테크/TOEIC, 진법/논리/CS/AI수학, IT/AI/프롬프트/학습법)는 숨김 — 데이터는 보존, 키만 노출
const SUNEUNG_VOCAB = ["random", "A1", "A2", "B1", "B2", "C1", "C2"];
const SUNEUNG_MATH = ["random", "add_sub", "multiply", "divide", "mixed", "fraction", "percent", "power"];
const SUNEUNG_KOREAN = ["random", "spelling", "spacing", "idiom", "proverb", "synonym", "antonym", "honorific", "prefix"];

const DIFFICULTY = {
  easy: { time: 15, label: "Easy", points: 10, color: "#4ade80" },
  medium: { time: 10, label: "Medium", points: 20, color: "#facc15" },
  hard: { time: 6, label: "Hard", points: 35, color: "#f87171" },
};

const ROUND_OPTIONS = [10, 15, 20, 25];

// ============================================================
// ACHIEVEMENT / REWARD SYSTEM
// ============================================================
const ACHIEVEMENTS = [
  // 누적 정답 마일스톤
  { id: "c100",   icon: "🌱", title: "첫 걸음",     desc: "누적 100문제 정답", check: s => s.totalCorrect >= 100 },
  { id: "c300",   icon: "🌿", title: "새싹",        desc: "누적 300문제 정답", check: s => s.totalCorrect >= 300 },
  { id: "c500",   icon: "🌳", title: "성장",        desc: "누적 500문제 정답", check: s => s.totalCorrect >= 500 },
  { id: "c1000",  icon: "🔥", title: "천 단어 마스터", desc: "누적 1,000문제 정답!", check: s => s.totalCorrect >= 1000 },
  { id: "c2000",  icon: "💎", title: "어휘 장인",    desc: "누적 2,000문제 정답!", check: s => s.totalCorrect >= 2000 },
  { id: "c5000",  icon: "👑", title: "전설",        desc: "누적 5,000문제 정답!", check: s => s.totalCorrect >= 5000 },
  { id: "c10000", icon: "🏅", title: "신화",        desc: "누적 10,000문제 정답!", check: s => s.totalCorrect >= 10000 },
  // 연속 정답
  { id: "s5",  icon: "⚡", title: "번개",    desc: "5연속 정답", check: s => s.bestStreakEver >= 5 },
  { id: "s10", icon: "🌊", title: "파도",    desc: "10연속 정답", check: s => s.bestStreakEver >= 10 },
  { id: "s15", icon: "🌪️", title: "폭풍",    desc: "15연속 정답", check: s => s.bestStreakEver >= 15 },
  { id: "s20", icon: "☄️", title: "혜성",    desc: "20연속 정답", check: s => s.bestStreakEver >= 20 },
  { id: "s25", icon: "🪐", title: "행성 정복", desc: "25연속 전문 올킬!", check: s => s.bestStreakEver >= 25 },
  // 게임 횟수
  { id: "g10",  icon: "🎮", title: "단골",    desc: "10게임 플레이", check: s => s.totalGames >= 10 },
  { id: "g50",  icon: "🎯", title: "습관",    desc: "50게임 플레이", check: s => s.totalGames >= 50 },
  { id: "g100", icon: "🏆", title: "중독",    desc: "100게임 플레이", check: s => s.totalGames >= 100 },
  { id: "g500", icon: "🦾", title: "영어 머신", desc: "500게임 플레이", check: s => s.totalGames >= 500 },
  // 퍼펙트 라운드
  { id: "p1",  icon: "✨", title: "퍼펙트!",   desc: "첫 만점 라운드", check: s => s.perfectRounds >= 1 },
  { id: "p10", icon: "💫", title: "완벽주의자", desc: "10회 만점 라운드", check: s => s.perfectRounds >= 10 },
  { id: "p50", icon: "🌟", title: "무결점",    desc: "50회 만점 라운드", check: s => s.perfectRounds >= 50 },
  // 누적 점수
  { id: "sc5k",  icon: "💰", title: "부자",     desc: "누적 5,000점", check: s => s.totalScore >= 5000 },
  { id: "sc20k", icon: "💎", title: "재벌",     desc: "누적 20,000점", check: s => s.totalScore >= 20000 },
  { id: "sc100k",icon: "🏦", title: "점수왕",   desc: "누적 100,000점", check: s => s.totalScore >= 100000 },
];

const DEFAULT_MODE_STATS = { totalCorrect: 0, totalGames: 0, bestStreakEver: 0, totalScore: 0, perfectRounds: 0 };
const DEFAULT_STATS = {
  totalCorrect: 0,
  totalGames: 0,
  bestStreakEver: 0,
  totalScore: 0,
  perfectRounds: 0,
  unlockedIds: [],
  vocab: { ...DEFAULT_MODE_STATS },
  math: { ...DEFAULT_MODE_STATS },
  korean: { ...DEFAULT_MODE_STATS },
};

function loadStats() {
  try {
    const raw = localStorage.getItem("vocab_rush_stats");
    if (raw) return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch (e) {}
  return { ...DEFAULT_STATS };
}

function saveStats(stats) {
  try { localStorage.setItem("vocab_rush_stats", JSON.stringify(stats)); } catch (e) {}
}

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

// ============================================================
// AUDIO: Google TTS (primary) + Speech API (fallback)
// ============================================================
let _audioUnlocked = false;
let _audioCtx = null;
let _currentAudio = null;

function unlockAudio() {
  if (_audioUnlocked) return;
  _audioUnlocked = true;
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    // Play silent buffer to unlock iOS audio
    const buf = _audioCtx.createBuffer(1, 1, 22050);
    const src = _audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(_audioCtx.destination);
    src.start(0);
  } catch (e) {}
  // Also pre-warm HTML5 Audio for mobile
  try {
    const a = new Audio();
    a.volume = 0.01;
    a.play().catch(() => {});
  } catch (e) {}
}

// Primary: Google Translate TTS via Audio element (works on all mobile)
function speakWord(word) {
  try {
    // Stop previous audio
    if (_currentAudio) {
      _currentAudio.pause();
      _currentAudio = null;
    }
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(word)}`;
    const audio = new Audio(url);
    audio.volume = 1;
    _currentAudio = audio;
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Fallback: Web Speech API
        speakWordFallback(word);
      });
    }
  } catch (e) {
    speakWordFallback(word);
  }
}

// Fallback: Web Speech API
function speakWordFallback(word) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  try {
    synth.resume();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "en-US";
    u.rate = 0.85;
    synth.speak(u);
  } catch (e) {}
}

function stopSpeech() {
  try {
    if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  } catch (e) {}
}

function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === "suspended") _audioCtx.resume();
  return _audioCtx;
}

function playCorrectSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

function playWrongSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

function playComboSound() {
  try {
    const ctx = getAudioCtx();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.3);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.3);
    });
  } catch (e) {}
}

function playTickSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function VocabChallenge() {
  const [isWide, setIsWide] = useState(() => window.innerWidth >= 768);
  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [screen, setScreen] = useState("menu");
  const [gameMode, setGameMode] = useState("vocab"); // "vocab" | "math"
  const [category, setCategory] = useState("random");
  const [mathCategory, setMathCategory] = useState("random");
  const [koreanCategory, setKoreanCategory] = useState("random");
  const [difficulty, setDifficulty] = useState("medium");
  const [roundSize, setRoundSize] = useState(10);
  const [soundOn, setSoundOn] = useState(true);
  const soundRef = useRef(true);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selected, setSelected] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [showDef, setShowDef] = useState(false);
  const [results, setResults] = useState([]);
  const [comboFlash, setComboFlash] = useState(false);
  const [gameCount, setGameCount] = useState(0);
  const [stats, setStats] = useState(loadStats);
  const [newAchievements, setNewAchievements] = useState([]);
  const [showBadges, setShowBadges] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [reviewFlipped, setReviewFlipped] = useState(false);
  const timerRef = useRef(null);

  const allWords = Object.values(VOCAB_DATA).flat();

  useEffect(() => {
    // Unlock audio on first touch/click (mobile requires user gesture)
    const handler = () => { unlockAudio(); };
    document.addEventListener("touchstart", handler, { once: true });
    document.addEventListener("click", handler, { once: true });
    return () => {
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("click", handler);
    };
  }, []);

  // Keep ref in sync with state so closures always read latest value
  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

  const startGame = useCallback(() => {
    unlockAudio();
    let qs;
    if (gameMode === "math") {
      const mathQs = generateMathQuestions(mathCategory, roundSize);
      qs = mathQs.map((mq) => ({
        isMath: true,
        mathQuestion: mq.question,
        mathAnswer: mq.answer,
        mathHint: mq.hint,
        word: { en: String(mq.answer), ko: mq.question },
        choices: mq.choices.map(c => ({ en: c.label, label: c.label, _isCorrect: c.isCorrect })),
      }));
    } else if (gameMode === "korean") {
      const korQs = generateKoreanQuestions(koreanCategory, roundSize);
      qs = korQs.map((kq) => ({
        isKorean: true,
        korQuestion: kq.question,
        korAnswer: kq.answer,
        korHint: kq.hint,
        word: { en: kq.answer, ko: kq.question },
        choices: kq.choices.map(c => ({ en: c.label, label: c.label, _isCorrect: c.isCorrect })),
      }));
    } else {
      const pool = category === "random" ? allWords : VOCAB_DATA[category];
      const words = shuffle(pool).slice(0, roundSize);
      qs = words.map((w) => ({
        word: w,
        choices: generateChoices(w, allWords),
      }));
    }
    setQuestions(qs);
    setCurrent(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSelected(null);
    setShowHint(false);
    setShowExample(false);
    setShowDef(false);
    setResults([]);
    setTimeLeft(DIFFICULTY[difficulty].time);
    setScreen("play");
  }, [gameMode, category, mathCategory, koreanCategory, difficulty, roundSize]);

  useEffect(() => {
    if (screen !== "play" || selected !== null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 4 && t > 1 && soundRef.current) playTickSound();
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

  // Auto-speak word on new question (vocab mode only)
  useEffect(() => {
    if (screen === "play" && selected === null && questions[current] && soundRef.current && !questions[current].isMath && !questions[current].isKorean) {
      setTimeout(() => speakWord(questions[current].word.en), 300);
    }
  }, [screen, current, selected]);

  const handleAnswer = (choice) => {
    if (selected !== null) return;
    clearInterval(timerRef.current);
    const q = questions[current];
    const correct = (q.isMath || q.isKorean)
      ? (choice && choice._isCorrect === true)
      : (choice && choice.en === q.word.en);
    const speedBonus =
      correct && timeLeft > DIFFICULTY[difficulty].time * 0.6
        ? Math.floor(timeLeft * 2)
        : 0;
    const newStreak = correct ? streak + 1 : 0;
    const streakBonus = correct && newStreak >= 3 ? newStreak * 5 : 0;
    const pts = correct ? DIFFICULTY[difficulty].points + speedBonus + streakBonus : 0;

    if (soundRef.current) {
      if (correct && newStreak >= 3) {
        playComboSound();
      } else if (correct) {
        playCorrectSound();
      } else {
        playWrongSound();
      }
    }

    if (correct && newStreak >= 3) {
      setComboFlash(true);
      setTimeout(() => setComboFlash(false), 800);
    }

    setSelected(choice || { en: "__timeout__", _isCorrect: false });
    setScore((s) => s + pts);
    setStreak(newStreak);
    setBestStreak((b) => Math.max(b, newStreak));
    setResults((r) => [
      ...r,
      {
        word: q.word,
        question: q,
        chosen: choice,
        correct,
        points: pts,
        timeUsed: DIFFICULTY[difficulty].time - timeLeft,
      },
    ]);

    setTimeout(() => {
      if (current + 1 >= questions.length) {
        const newCount = gameCount + 1;
        setGameCount(newCount);

        // Update persistent stats
        const currentResults = [...results, {
          word: q.word, chosen: choice || { en: "__timeout__" },
          correct, points: pts, timeUsed: DIFFICULTY[difficulty].time - timeLeft,
        }];
        const roundCorrect = currentResults.filter(r => r.correct).length;
        const isPerfect = roundCorrect === questions.length;

        setStats(prev => {
          const modeKey = gameMode; // "vocab" | "math" | "korean"
          const prevMode = prev[modeKey] || { ...DEFAULT_MODE_STATS };
          const updated = {
            ...prev,
            totalCorrect: prev.totalCorrect + roundCorrect,
            totalGames: prev.totalGames + 1,
            bestStreakEver: Math.max(prev.bestStreakEver, Math.max(bestStreak, newStreak)),
            totalScore: prev.totalScore + score + pts,
            perfectRounds: prev.perfectRounds + (isPerfect ? 1 : 0),
            [modeKey]: {
              totalCorrect: prevMode.totalCorrect + roundCorrect,
              totalGames: prevMode.totalGames + 1,
              bestStreakEver: Math.max(prevMode.bestStreakEver || 0, Math.max(bestStreak, newStreak)),
              totalScore: prevMode.totalScore + score + pts,
              perfectRounds: prevMode.perfectRounds + (isPerfect ? 1 : 0),
            },
          };
          // Check new achievements
          const newly = ACHIEVEMENTS.filter(
            a => !prev.unlockedIds.includes(a.id) && a.check(updated)
          );
          if (newly.length > 0) {
            updated.unlockedIds = [...prev.unlockedIds, ...newly.map(a => a.id)];
            setNewAchievements(newly);
          }
          saveStats(updated);
          return updated;
        });

        setScreen("result");
      } else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setShowHint(false);
        setShowExample(false);
        setShowDef(false);
        setTimeLeft(DIFFICULTY[difficulty].time);
      }
    }, 1800);
  };

  const timerPercent = (timeLeft / DIFFICULTY[difficulty].time) * 100;
  const timerColor =
    timerPercent > 50 ? "#4ade80" : timerPercent > 25 ? "#facc15" : "#ef4444";
  const totalTime = results.reduce((a, r) => a + r.timeUsed, 0);
  const correctCount = results.filter((r) => r.correct).length;

  // ========================= MENU =========================
  if (screen === "menu") {
    return (
      <div style={{ ...S.container, ...(isWide ? { alignItems: "center", padding: 12 } : {}) }}>
        <div style={{
          ...S.menuCard,
          ...(isWide ? {
            maxWidth: 860,
            padding: "20px 22px",
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
            alignItems: "flex-start",
          } : {}),
        }}>
          {/* 왼쪽 패널 (PC) / 상단 (모바일): 로고+통계+규칙 */}
          <div style={isWide ? { flex: 1, minWidth: 0 } : {}}>
          <div style={{ ...S.logoArea, ...(isWide ? { marginBottom: 16 } : {}) }}>
            <div style={{ ...S.logoIcon, ...(isWide ? { fontSize: 28, marginBottom: 6 } : {}) }}>⚡</div>
            <h1 style={{ ...S.title, ...(isWide ? { fontSize: 24, letterSpacing: 4 } : {}) }}>STUDY RUSH</h1>
            <p style={S.subtitle}>
              {gameMode === "math"
                ? "암산 · 수학Ⅰ·Ⅱ · 수능 대비 타이머 게임"
                : gameMode === "korean"
                ? "어휘 · 맞춤법 · 수능 국어 타이머 게임"
                : "영어 어휘 · CEFR · 수능 대비 타이머 게임"}
            </p>
            <p style={S.wordCount}>
              {gameMode === "math"
                ? "기초 연산부터 수학Ⅰ·Ⅱ까지 🔢"
                : gameMode === "korean"
                ? `어휘 · 맞춤법 · 사자성어 ✏️`
                : `총 ${allWords.length.toLocaleString()}개 단어 · CEFR A1~C2 🔊`}
            </p>
            <p style={{ fontSize: 10, color: "#6ee7b7", marginTop: 4, letterSpacing: 0.5 }}>
              🎯 국 · 영 · 수, 기초부터 수능까지 게임으로!
            </p>
            <a href="https://www.instagram.com/doyou_popup_store" target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12,
                padding: "5px 12px", borderRadius: 999, textDecoration: "none",
                background: "rgba(245,182,11,0.12)", border: "1px solid rgba(245,182,11,0.45)",
                fontSize: 11, fontWeight: 700, color: "#f5b60b", letterSpacing: 0.3,
              }}>
              🏬 DOYOU POP-UP STORE가 제공하는 게임
            </a>
          </div>

          {/* 게임 모드 탭 */}
          <div style={{
            display: "flex", gap: 0, marginBottom: 12, borderRadius: 12, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)",
          }}>
            <button
              onClick={() => setGameMode("vocab")}
              style={{
                flex: 1, padding: "12px 0", border: "none", cursor: "pointer",
                background: gameMode === "vocab"
                  ? "linear-gradient(135deg, rgba(96,165,250,0.2), rgba(59,130,246,0.1))"
                  : "transparent",
                color: gameMode === "vocab" ? "#60a5fa" : "#64748b",
                fontSize: 14, fontWeight: 700,
                borderBottom: gameMode === "vocab" ? "2px solid #60a5fa" : "2px solid transparent",
                transition: "all 0.2s",
              }}
            >
              📚 영어
            </button>
            <button
              onClick={() => setGameMode("math")}
              style={{
                flex: 1, padding: "12px 0", border: "none", cursor: "pointer",
                background: gameMode === "math"
                  ? "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))"
                  : "transparent",
                color: gameMode === "math" ? "#fbbf24" : "#64748b",
                fontSize: 14, fontWeight: 700,
                borderBottom: gameMode === "math" ? "2px solid #fbbf24" : "2px solid transparent",
                transition: "all 0.2s",
              }}
            >
              🔢 수학
            </button>
            <button
              onClick={() => setGameMode("korean")}
              style={{
                flex: 1, padding: "12px 0", border: "none", cursor: "pointer",
                background: gameMode === "korean"
                  ? "linear-gradient(135deg, rgba(74,222,128,0.2), rgba(34,197,94,0.1))"
                  : "transparent",
                color: gameMode === "korean" ? "#4ade80" : "#64748b",
                fontSize: 14, fontWeight: 700,
                borderBottom: gameMode === "korean" ? "2px solid #4ade80" : "2px solid transparent",
                transition: "all 0.2s",
              }}
            >
              ✏️ 국어
            </button>
          </div>

          {/* 누적 통계 (과목별) */}
          {(() => {
            const ms = stats[gameMode] || DEFAULT_MODE_STATS;
            return (
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8,
                margin: "12px 0 8px", padding: "14px 8px", borderRadius: 14,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#4ade80" }}>{ms.totalCorrect.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>누적 정답</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#facc15" }}>{ms.totalGames}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>총 게임</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#f87171" }}>{ms.bestStreakEver || 0}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>최고 연속</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#60a5fa" }}>{stats.unlockedIds.length}/{ACHIEVEMENTS.length}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>업적</div>
                </div>
              </div>
            );
          })()}

          {/* 배지 보기 버튼 */}
          <button
            onClick={() => setShowBadges(true)}
            style={{
              width: "100%", padding: "10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)", color: "#94a3b8", fontSize: 13,
              cursor: "pointer", fontWeight: 500, marginBottom: 8,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            🏅 업적 & 보상 보기 ({stats.unlockedIds.length}개 달성)
          </button>

          {/* PC 왼쪽 사이드바 광고 */}
          {isWide && <AdBanner slot={AD_CONFIG.slots.sidebarAd} style={{ margin: "12px 0 0" }} />}

          </div>{/* end left panel */}

          {/* 오른쪽 패널 (PC) / 하단 (모바일): 설정+시작 */}
          <div style={isWide ? { flex: 1, minWidth: 0 } : {}}>
          <div style={{ ...S.section, ...(isWide ? { marginBottom: 12 } : {}) }}>
            <p style={S.sectionLabel}>카테고리</p>
            <div style={S.catGrid}>
              {gameMode === "math" ? (
                MATH_CATEGORIES.filter((c) => SUNEUNG_MATH.includes(c.key)).map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setMathCategory(c.key)}
                    style={{
                      ...S.catBtn,
                      ...(mathCategory === c.key ? { ...S.catBtnActive, borderColor: "#fbbf24", background: "rgba(251,191,36,0.12)" } : {}),
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{c.icon}</span>
                    <span style={{ fontSize: 12, marginTop: 3 }}>{c.label}</span>
                    <span style={{ fontSize: 10, color: "#64748b" }}>∞</span>
                  </button>
                ))
              ) : gameMode === "korean" ? (
                KOREAN_CATEGORIES.filter((c) => SUNEUNG_KOREAN.includes(c.key)).map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setKoreanCategory(c.key)}
                    style={{
                      ...S.catBtn,
                      ...(koreanCategory === c.key ? { ...S.catBtnActive, borderColor: "#4ade80", background: "rgba(74,222,128,0.12)" } : {}),
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{c.icon}</span>
                    <span style={{ fontSize: 12, marginTop: 3 }}>{c.label}</span>
                  </button>
                ))
              ) : (
                CATEGORIES.filter((c) => SUNEUNG_VOCAB.includes(c.key)).map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    style={{
                      ...S.catBtn,
                      ...(category === c.key ? S.catBtnActive : {}),
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{c.icon}</span>
                    <span style={{ fontSize: 12, marginTop: 3 }}>{c.label}</span>
                    <span style={{ fontSize: 10, color: "#64748b" }}>
                      {c.key === "random" ? allWords.length : VOCAB_DATA[c.key].length}개
                    </span>
                  </button>
                ))
              )}
            </div>
            {/* AI 도구 활용 팁 */}
            {(() => {
              const aiCat = (gameMode === "math" && ["ai_math", "binary", "logic", "cs_math"].includes(mathCategory))
                || (gameMode === "korean" && ["ai_tool", "it_term", "it_spell", "prompt", "prefix", "study"].includes(koreanCategory))
                || (gameMode === "vocab" && ["tech", "toeic"].includes(category));
              if (!aiCat) return null;
              const tips = {
                ai_math: "💡 AI 모델의 핵심 수학 — sigmoid, ReLU, softmax, CNN, Attention 등",
                binary: "💡 컴퓨터의 언어 — 2진법, 16진법은 프로그래밍의 기초",
                logic: "💡 논리 연산은 AI 회로와 알고리즘의 핵심 원리",
                cs_math: "💡 순열·조합·확률은 AI 알고리즘 분석의 필수 수학",
                ai_tool: "💡 ChatGPT, Claude 등 AI 도구를 200% 활용하는 지식",
                it_term: "💡 개발자와 소통하려면 IT 용어부터!",
                it_spell: "💡 알고리즘? 알고리듬? AI 시대 올바른 표기법",
                prompt: "💡 프롬프트 엔지니어링 — AI를 200% 활용하는 핵심 스킬",
                prefix: "💡 접두사·접미사를 알면 모르는 영단어도 뜻을 추론 가능!",
                study: "💡 과학적 학습법 — 간격 반복, 능동적 회상으로 효율 UP",
                tech: "💡 AI/ML, 클라우드, 보안 등 테크 영어 어휘력 UP",
                toeic: "💡 TOEIC 비즈니스 영어 — 회의·계약·인사·금융 핵심 어휘",
              };
              const key = gameMode === "math" ? mathCategory : gameMode === "korean" ? koreanCategory : category;
              return (
                <div style={{
                  marginTop: 8, padding: "8px 12px", borderRadius: 8,
                  background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.15)",
                  fontSize: 11, color: "#6ee7b7", lineHeight: 1.5, textAlign: "center",
                }}>
                  {tips[key] || "💡 AI 도구 활용에 도움이 되는 문제들입니다"}
                </div>
              );
            })()}
          </div>

          <div style={{ ...S.section, ...(isWide ? { marginBottom: 12 } : {}) }}>
            <p style={S.sectionLabel}>난이도</p>
            <div style={S.optionRow}>
              {Object.entries(DIFFICULTY).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setDifficulty(key)}
                  style={{
                    ...S.optionBtn,
                    ...(difficulty === key ? S.optionBtnActive : {}),
                    borderColor:
                      difficulty === key ? val.color : "rgba(255,255,255,0.1)",
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 700, color: difficulty === key ? val.color : "#aaa" }}>
                    {val.time}s
                  </span>
                  <span style={{ fontSize: 11, color: difficulty === key ? val.color : "#888" }}>
                    {val.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...S.section, ...(isWide ? { marginBottom: 12 } : {}) }}>
            <p style={S.sectionLabel}>문제 수</p>
            <div style={S.optionRow}>
              {ROUND_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setRoundSize(n)}
                  style={{
                    ...S.optionBtn,
                    ...(roundSize === n ? S.optionBtnActive : {}),
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 700, color: roundSize === n ? "#60a5fa" : "#aaa" }}>
                    {n}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...S.section, display: "flex", justifyContent: "space-between", alignItems: "center", ...(isWide ? { marginBottom: 12 } : {}) }}>
            <p style={{ ...S.sectionLabel, margin: 0 }}>사운드</p>
            <button
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                if (next) {
                  unlockAudio(); // re-unlock on ON
                } else {
                  stopSpeech();
                }
              }}
              style={{
                ...S.soundToggle,
                background: soundOn ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.05)",
                borderColor: soundOn ? "#60a5fa" : "rgba(255,255,255,0.1)",
              }}
            >
              {soundOn ? "🔊 ON" : "🔇 OFF"}
            </button>
          </div>

          <button onClick={startGame} style={{ ...S.startBtn, ...(isWide ? { padding: "12px 0", fontSize: 15 } : {}) }}>
            <span style={{ fontSize: 18 }}>🚀</span>
            <span>게임 시작</span>
          </button>
          </div>{/* end right panel */}

          {/* 하단 공통: 규칙+광고+링크 (PC에서는 전체 너비) */}
          <div style={isWide ? { width: "100%", flexBasis: "100%" } : {}}>
          <div style={{ ...S.rules, ...(isWide ? { marginTop: 8, padding: 10, fontSize: 11 } : {}) }}>
            <p style={{ fontWeight: 600, marginBottom: 6, color: "#ccc" }}>게임 규칙</p>
            <p>🔊 영어 발음을 듣고 한국어 뜻을 보고 정답을 고르세요</p>
            <p>⚡ 빠를수록 보너스 점수!</p>
            <p>🔥 3연속 정답 시 콤보 보너스!</p>
            <p>💡 힌트 & 예문 사용 가능</p>
          </div>

          {/* 메뉴 하단 배너 광고 */}
          <AdBanner slot={AD_CONFIG.slots.menuBanner} />

          {/* DataPD 서비스 */}
          <div style={{
            display: "flex", gap: 8, marginTop: 12,
          }}>
            <a
              href="https://study.datapd.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, padding: "12px 10px", borderRadius: 12, textDecoration: "none",
                background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span style={{ fontSize: 20 }}>📖</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>AI 학습</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>study.datapd.ai</div>
              </div>
            </a>
            <a
              href="https://finance.datapd.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, padding: "12px 10px", borderRadius: 12, textDecoration: "none",
                background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span style={{ fontSize: 20 }}>💹</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>AI 금융</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>finance.datapd.ai</div>
              </div>
            </a>
          </div>

          {/* 학습 가이드 */}
          <div style={{
            marginTop: 16, padding: "16px 14px", borderRadius: 12,
            background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.1)",
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
              📚 학습 가이드
            </div>
            <p style={{ fontSize: 12.5, color: "#94a3b8", marginBottom: 10, lineHeight: 1.6 }}>
              국·영·수 수능 학습 글 — 어휘 전략 · 어원 · 맞춤법 · 학습법.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
              {[
                { href: "/guide-vocab.html", label: "영어 어휘" },
                { href: "/guide-prefix.html", label: "접두사·접미사" },
                { href: "/guide-spelling.html", label: "맞춤법" },
                { href: "/guide-study-tips.html", label: "학습법" },
              ].map(g => (
                <a key={g.href} href={g.href} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 14, color: "#60a5fa", textDecoration: "none", lineHeight: "28px" }}
                >{g.label}</a>
              ))}
            </div>
            <a href="/learn.html" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 10, marginRight: 14, fontSize: 13, fontWeight: 800, color: "#60a5fa", textDecoration: "none" }}>🗺️ 수능 학습 로드맵 →</a>
            <a href="/guides.html" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 10, fontSize: 13, fontWeight: 700, color: "#60a5fa", textDecoration: "none" }}>📖 전체 학습 가이드 보기 →</a>
            <div style={{ marginTop: 8, fontSize: 12.5, color: "#94a3b8" }}>
              게임 소개:{" "}
              <a href="/play-vocab.html" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "none" }}>영어 게임</a>{" · "}
              <a href="/play-math.html" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "none" }}>수학 게임</a>{" · "}
              <a href="/play-korean.html" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "none" }}>국어 게임</a>
            </div>
            <div style={{ marginTop: 6, fontSize: 12.5, color: "#94a3b8" }}>
              🎓 수능 대비:{" "}
              <a href="/suneung-korean.html" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "none" }}>수능 국어</a>{" · "}
              <a href="/suneung-english.html" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "none" }}>수능 영어</a>{" · "}
              <a href="/suneung-math.html" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "none" }}>수능 수학</a>{" · "}
              <a href="/suneung-quiz.html" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "none", fontWeight: 700 }}>🎮 수능 게임</a>
            </div>
          </div>

          <div style={{ display: "block", textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
            <a href="/about.html" target="_blank" style={{ color: "#94a3b8", textDecoration: "none" }}>소개</a>
            {" · "}
            <a href="/contact.html" target="_blank" style={{ color: "#94a3b8", textDecoration: "none" }}>문의</a>
            {" · "}
            <a href="/terms.html" target="_blank" style={{ color: "#94a3b8", textDecoration: "none" }}>이용약관</a>
            {" · "}
            <a href="/privacy.html" target="_blank" style={{ color: "#94a3b8", textDecoration: "none" }}>개인정보처리방침</a>
          </div>
          </div>{/* end bottom section */}
        </div>

        {/* 배지 모달 */}
        {showBadges && <BadgesModal stats={stats} onClose={() => setShowBadges(false)} />}
      </div>
    );
  }

  // ========================= PLAY =========================
  if (screen === "play") {
    const q = questions[current];
    return (
      <div style={S.container}>
        <div style={S.gameCard}>
          {comboFlash && (
            <div style={S.comboOverlay}>🔥 {streak} COMBO!</div>
          )}

          <div style={S.gameHeader}>
            <div style={S.scoreDisplay}>
              <span style={{ fontSize: 11, color: "#888" }}>SCORE</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{score}</span>
            </div>
            <div style={S.progressText}>
              {current + 1} / {questions.length}
            </div>
            <div style={S.streakDisplay}>
              <span style={{ fontSize: 11, color: "#888" }}>STREAK</span>
              <span style={{
                fontSize: 20,
                fontWeight: 800,
                color: streak >= 3 ? "#f59e0b" : "#fff",
              }}>
                {streak >= 3 ? "🔥" : ""}{streak}
              </span>
            </div>
          </div>

          <div style={S.timerBarBg}>
            <div
              style={{
                ...S.timerBarFill,
                width: `${timerPercent}%`,
                backgroundColor: timerColor,
                transition: "width 1s linear, background-color 0.3s",
              }}
            />
          </div>

          <div style={S.timerNumber}>
            <span style={{ color: timerColor, fontSize: 26, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
              {timeLeft}
            </span>
            <span style={{ fontSize: 11, color: "#666", marginLeft: 4 }}>초</span>
          </div>

          <div style={S.questionArea}>
            {q.isMath ? (
              <>
                <p style={S.questionLabel}>정답을 고르세요!</p>
                <div style={{ ...S.koreanWord, fontFamily: "'JetBrains Mono', monospace", fontSize: 28 }}>
                  {q.mathQuestion}
                </div>
                <div style={S.helpRow}>
                  {!showHint && selected === null && q.mathHint && (
                    <button onClick={() => setShowHint(true)} style={S.helpBtn}>
                      💡 힌트
                    </button>
                  )}
                </div>
                {showHint && q.mathHint && <div style={S.hintBox}>💡 {q.mathHint}</div>}
              </>
            ) : q.isKorean ? (
              <>
                <p style={{ fontSize: 20, color: "#f0fdf4", fontWeight: 700, marginBottom: 8, lineHeight: 1.6 }}>{q.korQuestion}</p>
                <div style={S.helpRow}>
                  {!showHint && selected === null && q.korHint && (
                    <button onClick={() => setShowHint(true)} style={S.helpBtn}>
                      💡 힌트
                    </button>
                  )}
                </div>
                {showHint && q.korHint && <div style={S.hintBox}>💡 {q.korHint}</div>}
              </>
            ) : (
              <>
                <p style={S.questionLabel}>이 뜻의 영어 단어는?</p>
                {q.word.pos && <span style={{ fontSize: 12, color: "#60a5fa", fontWeight: 600, letterSpacing: 1 }}>{q.word.pos}</span>}
                <div style={S.koreanWord}>{q.word.ko}</div>
                <button
                  onClick={() => { unlockAudio(); speakWord(q.word.en); }}
                  style={S.speakerBtn}
                  title="발음 다시 듣기"
                >
                  🔊
                </button>
                <div style={S.helpRow}>
                  {!showHint && selected === null && q.word.hint && (
                    <button onClick={() => setShowHint(true)} style={S.helpBtn}>
                      💡 힌트
                    </button>
                  )}
                  {!showExample && selected === null && q.word.ex && (
                    <button onClick={() => setShowExample(true)} style={S.helpBtn}>
                      📖 예문
                    </button>
                  )}
                  {!showDef && selected === null && q.word.def && (
                    <button onClick={() => setShowDef(true)} style={S.helpBtn}>
                      📘 정의
                    </button>
                  )}
                </div>
                {showHint && q.word.hint && <div style={S.hintBox}>💡 {q.word.hint}</div>}
                {showExample && q.word.ex && (
                  <div style={{ ...S.hintBox, borderColor: "rgba(96,165,250,0.3)", background: "rgba(96,165,250,0.08)", color: "#93c5fd" }}>
                    📖 {q.word.ex}
                  </div>
                )}
                {showDef && q.word.def && (
                  <div style={{ ...S.hintBox, borderColor: "rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.08)", color: "#c4b5fd" }}>
                    📘 {q.word.def}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Correct answer reveal */}
          {(q.isMath || q.isKorean) ? (
            <>
              {selected && selected._isCorrect && (
                <div style={S.revealBox}>
                  ✅ <strong>{q.isMath ? q.mathQuestion.replace("= ?", `= ${q.mathAnswer}`) : q.korAnswer}</strong>
                </div>
              )}
              {selected && !selected._isCorrect && (
                <div style={{ ...S.revealBox, borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", color: "#fca5a5" }}>
                  <div>정답: <strong>{q.isMath ? q.mathQuestion.replace("= ?", `= ${q.mathAnswer}`) : q.korAnswer}</strong></div>
                  {(q.mathHint || q.korHint) && <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>💡 {q.mathHint || q.korHint}</div>}
                </div>
              )}
            </>
          ) : (
            <>
              {selected && selected.en !== "__timeout__" && selected.en === q.word.en && (
                <div style={S.revealBox}>
                  <div>✅ <strong>{q.word.en}</strong> {q.word.pos && <span style={{ fontSize: 11, color: "#86efac" }}>({q.word.pos})</span>} — {q.word.ko}</div>
                  {q.word.def && <div style={{ fontSize: 12, color: "#86efac", marginTop: 4, fontStyle: "italic" }}>{q.word.def}</div>}
                </div>
              )}
              {selected && (selected.en === "__timeout__" || selected.en !== q.word.en) && (
                <div style={{ ...S.revealBox, borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", color: "#fca5a5" }}>
                  <div>정답: <strong>{q.word.en}</strong> {q.word.pos && <span style={{ fontSize: 11 }}>({q.word.pos})</span>} — {q.word.ko}</div>
                  {q.word.def && <div style={{ fontSize: 12, marginTop: 4, fontStyle: "italic", opacity: 0.8 }}>{q.word.def}</div>}
                </div>
              )}
            </>
          )}

          <div style={S.choicesGrid}>
            {q.choices.map((ch, i) => {
              const isSelected = (q.isMath || q.isKorean)
                ? (selected && selected.label === ch.label)
                : (selected && selected.en === ch.en);
              const isCorrect = (q.isMath || q.isKorean) ? ch._isCorrect : ch.en === q.word.en;
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
                  onClick={() => { unlockAudio(); handleAnswer(ch); }}
                  disabled={selected !== null}
                  style={{
                    ...S.choiceBtn,
                    backgroundColor: bg,
                    borderColor: border,
                    color: textColor,
                    cursor: selected !== null ? "default" : "pointer",
                    ...(q.isMath ? { justifyContent: "center", fontFamily: "'JetBrains Mono', monospace" } : {}),
                  }}
                >
                  <span style={S.choiceNumber}>{["A", "B", "C", "D"][i]}</span>
                  <span style={S.choiceText}>{(q.isMath || q.isKorean) ? ch.label : ch.en}</span>
                  {revealed && isCorrect && <span style={{ marginLeft: "auto" }}>✓</span>}
                  {revealed && isSelected && !isCorrect && <span style={{ marginLeft: "auto" }}>✗</span>}
                </button>
              );
            })}
          </div>

          <div style={S.progressDots}>
            {questions.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor:
                    i < results.length
                      ? results[i].correct ? "#4ade80" : "#f87171"
                      : i === current ? "#60a5fa" : "rgba(255,255,255,0.15)",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ========================= RESULT =========================
  if (screen === "result") {
    const pct = Math.round((correctCount / questions.length) * 100);
    const grade =
      pct >= 90
        ? { emoji: "🏆", text: "완벽해요!", color: "#fbbf24" }
        : pct >= 70
        ? { emoji: "🌟", text: "훌륭해요!", color: "#4ade80" }
        : pct >= 50
        ? { emoji: "👍", text: "좋아요!", color: "#60a5fa" }
        : { emoji: "💪", text: "다시 도전!", color: "#f87171" };

    const wrongWords = results.filter((r) => !r.correct);

    return (
      <div style={S.container}>
        <div style={S.resultCard}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>{grade.emoji}</div>
          <h2 style={{ ...S.gradeText, color: grade.color }}>{grade.text}</h2>

          <div style={S.statGrid}>
            <div style={S.statBox}>
              <span style={S.statNum}>{score}</span>
              <span style={S.statLabel}>총 점수</span>
            </div>
            <div style={S.statBox}>
              <span style={S.statNum}>{correctCount}/{questions.length}</span>
              <span style={S.statLabel}>정답 ({pct}%)</span>
            </div>
            <div style={S.statBox}>
              <span style={S.statNum}>{bestStreak}</span>
              <span style={S.statLabel}>최고 연속</span>
            </div>
            <div style={S.statBox}>
              <span style={S.statNum}>{totalTime}s</span>
              <span style={S.statLabel}>총 시간</span>
            </div>
          </div>

          {/* AI 도구 활용 격려 메시지 */}
          {(() => {
            const isAiRelated = (gameMode === "math" && ["ai_math", "binary", "logic", "cs_math"].includes(mathCategory))
              || (gameMode === "korean" && ["ai_tool", "it_term", "it_spell", "prompt", "prefix", "study"].includes(koreanCategory))
              || (gameMode === "vocab" && ["tech", "toeic"].includes(category));
            if (!isAiRelated) return null;
            const msgs = pct >= 80
              ? ["🤖 AI 시대를 이끌 실력이 갖춰지고 있어요!", "🚀 AI 도구를 자유자재로 활용할 준비 완료!"]
              : pct >= 50
              ? ["📈 꾸준히 하면 AI 전문가가 될 수 있어요!", "💡 AI 용어에 점점 익숙해지고 있어요!"]
              : ["💪 AI 시대 필수 지식, 반복하면 금방 익숙해져요!", "🔄 틀린 문제를 복습하면 실력이 쑥쑥!"];
            return (
              <div style={{
                margin: "12px 0", padding: "10px 14px", borderRadius: 10,
                background: "linear-gradient(135deg, rgba(110,231,183,0.08), rgba(96,165,250,0.08))",
                border: "1px solid rgba(110,231,183,0.15)",
                fontSize: 12, color: "#6ee7b7", textAlign: "center", lineHeight: 1.6,
              }}>
                {msgs[Math.floor(Math.random() * msgs.length)]}
              </div>
            );
          })()}

          {/* Wrong answers review */}
          <div style={S.resultList}>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#aaa", marginBottom: 10 }}>
              오답 복습 {wrongWords.length > 0 && `(${wrongWords.length}개)`}
            </p>
            {wrongWords.length === 0 ? (
              <p style={{ color: "#4ade80", fontSize: 14 }}>모두 정답! 완벽합니다 🎉</p>
            ) : wrongWords[0]?.question?.isMath || wrongWords[0]?.question?.isKorean || questions[0]?.isMath || questions[0]?.isKorean ? (
              wrongWords.map((r, i) => {
                const rq = r.question;
                const qText = rq?.mathQuestion || rq?.korQuestion || r.word?.ko;
                const aText = rq?.isMath ? rq.mathAnswer : (rq?.korAnswer || r.word?.en);
                const hText = rq?.mathHint || rq?.korHint || "";
                return (
                  <div key={i} style={S.reviewItem}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 16 }}>❌</span>
                      <span style={{ color: "#fff", fontWeight: 600, ...(rq?.isMath ? { fontFamily: "'JetBrains Mono', monospace" } : {}) }}>
                        {qText}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#4ade80", marginTop: 4, marginLeft: 28 }}>
                      정답: {aText}
                    </div>
                    {hText && (
                      <div style={{ fontSize: 12, color: "#fbbf24", marginTop: 2, marginLeft: 28 }}>
                        💡 {hText}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              wrongWords.map((r, i) => (
                <div key={i} style={S.reviewItem}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => { unlockAudio(); speakWord(r.word.en); }}
                      style={S.miniSpeaker}
                    >
                      🔊
                    </button>
                    <span style={{ color: "#fff", fontWeight: 600 }}>{r.word.en}</span>
                    {r.word.pos && <span style={{ color: "#60a5fa", fontSize: 11 }}>({r.word.pos})</span>}
                    <span style={{ color: "#888" }}>—</span>
                    <span style={{ color: "#cbd5e1" }}>{r.word.ko}</span>
                  </div>
                  {r.word.def && <div style={{ fontSize: 12, color: "#a78bfa", marginTop: 4, marginLeft: 36, fontStyle: "italic" }}>
                    {r.word.def}
                  </div>}
                  {r.word.ex && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2, marginLeft: 36 }}>
                    {r.word.ex}
                  </div>}
                </div>
              ))
            )}
          </div>

          {/* 전체 단어 복습 카드 */}
          {!reviewMode ? (
            <button
              onClick={() => { setReviewMode(true); setReviewIdx(0); setReviewFlipped(false); }}
              style={{
                width: "100%", marginTop: 16, padding: "14px 0", borderRadius: 14,
                background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(96,165,250,0.1))",
                border: "1px solid rgba(168,85,247,0.3)", color: "#c4b5fd",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {questions[0]?.isMath ? "🔢" : questions[0]?.isKorean ? "✏️" : "📚"} 전체 복습 ({questions.length}개)
            </button>
          ) : (
            <div style={{
              marginTop: 16, borderRadius: 16,
              background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.2)",
              overflow: "hidden",
            }}>
              {/* 카드 헤더 */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 16px", borderBottom: "1px solid rgba(168,85,247,0.15)",
              }}>
                <span style={{ fontSize: 13, color: "#a78bfa", fontWeight: 600 }}>
                  📚 복습 {reviewIdx + 1} / {questions.length}
                </span>
                <button
                  onClick={() => setReviewMode(false)}
                  style={{
                    background: "none", border: "none", color: "#64748b",
                    fontSize: 13, cursor: "pointer", padding: "4px 8px",
                  }}
                >✕ 닫기</button>
              </div>

              {/* 카드 본체 */}
              <div
                onClick={() => setReviewFlipped(!reviewFlipped)}
                style={{
                  padding: "24px 20px", textAlign: "center", cursor: "pointer",
                  minHeight: 180, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                {(() => {
                  const rq = questions[reviewIdx];
                  const isMath = rq.isMath;
                  const isKorean = rq.isKorean;
                  if (!reviewFlipped) {
                    // ===== 앞면 (문제) =====
                    return isMath ? (
                      <>
                        <div style={{ fontSize: 24, color: "#e2e8f0", fontWeight: 700, marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>
                          {rq.mathQuestion}
                        </div>
                        {rq.mathHint && (
                          <div style={{
                            fontSize: 12, color: "#fbbf24", marginBottom: 8,
                            padding: "8px 14px", borderRadius: 10,
                            background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)",
                          }}>
                            💡 {rq.mathHint}
                          </div>
                        )}
                        <div style={{
                          marginTop: 10, padding: "10px 24px", borderRadius: 24,
                          background: "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.15))",
                          border: "1px solid rgba(251,191,36,0.3)",
                          color: "#fbbf24", fontSize: 14, fontWeight: 700,
                          animation: "pulse 2s infinite",
                        }}>
                          👆 탭하여 정답 확인
                        </div>
                      </>
                    ) : isKorean ? (
                      <>
                        <div style={{ fontSize: 18, color: "#e2e8f0", fontWeight: 700, marginBottom: 10, lineHeight: 1.6 }}>
                          {rq.korQuestion}
                        </div>
                        <div style={{
                          marginTop: 10, padding: "10px 24px", borderRadius: 24,
                          background: "linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.15))",
                          border: "1px solid rgba(52,211,153,0.3)",
                          color: "#34d399", fontSize: 14, fontWeight: 700,
                          animation: "pulse 2s infinite",
                        }}>
                          👆 탭하여 정답 확인
                        </div>
                      </>
                    ) : (
                      <>
                        {rq.word.pos && (
                          <span style={{ fontSize: 12, color: "#60a5fa", fontWeight: 600, marginBottom: 6 }}>
                            {rq.word.pos}
                          </span>
                        )}
                        <div style={{ fontSize: 22, color: "#e2e8f0", fontWeight: 700, marginBottom: 10 }}>
                          {rq.word.ko}
                        </div>
                        {rq.word.def && (
                          <div style={{
                            fontSize: 13, color: "#a78bfa", fontStyle: "italic", marginBottom: 8,
                            padding: "8px 14px", borderRadius: 10,
                            background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)",
                            lineHeight: 1.5,
                          }}>
                            📘 {rq.word.def}
                          </div>
                        )}
                        {rq.word.ex && (
                          <div style={{
                            fontSize: 12, color: "#94a3b8", marginBottom: 8,
                            padding: "8px 14px", borderRadius: 10,
                            background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.1)",
                            lineHeight: 1.5,
                          }}>
                            📖 {rq.word.ex.replace(
                              new RegExp(rq.word.en, "gi"),
                              (m) => "●".repeat(m.length)
                            )}
                          </div>
                        )}
                        <div style={{
                          marginTop: 10, padding: "10px 24px", borderRadius: 24,
                          background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(96,165,250,0.15))",
                          border: "1px solid rgba(168,85,247,0.3)",
                          color: "#c4b5fd", fontSize: 14, fontWeight: 700,
                          animation: "pulse 2s infinite",
                        }}>
                          👆 탭하여 정답 확인
                        </div>
                      </>
                    );
                  } else {
                    // ===== 뒷면 (정답) =====
                    return isMath ? (
                      <>
                        <div style={{ fontSize: 26, color: "#fff", fontWeight: 800, marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
                          {rq.mathQuestion.replace("= ?", `= ${rq.mathAnswer}`)}
                        </div>
                        {rq.mathHint && (
                          <div style={{ fontSize: 13, color: "#fbbf24", marginBottom: 6 }}>
                            💡 {rq.mathHint}
                          </div>
                        )}
                        <div style={{
                          marginTop: 10, fontSize: 12, fontWeight: 600,
                          color: results[reviewIdx]?.correct ? "#4ade80" : "#f87171",
                        }}>
                          {results[reviewIdx]?.correct ? "✅ 정답" : "❌ 오답"}
                        </div>
                      </>
                    ) : isKorean ? (
                      <>
                        <div style={{ fontSize: 16, color: "#94a3b8", marginBottom: 8, lineHeight: 1.5 }}>
                          {rq.korQuestion}
                        </div>
                        <div style={{ fontSize: 22, color: "#34d399", fontWeight: 800, marginBottom: 8 }}>
                          ✅ {rq.korAnswer}
                        </div>
                        {rq.korHint && (
                          <div style={{
                            fontSize: 13, color: "#fbbf24", marginBottom: 6,
                            padding: "8px 14px", borderRadius: 10,
                            background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)",
                          }}>
                            💡 {rq.korHint}
                          </div>
                        )}
                        <div style={{
                          marginTop: 10, fontSize: 12, fontWeight: 600,
                          color: results[reviewIdx]?.correct ? "#4ade80" : "#f87171",
                        }}>
                          {results[reviewIdx]?.correct ? "✅ 정답" : "❌ 오답"}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); unlockAudio(); speakWord(rq.word.en); }}
                            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}
                          >🔊</button>
                          <span style={{ fontSize: 24, color: "#fff", fontWeight: 800 }}>
                            {rq.word.en}
                          </span>
                          {rq.word.pos && (
                            <span style={{ fontSize: 12, color: "#60a5fa" }}>({rq.word.pos})</span>
                          )}
                        </div>
                        <div style={{ fontSize: 16, color: "#cbd5e1", marginBottom: 8 }}>
                          {rq.word.ko}
                        </div>
                        {rq.word.def && (
                          <div style={{ fontSize: 13, color: "#a78bfa", fontStyle: "italic", marginBottom: 6 }}>
                            {rq.word.def}
                          </div>
                        )}
                        {rq.word.ex && (
                          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                            📖 {rq.word.ex}
                          </div>
                        )}
                        <div style={{
                          marginTop: 10, fontSize: 12, fontWeight: 600,
                          color: results[reviewIdx]?.correct ? "#4ade80" : "#f87171",
                        }}>
                          {results[reviewIdx]?.correct ? "✅ 정답" : "❌ 오답"}
                        </div>
                      </>
                    );
                  }
                })()}
              </div>

              {/* 네비게이션 */}
              <div style={{
                display: "flex", justifyContent: "space-between", padding: "12px 16px",
                borderTop: "1px solid rgba(168,85,247,0.15)",
              }}>
                <button
                  onClick={() => { setReviewIdx(Math.max(0, reviewIdx - 1)); setReviewFlipped(false); }}
                  disabled={reviewIdx === 0}
                  style={{
                    padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.04)", color: reviewIdx === 0 ? "#333" : "#e2e8f0",
                    fontSize: 14, cursor: reviewIdx === 0 ? "default" : "pointer", fontWeight: 600,
                  }}
                >← 이전</button>
                <button
                  onClick={() => { setReviewIdx(Math.min(questions.length - 1, reviewIdx + 1)); setReviewFlipped(false); }}
                  disabled={reviewIdx === questions.length - 1}
                  style={{
                    padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(168,85,247,0.3)",
                    background: "rgba(168,85,247,0.1)", fontSize: 14, fontWeight: 600,
                    color: reviewIdx === questions.length - 1 ? "#333" : "#c4b5fd",
                    cursor: reviewIdx === questions.length - 1 ? "default" : "pointer",
                  }}
                >다음 →</button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button onClick={startGame} style={S.retryBtn}>🔄 다시 도전</button>
            <button onClick={() => { setNewAchievements([]); setReviewMode(false); setScreen("menu"); }} style={S.menuBtn}>메뉴로</button>
          </div>

          {/* 새 업적 달성 알림 */}
          {newAchievements.length > 0 && (
            <div style={{
              margin: "16px 0 0", padding: 16, borderRadius: 16,
              background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.08))",
              border: "1px solid rgba(251,191,36,0.3)",
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24", marginBottom: 10, textAlign: "center" }}>
                🎊 새 업적 달성!
              </p>
              {newAchievements.map(a => (
                <div key={a.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <span style={{ fontSize: 28 }}>{a.icon}</span>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{a.title}</div>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>{a.desc}</div>
                  </div>
                </div>
              ))}
              <a
                href="https://study.datapd.ai"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block", marginTop: 10, padding: "8px 12px", borderRadius: 8,
                  background: "rgba(251,191,36,0.08)", textDecoration: "none", textAlign: "center",
                  fontSize: 12, color: "#fbbf24",
                }}
              >
                🎓 DataPD에서 AI로 더 공부하기 →
              </a>
            </div>
          )}

          {/* 누적 통계 미니 */}
          <div style={{
            display: "flex", justifyContent: "center", gap: 16, marginTop: 12,
            fontSize: 11, color: "#64748b",
          }}>
            <span>누적 {stats.totalCorrect.toLocaleString()}정답</span>
            <span>·</span>
            <span>{stats.totalGames}게임</span>
            <span>·</span>
            <span>{stats.unlockedIds.length}업적</span>
          </div>

          {/* DataPD 추천 — 결과에 따라 다른 문구 */}
          <div style={{
            display: "flex", gap: 8, marginTop: 16,
          }}>
            <a
              href="https://study.datapd.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, padding: "10px 8px", borderRadius: 10, textDecoration: "none",
                background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.12)",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: 16 }}>📖</span>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                {pct >= 80 ? "실력 업그레이드" : "더 공부하기"}
              </div>
            </a>
            <a
              href="https://finance.datapd.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, padding: "10px 8px", borderRadius: 10, textDecoration: "none",
                background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.12)",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: 16 }}>💹</span>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                {pct >= 80 ? "오늘의 금융 트렌드" : "잠깐 쉬어가기"}
              </div>
            </a>
          </div>

          {/* 결과 화면 배너 광고 */}
          <AdBanner slot={AD_CONFIG.slots.resultBanner} />
        </div>

      </div>
    );
  }
}

// ============================================================
// BADGES MODAL (separate from main component for clarity)
// ============================================================
function BadgesModal({ stats, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9998,
      background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div style={{
        background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
        borderRadius: 20, padding: "24px 20px", maxWidth: 440, width: "100%",
        maxHeight: "80vh", overflow: "auto",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700 }}>🏅 업적 & 보상</h2>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#64748b", fontSize: 22, cursor: "pointer",
          }}>✕</button>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
            <span>{stats.unlockedIds.length} / {ACHIEVEMENTS.length} 달성</span>
            <span>{Math.round(stats.unlockedIds.length / ACHIEVEMENTS.length * 100)}%</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
            <div style={{
              height: "100%", borderRadius: 3,
              width: `${(stats.unlockedIds.length / ACHIEVEMENTS.length) * 100}%`,
              background: "linear-gradient(90deg, #4ade80, #facc15)",
              transition: "width 0.5s",
            }} />
          </div>
        </div>

        {/* Next milestone */}
        {(() => {
          const next = ACHIEVEMENTS.find(a => !stats.unlockedIds.includes(a.id));
          if (!next) return <p style={{ color: "#fbbf24", textAlign: "center", fontSize: 14, marginBottom: 16 }}>🎊 모든 업적 달성! 축하합니다!</p>;
          return (
            <div style={{
              padding: 12, borderRadius: 12, marginBottom: 16,
              background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)",
              textAlign: "center",
            }}>
              <p style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>다음 목표</p>
              <p style={{ fontSize: 14, color: "#e2e8f0" }}>{next.icon} {next.title} — {next.desc}</p>
            </div>
          );
        })()}

        {/* All achievements */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ACHIEVEMENTS.map(a => {
            const unlocked = stats.unlockedIds.includes(a.id);
            return (
              <div key={a.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                borderRadius: 12,
                background: unlocked ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${unlocked ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)"}`,
                opacity: unlocked ? 1 : 0.5,
              }}>
                <span style={{ fontSize: 26, filter: unlocked ? "none" : "grayscale(1)" }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: unlocked ? "#fff" : "#64748b", fontWeight: 600, fontSize: 13 }}>{a.title}</div>
                  <div style={{ color: unlocked ? "#94a3b8" : "#475569", fontSize: 11 }}>{a.desc}</div>
                </div>
                {unlocked && <span style={{ color: "#4ade80", fontSize: 16 }}>✓</span>}
              </div>
            );
          })}
        </div>

        <button onClick={onClose} style={{
          width: "100%", marginTop: 20, padding: "12px", borderRadius: 12,
          background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.3)",
          color: "#60a5fa", fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>
          닫기
        </button>
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const S = {
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
    maxWidth: 440,
    padding: "32px 24px",
    borderRadius: 24,
    background: "linear-gradient(180deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
  },
  logoArea: { textAlign: "center", marginBottom: 28 },
  logoIcon: {
    fontSize: 38,
    marginBottom: 10,
    filter: "drop-shadow(0 0 20px rgba(250,204,21,0.4))",
  },
  title: {
    fontSize: 30,
    fontWeight: 900,
    letterSpacing: 6,
    color: "#f8fafc",
    margin: 0,
    textShadow: "0 0 30px rgba(96,165,250,0.3)",
  },
  subtitle: { fontSize: 13, color: "#94a3b8", marginTop: 6, letterSpacing: 1 },
  wordCount: { fontSize: 11, color: "#64748b", marginTop: 6 },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
  },
  catGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
  },
  catBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 4px",
    borderRadius: 12,
    border: "1.5px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)",
    color: "#e2e8f0",
    cursor: "pointer",
    transition: "all 0.2s",
    gap: 2,
  },
  catBtnActive: {
    background: "rgba(96,165,250,0.12)",
    borderColor: "#60a5fa",
    boxShadow: "0 0 16px rgba(96,165,250,0.15)",
  },
  optionRow: { display: "flex", gap: 8 },
  optionBtn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 6px",
    borderRadius: 12,
    border: "1.5px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)",
    color: "#e2e8f0",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  optionBtnActive: {
    background: "rgba(96,165,250,0.12)",
    borderColor: "#60a5fa",
    boxShadow: "0 0 16px rgba(96,165,250,0.15)",
  },
  soundToggle: {
    padding: "8px 16px",
    borderRadius: 10,
    border: "1.5px solid",
    background: "transparent",
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  startBtn: {
    width: "100%",
    padding: "15px 0",
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
  },
  rules: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    background: "rgba(255,255,255,0.03)",
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.9,
  },
  gameCard: {
    width: "100%",
    maxWidth: 460,
    padding: "20px 20px 16px",
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
    fontSize: 32,
    fontWeight: 900,
    color: "#fbbf24",
    textShadow: "0 0 40px rgba(251,191,36,0.6)",
    zIndex: 20,
    pointerEvents: "none",
    letterSpacing: 4,
  },
  gameHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  scoreDisplay: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
  progressText: { fontSize: 13, color: "#64748b", fontWeight: 600 },
  streakDisplay: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  timerBarBg: {
    width: "100%",
    height: 5,
    borderRadius: 3,
    background: "rgba(255,255,255,0.06)",
    marginBottom: 6,
    overflow: "hidden",
  },
  timerBarFill: { height: "100%", borderRadius: 3, boxShadow: "0 0 12px currentColor" },
  timerNumber: {
    textAlign: "center",
    marginBottom: 14,
    display: "flex",
    alignItems: "baseline",
    justifyContent: "center",
  },
  questionArea: { textAlign: "center", marginBottom: 14 },
  questionLabel: { fontSize: 14, color: "#e2e8f0", marginBottom: 8, fontWeight: 600 },
  koreanWord: {
    fontSize: 32,
    fontWeight: 800,
    color: "#f8fafc",
    letterSpacing: 2,
    textShadow: "0 0 30px rgba(248,250,252,0.1)",
  },
  speakerBtn: {
    marginTop: 8,
    padding: "6px 14px",
    borderRadius: 10,
    border: "1px solid rgba(96,165,250,0.3)",
    background: "rgba(96,165,250,0.1)",
    color: "#93c5fd",
    fontSize: 18,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  helpRow: { display: "flex", gap: 8, justifyContent: "center", marginTop: 8 },
  helpBtn: {
    padding: "5px 14px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "#64748b",
    fontSize: 12,
    cursor: "pointer",
  },
  hintBox: {
    marginTop: 8,
    padding: "6px 14px",
    borderRadius: 10,
    background: "rgba(250,204,21,0.08)",
    border: "1px solid rgba(250,204,21,0.2)",
    color: "#fbbf24",
    fontSize: 12,
    display: "inline-block",
  },
  revealBox: {
    padding: "8px 14px",
    borderRadius: 10,
    background: "rgba(74,222,128,0.08)",
    border: "1px solid rgba(74,222,128,0.2)",
    color: "#86efac",
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
  choicesGrid: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 },
  choiceBtn: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: 12,
    border: "1.5px solid",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "left",
  },
  choiceNumber: {
    width: 26,
    height: 26,
    borderRadius: 7,
    background: "rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    flexShrink: 0,
  },
  choiceText: { flex: 1 },
  progressDots: { display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" },
  resultCard: {
    width: "100%",
    maxWidth: 460,
    padding: "32px 24px",
    borderRadius: 24,
    background: "linear-gradient(180deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
    textAlign: "center",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  gradeText: { fontSize: 26, fontWeight: 800, margin: "0 0 20px 0", letterSpacing: 2 },
  statGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 },
  statBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "14px 10px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  statNum: { fontSize: 22, fontWeight: 800, color: "#f8fafc" },
  statLabel: { fontSize: 10, color: "#64748b", marginTop: 3, textTransform: "uppercase", letterSpacing: 1 },
  resultList: {
    textAlign: "left",
    padding: 14,
    borderRadius: 14,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  reviewItem: {
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  miniSpeaker: {
    padding: "3px 8px",
    borderRadius: 6,
    border: "1px solid rgba(96,165,250,0.2)",
    background: "rgba(96,165,250,0.08)",
    fontSize: 14,
    cursor: "pointer",
    lineHeight: 1,
  },
  retryBtn: {
    flex: 1,
    padding: "13px 0",
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
    padding: "13px 0",
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
