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

// 광고 노출 스위치 — AdSense 심사 중엔 게임에 광고 마크업을 넣지 않는다.
// 승인 후: (1) 여기를 true 로, (2) play.html <head> 에 AdSense 로더 스크립트 복원,
// (3) 위 slots 를 실제 발급 슬롯 ID로 교체.
const ADS_ENABLED = false;

// ============================================================
// AD BANNER COMPONENT (Google AdSense)
// ============================================================
function AdBanner({ slot, format = "auto", style = {} }) {
  if (!ADS_ENABLED) return null; // 심사 중 게임에 광고 마크업 미노출
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
        background: "#EEF3F8", borderRadius: 12,
        border: "1px solid #141413", ...style,
      }}>
        <p style={{ fontSize: 11, color: "#7C766B", letterSpacing: 2, fontWeight: 600 }}>AD</p>
        <p style={{ fontSize: 13, color: "#7C766B", marginTop: 6 }}>
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

// 초·중·고 학년 그룹 — 영어 CEFR 매핑(초등 A1·A2 / 중등 B1·B2 / 고등 C1·C2)
const ENG_LEVELS = { elem: ["A1", "A2"], mid: ["B1", "B2"], high: ["C1", "C2"] };
const CATEGORIES = [
  { key: "elem", icon: "🟢", label: "개념" },
  { key: "mid", icon: "🟡", label: "기본" },
  { key: "high", icon: "🔴", label: "응용" },
];

const DIFFICULTY = {
  easy: { time: 15, label: "Easy", points: 10, color: "#15803D" },
  medium: { time: 10, label: "Medium", points: 20, color: "#A16207" },
  hard: { time: 6, label: "Hard", points: 35, color: "#DC2626" },
};

const ROUND_OPTIONS = [10, 15, 20, 25];

// ===== 쉬는 시간 알림 =====
const BREAK_TIMES = ["09:50", "10:50", "11:50", "13:50", "14:50", "15:50"]; // 한국 고교 쉬는 시간(예시)
function notifySupported() {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}
function restOpts(tag) {
  return { tag: "rest-" + tag, body: "1분이면 풀어요 — 오늘의 수능 문제 한 개! 🎯", icon: "/icon-192.png", badge: "/icon-192.png", data: { url: "/suneung-quiz.html" } };
}
async function showRestNotification(reg, title, opts) {
  if (reg && reg.showNotification) return reg.showNotification(title, opts);
  if ("Notification" in window) return new Notification(title, opts);
}
async function scheduleBreakNotifications() {
  if (!notifySupported() || Notification.permission !== "granted") return;
  let reg = null;
  try { reg = await navigator.serviceWorker.ready; } catch (e) {}
  const now = Date.now();
  BREAK_TIMES.forEach((t) => {
    const [h, m] = t.split(":").map(Number);
    const when = new Date(); when.setHours(h, m, 0, 0);
    const ms = when.getTime() - now;
    if (ms <= 0) return; // 이미 지난 시간
    if (reg && typeof TimestampTrigger !== "undefined") {
      try { reg.showNotification("🔔 쉬는 시간!", { ...restOpts(t), showTrigger: new TimestampTrigger(when.getTime()) }); return; } catch (e) {}
    }
    if (ms < 12 * 3600 * 1000) setTimeout(() => showRestNotification(reg, "🔔 쉬는 시간!", restOpts(t)), ms);
  });
}
async function enableRestAlarm() {
  if (!notifySupported()) { alert("이 브라우저는 알림을 지원하지 않아요."); return false; }
  let perm = Notification.permission;
  if (perm !== "granted") perm = await Notification.requestPermission();
  if (perm !== "granted") return false;
  try { localStorage.setItem("rest.notify", "1"); } catch (e) {}
  await scheduleBreakNotifications();
  return true;
}
async function fireTestNotification() {
  if (!notifySupported() || Notification.permission !== "granted") {
    const ok = await enableRestAlarm(); if (!ok) return;
  }
  let reg = null; try { reg = await navigator.serviceWorker.ready; } catch (e) {}
  showRestNotification(reg, "🔔 쉬는 시간!", { body: "이렇게 알림이 와요 — 오늘의 문제 한 개! 🎯", icon: "/icon-192.png", data: { url: "/suneung-quiz.html" } });
}

// ===== 공유 (바이럴) =====
async function shareApp() {
  const data = { title: "STUDY RUSH — 수능 1등급 학습 게임", text: "수능 1등급, 게임으로! 쉬는 시간마다 한 문제 — 무료 🎯", url: "https://www.datapd.ai/" };
  try { if (navigator.share) { await navigator.share(data); return; } } catch (e) { return; }
  try { await navigator.clipboard.writeText(data.url); alert("링크를 복사했어요! 친구에게 붙여넣기 하세요 🔗"); }
  catch (e) { try { window.prompt("이 링크를 복사해 공유하세요:", data.url); } catch (e2) {} }
}

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
  // 브라우저/안드로이드 뒤로가기 ↔ 게임 화면 연동
  useEffect(() => {
    const onPop = () => { setScreen("menu"); setReviewMode(false); setNewAchievements([]); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if ((screen === "play" || screen === "result") && !(window.history.state && window.history.state.inGame)) {
      window.history.pushState({ inGame: true }, "");
    }
  }, [screen]);
  const backToMenu = () => {
    if (window.history.state && window.history.state.inGame) window.history.back();
    else { setScreen("menu"); setReviewMode(false); setNewAchievements([]); }
  };
  const [gameMode, setGameMode] = useState("vocab"); // "vocab" | "math"
  const [category, setCategory] = useState("elem");
  const [mathCategory, setMathCategory] = useState("elem");
  const [koreanCategory, setKoreanCategory] = useState("elem");
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
  const [notifyOn, setNotifyOn] = useState(() => { try { return localStorage.getItem("rest.notify") === "1"; } catch (e) { return false; } });
  useEffect(() => { if (notifyOn) scheduleBreakNotifications(); }, [notifyOn]);
  const [dayStreak, setDayStreak] = useState(0);
  useEffect(() => {
    try {
      const kst = (off) => new Date(Date.now() + 9 * 3600 * 1000 - (off || 0)).toISOString().slice(0, 10);
      const today = kst(0), last = localStorage.getItem("gx.lastDay");
      let s = parseInt(localStorage.getItem("gx.streak") || "0", 10) || 0;
      if (last !== today) {
        s = last === kst(86400000) ? s + 1 : 1;
        localStorage.setItem("gx.streak", String(s));
        localStorage.setItem("gx.lastDay", today);
      }
      setDayStreak(s);
    } catch (e) {}
  }, []);
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
      const pool = ENG_LEVELS[category] ? ENG_LEVELS[category].flatMap((k) => VOCAB_DATA[k]) : allWords;
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
    timerPercent > 50 ? "#15803D" : timerPercent > 25 ? "#A16207" : "#ef4444";
  const totalTime = results.reduce((a, r) => a + r.timeUsed, 0);
  const correctCount = results.filter((r) => r.correct).length;

  // ========================= MENU =========================
  if (screen === "menu") {
    return (
      <div style={{ ...S.container, display: "block", padding: 0, paddingLeft: isWide ? 214 : 0, alignItems: "stretch", justifyContent: "flex-start" }}>
        {/* PC 좌측 사이드바 (대시보드) */}
        {isWide && (
          <aside style={{ position: "fixed", left: 0, top: 0, height: "100vh", width: 214, background: "#FFFEFB", borderRight: "2px solid #141413", padding: "20px 14px", display: "flex", flexDirection: "column", zIndex: 60, boxSizing: "border-box", overflowY: "auto" }}>
            <a href="/" title="DataPD 홈으로 돌아가기" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#7C766B", textDecoration: "none", fontSize: 12.5, fontWeight: 700, paddingLeft: 6, marginBottom: 10 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#141413"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#7C766B"; }}>← DataPD 홈</a>
            <div style={{ fontWeight: 900, fontSize: 17, color: "#141413", letterSpacing: -0.3, marginBottom: 20, paddingLeft: 6 }}>⚡ STUDY RUSH</div>
            {[
              { ic: "🏠", lab: "홈", act: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
              { ic: "📘", lab: "내신 대비", act: () => document.getElementById("learn-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" }) },
              { ic: "🎯", lab: "수능 대비", act: () => { window.location.href = "/suneung-quiz.html"; } },
              { ic: "📒", lab: "오답노트", act: () => { window.location.href = "/suneung-quiz.html?note=1"; } },
              { ic: "📅", lab: "플래너", act: () => { window.location.href = "/plan.html"; } },
              { ic: "🙂", lab: "통계", act: () => document.getElementById("me-anchor")?.scrollIntoView({ behavior: "smooth", block: "center" }) },
            ].map((t) => (
              <button key={t.lab} onClick={t.act}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F0EADB"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "10px", marginBottom: 3, borderRadius: 10, border: "none", background: "none", cursor: "pointer", color: "#141413", fontSize: 14, fontWeight: 700, textAlign: "left" }}>
                <span style={{ fontSize: 18 }}>{t.ic}</span>{t.lab}
              </button>
            ))}
            <div style={{ borderTop: "1px solid #E3DCCB", margin: "10px 6px", paddingTop: 8 }}>
              <a href="/learn.html" target="_blank" rel="noopener noreferrer" style={{ display: "block", color: "#7C766B", textDecoration: "none", fontSize: 12.5, padding: "5px 4px" }}>학습 로드맵</a>
              <a href="/guides.html" target="_blank" rel="noopener noreferrer" style={{ display: "block", color: "#7C766B", textDecoration: "none", fontSize: 12.5, padding: "5px 4px" }}>학습 자료</a>
              <a href="/about.html" target="_blank" rel="noopener noreferrer" style={{ display: "block", color: "#7C766B", textDecoration: "none", fontSize: 12.5, padding: "5px 4px" }}>소개</a>
            </div>
            <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "2px solid #141413", display: "flex", gap: 14, paddingLeft: 6, fontSize: 14, fontWeight: 800 }}>
              <span style={{ color: "#C75D3A" }} title="연속 학습일">🔥 {dayStreak}</span>
              <span style={{ color: "#43618A" }} title="누적 XP">💎 {(stats.totalScore || 0).toLocaleString()}</span>
            </div>
          </aside>
        )}
        {/* 상단 네비게이션 (모바일 전용 — PC는 좌측 사이드바) */}
        {!isWide && (
        <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(250,245,235,0.92)", borderBottom: "1px solid #E3DCCB", padding: "11px 18px" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <a href="/" title="DataPD 홈으로 돌아가기" style={{ color: "#141413", textDecoration: "none", fontSize: 13, fontWeight: 800, borderRight: "1px solid #E3DCCB", paddingRight: 12 }}>← DataPD</a>
            <span style={{ fontWeight: 900, letterSpacing: 1, color: "#141413", fontSize: 15, marginRight: 4 }}>⚡ STUDY RUSH</span>
            <a href="/suneung-quiz.html" style={{ color: "#43618A", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>수능 게임</a>
            <a href="/learn.html" target="_blank" rel="noopener noreferrer" style={{ color: "#7C766B", textDecoration: "none", fontSize: 13 }}>학습 로드맵</a>
            <a href="/guides.html" target="_blank" rel="noopener noreferrer" style={{ color: "#7C766B", textDecoration: "none", fontSize: 13 }}>학습 자료</a>
            <a href="/about.html" target="_blank" rel="noopener noreferrer" style={{ color: "#7C766B", textDecoration: "none", fontSize: 13 }}>소개</a>
            {isWide && <a href="/suneung-quiz.html?note=1" style={{ color: "#7C766B", textDecoration: "none", fontSize: 13 }}>오답노트</a>}
            {isWide && <a href="/plan.html" style={{ color: "#7C766B", textDecoration: "none", fontSize: 13 }}>플래너</a>}
            <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 12, fontSize: 13, fontWeight: 800 }}>
              <span style={{ color: "#C75D3A" }} title="연속 학습일">🔥 {dayStreak}</span>
              <span style={{ color: "#43618A" }} title="누적 XP">💎 {(stats.totalScore || 0).toLocaleString()}</span>
            </span>
          </div>
        </nav>
        )}
        {/* 히어로 (풀폭 중앙) */}
        <header style={{ maxWidth: 1080, margin: "0 auto", width: "100%", padding: isWide ? "34px 20px 12px" : "20px 16px 8px" }}>
          <div style={{ ...S.logoArea, marginBottom: 16, textAlign: "center" }}>
            <div style={{ ...S.logoIcon, fontSize: isWide ? 38 : 30, marginBottom: 6 }}>⚡</div>
            <h1 style={{ ...S.title, fontSize: isWide ? 34 : 26, letterSpacing: isWide ? 7 : 4 }}>STUDY RUSH</h1>
            <p style={{ fontSize: 14, color: "#7C766B", marginTop: 8, fontWeight: 600, letterSpacing: 0.3 }}>
고등 내신 · 수능 학습 게임 — 국·영·수·과·사
            </p>
          </div>
          <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", gap: 12, flexWrap: "wrap" }}>
            {/* 내신 트랙 */}
            <button onClick={() => document.getElementById("learn-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" })} style={{
              flex: 1, minWidth: 236, textAlign: "left", cursor: "pointer", font: "inherit",
              background: "#FFFEFB", border: "2px solid #141413", borderRadius: 16, padding: 16,
              boxShadow: "0 8px 20px rgba(20,16,12,0.07)",
            }}>
              <span style={{ display: "inline-block", fontSize: 11, fontWeight: 800, color: "#43618A", background: "#DCE6F1", borderRadius: 999, padding: "3px 10px" }}>📘 내신 대비</span>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#141413", marginTop: 9 }}>과목별 기초로 학교 시험</div>
              <div style={{ fontSize: 12.5, color: "#7C766B", marginTop: 5, lineHeight: 1.6 }}>영어 어휘 · 수학 연산 · 국어 — 개념부터 단계별로</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#C75D3A", marginTop: 12 }}>시작하기 →</div>
            </button>
            {/* 수능 트랙 */}
            <a href="/suneung-quiz.html" style={{
              flex: 1, minWidth: 236, textDecoration: "none", display: "block",
              background: "#F5B60B", border: "2px solid #141413", borderRadius: 16, padding: 16,
              boxShadow: "0 8px 20px rgba(20,16,12,0.14)",
            }}>
              <span style={{ display: "inline-block", fontSize: 11, fontWeight: 800, color: "#141413", background: "#FFFEFB", border: "1px solid #141413", borderRadius: 999, padding: "3px 10px" }}>🎯 수능 대비</span>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#141413", marginTop: 9 }}>수능형 5지선다 + 오늘의 문제</div>
              <div style={{ fontSize: 12.5, color: "#3F3A33", marginTop: 5, lineHeight: 1.6 }}>타이머 실전 · 사고과정 해설 · 3,000+ 문제 은행</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#141413", marginTop: 12 }}>시작하기 →</div>
            </a>
          </div>
        </header>

        {/* 쉬는 시간 알림 */}
        <div style={{ maxWidth: 1080, margin: "0 auto 4px", width: "100%", padding: isWide ? "0 20px" : "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", padding: "10px 14px", borderRadius: 12, background: "#EAF5EF", border: "1px solid #141413" }}>
            <div style={{ fontSize: 12.5, color: "#0E6E55", fontWeight: 700 }}>🔔 쉬는 시간 알림 <span style={{ color: "#7C766B", fontWeight: 400 }}>— 쉬는 시간마다 오늘의 문제 한 개</span></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={async () => { if (notifyOn) { try { localStorage.removeItem("rest.notify"); } catch (e) {} setNotifyOn(false); } else { const ok = await enableRestAlarm(); setNotifyOn(ok); } }}
                style={{ padding: "6px 13px", borderRadius: 999, border: "1px solid #141413", background: notifyOn ? "#D6EFE3" : "transparent", color: "#0E6E55", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                {notifyOn ? "✓ 켜짐 (끄기)" : "알림 켜기"}
              </button>
              <button onClick={fireTestNotification}
                style={{ padding: "6px 13px", borderRadius: 999, border: "1px solid #141413", background: "transparent", color: "#7C766B", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                테스트
              </button>
            </div>
          </div>
        </div>

        {/* 공유 (바이럴) */}
        <div style={{ maxWidth: 1080, margin: "0 auto 4px", width: "100%", padding: isWide ? "0 20px" : "0 16px" }}>
          <button onClick={shareApp} style={{ width: "100%", padding: "10px", borderRadius: 12, border: "1px solid #141413", background: "#EEF3F8", color: "#43618A", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🔗 친구에게 공유 — 같이 수능 1등급 가자</button>
        </div>

        {/* 메인: 게임 + 교육 */}
        <div style={{
          ...S.menuCard,
          maxWidth: isWide ? 1080 : 480,
          margin: "0 auto",
          background: "transparent",
          border: "none",
          boxShadow: "none",
          borderRadius: 0,
          padding: isWide ? "8px 20px 16px" : "8px 16px 16px",
          ...(isWide ? {
            display: "flex",
            flexWrap: "wrap",
            gap: 28,
            alignItems: "flex-start",
          } : {}),
        }}>
          {/* 게임 컬럼 (PC 왼쪽) */}
          <div style={isWide ? { flex: 1, minWidth: 0 } : {}}>

          {/* 과목별 기초 게임 */}
          <p id="learn-anchor" style={{ fontSize: 12, color: "#7C766B", fontWeight: 700, margin: "0 0 8px", letterSpacing: 0.3 }}>
📘 내신 대비 — 과목별 기초 (어휘 · 연산 · 국어)
          </p>

          {/* 게임 모드 탭 */}
          <div style={{
            display: "flex", gap: 0, marginBottom: 12, borderRadius: 12, overflow: "hidden",
            border: "1px solid #141413", background: "#F0EADB",
          }}>
            <button
              onClick={() => setGameMode("vocab")}
              style={{
                flex: 1, padding: "12px 0", border: "none", cursor: "pointer",
                background: gameMode === "vocab"
                  ? "linear-gradient(135deg, #DCE6F1, rgba(59,130,246,0.1))"
                  : "transparent",
                color: gameMode === "vocab" ? "#43618A" : "#6E6657",
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
                color: gameMode === "math" ? "#8A6608" : "#6E6657",
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
                color: gameMode === "korean" ? "#15803D" : "#6E6657",
                fontSize: 14, fontWeight: 700,
                borderBottom: gameMode === "korean" ? "2px solid #15803D" : "2px solid transparent",
                transition: "all 0.2s",
              }}
            >
              ✏️ 국어
            </button>
            {/* 과학·사회 — 카테고리 자리 먼저, 콘텐츠는 추후 (준비되면 gameMode 연결) */}
            {[{ ic: "🧪", lab: "과학" }, { ic: "🌍", lab: "사회" }].map((s) => (
              <button key={s.lab} disabled title={s.lab + " 콘텐츠 준비 중 — 곧 열려요!"}
                style={{
                  flex: 1, padding: "12px 0", border: "none", cursor: "not-allowed",
                  background: "transparent", color: "#B7AE9C", fontSize: 14, fontWeight: 700,
                  borderBottom: "2px solid transparent",
                }}>
                {s.ic} {s.lab}
                <span style={{ display: "block", fontSize: 9, fontWeight: 800, color: "#C2A98F", letterSpacing: 1, lineHeight: 1.2 }}>준비중</span>
              </button>
            ))}
          </div>

          {/* 누적 통계 (과목별) */}
          {(() => {
            const ms = stats[gameMode] || DEFAULT_MODE_STATS;
            return (
              <div id="me-anchor" style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8,
                margin: "12px 0 8px", padding: "14px 8px", borderRadius: 14,
                background: "#FFFEFB", border: "1px solid #E7E0D0",
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#15803D" }}>{ms.totalCorrect.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: "#6E6657" }}>누적 정답</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#A16207" }}>{ms.totalGames}</div>
                  <div style={{ fontSize: 10, color: "#6E6657" }}>총 게임</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#DC2626" }}>{ms.bestStreakEver || 0}</div>
                  <div style={{ fontSize: 10, color: "#6E6657" }}>최고 연속</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#43618A" }}>{stats.unlockedIds.length}/{ACHIEVEMENTS.length}</div>
                  <div style={{ fontSize: 10, color: "#6E6657" }}>업적</div>
                </div>
              </div>
            );
          })()}

          {/* 배지 보기 버튼 */}
          <button
            onClick={() => setShowBadges(true)}
            style={{
              width: "100%", padding: "10px", borderRadius: 12, border: "1px solid #E3DCCB",
              background: "#FFFEFB", color: "#7C766B", fontSize: 13,
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
                MATH_CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setMathCategory(c.key)}
                    style={{
                      ...S.catBtn,
                      ...(mathCategory === c.key ? { ...S.catBtnActive, borderColor: "#8A6608", background: "rgba(251,191,36,0.12)" } : {}),
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{c.icon}</span>
                    <span style={{ fontSize: 12, marginTop: 3 }}>{c.label}</span>
                    <span style={{ fontSize: 10, color: "#6E6657" }}>∞</span>
                  </button>
                ))
              ) : gameMode === "korean" ? (
                KOREAN_CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setKoreanCategory(c.key)}
                    style={{
                      ...S.catBtn,
                      ...(koreanCategory === c.key ? { ...S.catBtnActive, borderColor: "#15803D", background: "rgba(74,222,128,0.12)" } : {}),
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{c.icon}</span>
                    <span style={{ fontSize: 12, marginTop: 3 }}>{c.label}</span>
                  </button>
                ))
              ) : (
                CATEGORIES.map((c) => (
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
                    <span style={{ fontSize: 10, color: "#6E6657" }}>
                      {(ENG_LEVELS[c.key] ? ENG_LEVELS[c.key].reduce((n, k) => n + VOCAB_DATA[k].length, 0) : allWords.length)}개
                    </span>
                  </button>
                ))
              )}
            </div>
            {/* 카테고리 안내 */}
            {(() => {
              const tips = {
                prefix: "💡 접두사·접미사를 알면 모르는 영단어도 뜻을 추론 가능!",
              };
              const key = gameMode === "math" ? mathCategory : gameMode === "korean" ? koreanCategory : category;
              if (!tips[key]) return null;
              return (
                <div style={{
                  marginTop: 8, padding: "8px 12px", borderRadius: 8,
                  background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.15)",
                  fontSize: 11, color: "#0E6E55", lineHeight: 1.5, textAlign: "center",
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
                      difficulty === key ? val.color : "#141413",
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 700, color: difficulty === key ? val.color : "#6E6657" }}>
                    {val.time}s
                  </span>
                  <span style={{ fontSize: 11, color: difficulty === key ? val.color : "#6E6657" }}>
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
                  <span style={{ fontSize: 16, fontWeight: 700, color: roundSize === n ? "#43618A" : "#6E6657" }}>
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
                background: soundOn ? "#DCE6F1" : "#F0EADB",
                borderColor: soundOn ? "#43618A" : "#141413",
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
            <p style={{ fontWeight: 600, marginBottom: 6, color: "#3F3A33" }}>게임 규칙</p>
            <p>🔊 영어 발음을 듣고 한국어 뜻을 보고 정답을 고르세요</p>
            <p>⚡ 빠를수록 보너스 점수!</p>
            <p>🔥 3연속 정답 시 콤보 보너스!</p>
            <p>💡 힌트 & 예문 사용 가능</p>
          </div>

          {/* 메뉴 하단 배너 광고 */}
          <AdBanner slot={AD_CONFIG.slots.menuBanner} />

          {/* 학습 가이드 */}
          <div style={{
            marginTop: 16, padding: "16px 14px", borderRadius: 12,
            background: "rgba(96,165,250,0.04)", border: "1px solid #E0E9F3",
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#141413", marginBottom: 4 }}>
              📚 학습 가이드
            </div>
            <p style={{ fontSize: 12.5, color: "#7C766B", marginBottom: 10, lineHeight: 1.6 }}>
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
                  style={{ fontSize: 14, color: "#43618A", textDecoration: "none", lineHeight: "28px" }}
                >{g.label}</a>
              ))}
            </div>
            <a href="/learn.html" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 10, marginRight: 14, fontSize: 13, fontWeight: 800, color: "#43618A", textDecoration: "none" }}>🗺️ 수능 학습 로드맵 →</a>
            <a href="/guides.html" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 10, fontSize: 13, fontWeight: 700, color: "#43618A", textDecoration: "none" }}>📖 전체 학습 가이드 보기 →</a>
            <div style={{ marginTop: 8, fontSize: 12.5, color: "#7C766B" }}>
              게임 소개:{" "}
              <a href="/play-vocab.html" target="_blank" rel="noopener noreferrer" style={{ color: "#43618A", textDecoration: "none" }}>영어 게임</a>{" · "}
              <a href="/play-math.html" target="_blank" rel="noopener noreferrer" style={{ color: "#43618A", textDecoration: "none" }}>수학 게임</a>{" · "}
              <a href="/play-korean.html" target="_blank" rel="noopener noreferrer" style={{ color: "#43618A", textDecoration: "none" }}>국어 게임</a>
            </div>
            <div style={{ marginTop: 6, fontSize: 12.5, color: "#7C766B" }}>
              🎓 수능 대비:{" "}
              <a href="/suneung-korean.html" target="_blank" rel="noopener noreferrer" style={{ color: "#43618A", textDecoration: "none" }}>수능 국어</a>{" · "}
              <a href="/suneung-english.html" target="_blank" rel="noopener noreferrer" style={{ color: "#43618A", textDecoration: "none" }}>수능 영어</a>{" · "}
              <a href="/suneung-math.html" target="_blank" rel="noopener noreferrer" style={{ color: "#43618A", textDecoration: "none" }}>수능 수학</a>{" · "}
              <a href="/suneung-quiz.html" target="_blank" rel="noopener noreferrer" style={{ color: "#43618A", textDecoration: "none", fontWeight: 700 }}>🎮 수능 게임</a>
            </div>
          </div>

          {/* 소개 + FAQ (SEO 콘텐츠) */}
          <div style={{ marginTop: 16, padding: "16px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid #E3DCCB", fontSize: 12.5, color: "#7C766B", lineHeight: 1.75, textAlign: "left" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#141413", marginBottom: 8 }}>STUDY RUSH — 고등학교 수능 학습 게임</div>
            <p style={{ marginBottom: 10 }}>STUDY RUSH는 국어·영어·수학을 게임으로 공부하며 수능을 준비하는 무료 학습 플랫폼입니다. 영어 단어, 수학 연산, 국어 어휘·맞춤법 같은 기초를 타이머 게임으로 빠르게 다지고, 실제 수능 유형의 문제를 제한 시간 안에 푸는 <a href="/suneung-quiz.html" target="_blank" rel="noopener noreferrer" style={{ color: "#43618A", textDecoration: "none" }}>수능 연습 게임</a>으로 마무리합니다. 회원가입이나 결제 없이 누구나 바로 시작할 수 있습니다.</p>
            <p style={{ marginBottom: 10 }}>수능은 아는 것을 넘어 정해진 시간 안에 정확히 푸는 시험입니다. 기초가 자동화되어야 어려운 문항에 쓸 시간이 생깁니다. STUDY RUSH는 ‘기초 게임 → 레벨업 → 수능 연습’ 단계로 그 실전 감각을 자연스럽게 길러 줍니다. 단계별 순서는 <a href="/learn.html" target="_blank" rel="noopener noreferrer" style={{ color: "#43618A", textDecoration: "none" }}>학습 로드맵</a>에서 확인하세요.</p>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#141413", margin: "14px 0 6px" }}>자주 묻는 질문</div>
            <p style={{ marginBottom: 8 }}><strong style={{ color: "#3F3A33" }}>Q. 무료인가요?</strong><br />네. 모든 게임과 학습 자료를 무료로 이용할 수 있습니다.</p>
            <p style={{ marginBottom: 8 }}><strong style={{ color: "#3F3A33" }}>Q. 어떤 과목을 공부하나요?</strong><br />국어(어휘·맞춤법·독해), 영어(어휘·독해), 수학(연산·수학Ⅰ·Ⅱ·확률과 통계)을 게임으로 공부합니다.</p>
            <p style={{ margin: 0 }}><strong style={{ color: "#3F3A33" }}>Q. 어디서부터 시작하나요?</strong><br />기초가 약하면 위의 과목 게임부터, 유형 연습이 필요하면 수능 연습 게임부터 시작하세요.</p>
          </div>

          <div style={{ display: "block", textAlign: "center", fontSize: 11, color: "#7C766B", marginTop: 8 }}>
            <a href="/about.html" target="_blank" style={{ color: "#7C766B", textDecoration: "none" }}>소개</a>
            {" · "}
            <a href="/contact.html" target="_blank" style={{ color: "#7C766B", textDecoration: "none" }}>문의</a>
            {" · "}
            <a href="/terms.html" target="_blank" style={{ color: "#7C766B", textDecoration: "none" }}>이용약관</a>
            {" · "}
            <a href="/privacy.html" target="_blank" style={{ color: "#7C766B", textDecoration: "none" }}>개인정보처리방침</a>
          </div>
          </div>{/* end bottom section */}
        </div>

        {/* 하단 탭 네비 (모바일 전용 — PC는 상단 내비 사용) */}
        {!isWide && (
        <div style={{ position: "sticky", bottom: 0, zIndex: 50, background: "rgba(250,245,235,0.97)", borderTop: "1px solid #141413", padding: "8px 0 calc(8px + env(safe-area-inset-bottom))" }}>
          <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", justifyContent: "space-around" }}>
            {[
              { ic: "🏠", lab: "홈", act: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
              { ic: "🎴", lab: "학습", act: () => document.getElementById("learn-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" }) },
              { ic: "📒", lab: "오답노트", act: () => { window.location.href = "/suneung-quiz.html?note=1"; } },
              { ic: "📅", lab: "플랜", act: () => { window.location.href = "/plan.html"; } },
              { ic: "🙂", lab: "나", act: () => document.getElementById("me-anchor")?.scrollIntoView({ behavior: "smooth", block: "center" }) },
            ].map((t) => (
              <button key={t.lab} onClick={t.act} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: "#7C766B", fontSize: 10.5, fontWeight: 700 }}>
                <span style={{ fontSize: 19 }}>{t.ic}</span>{t.lab}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* 푸터 (풀폭 웹사이트형) */}
        <footer style={{ borderTop: "1px solid #E3DCCB", padding: "22px 18px", marginTop: 4 }}>
          <div style={{ maxWidth: 1080, margin: "0 auto", textAlign: "center", fontSize: 12, color: "#6E6657", lineHeight: 1.9 }}>
            <div style={{ fontWeight: 800, color: "#7C766B", marginBottom: 4 }}>⚡ STUDY RUSH</div>
            고등학교 국·영·수 수능 학습 게임 · 무료
            <div style={{ marginTop: 6 }}>
              <a href="/learn.html" target="_blank" rel="noopener noreferrer" style={{ color: "#7C766B", textDecoration: "none" }}>학습 로드맵</a>{" · "}
              <a href="/suneung-quiz.html" style={{ color: "#7C766B", textDecoration: "none" }}>수능 게임</a>{" · "}
              <a href="/guides.html" target="_blank" rel="noopener noreferrer" style={{ color: "#7C766B", textDecoration: "none" }}>학습 자료</a>{" · "}
              <a href="/about.html" target="_blank" rel="noopener noreferrer" style={{ color: "#7C766B", textDecoration: "none" }}>소개</a>
            </div>
            <div style={{ marginTop: 6 }}>© 2025 DataPD · datapd.ai</div>
          </div>
        </footer>

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

          <button onClick={backToMenu} style={{ background: "none", border: "none", color: "#6E6657", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: 10 }}>← 나가기</button>
          <div style={S.gameHeader}>
            <div style={S.scoreDisplay}>
              <span style={{ fontSize: 11, color: "#6E6657" }}>SCORE</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#141413" }}>{score}</span>
            </div>
            <div style={S.progressText}>
              {current + 1} / {questions.length}
            </div>
            <div style={S.streakDisplay}>
              <span style={{ fontSize: 11, color: "#6E6657" }}>STREAK</span>
              <span style={{
                fontSize: 20,
                fontWeight: 800,
                color: streak >= 3 ? "#f59e0b" : "#141413",
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
                {q.word.pos && <span style={{ fontSize: 12, color: "#43618A", fontWeight: 600, letterSpacing: 1 }}>{q.word.pos}</span>}
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
                  <div style={{ ...S.hintBox, borderColor: "#141413", background: "#EEF3F8", color: "#43618A" }}>
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
                  <div>✅ <strong>{q.word.en}</strong> {q.word.pos && <span style={{ fontSize: 11, color: "#0E6E55" }}>({q.word.pos})</span>} — {q.word.ko}</div>
                  {q.word.def && <div style={{ fontSize: 12, color: "#0E6E55", marginTop: 4, fontStyle: "italic" }}>{q.word.def}</div>}
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
              let bg = "#FBF8F0";
              let border = "#141413";
              let textColor = "#141413";

              if (revealed) {
                if (isCorrect) {
                  bg = "rgba(74,222,128,0.15)";
                  border = "#15803D";
                  textColor = "#15803D";
                } else if (isSelected && !isCorrect) {
                  bg = "rgba(248,113,113,0.15)";
                  border = "#DC2626";
                  textColor = "#DC2626";
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
                      ? results[i].correct ? "#15803D" : "#DC2626"
                      : i === current ? "#43618A" : "#141413",
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
        ? { emoji: "🏆", text: "완벽해요!", color: "#8A6608" }
        : pct >= 70
        ? { emoji: "🌟", text: "훌륭해요!", color: "#15803D" }
        : pct >= 50
        ? { emoji: "👍", text: "좋아요!", color: "#43618A" }
        : { emoji: "💪", text: "다시 도전!", color: "#DC2626" };

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
                background: "linear-gradient(135deg, rgba(110,231,183,0.08), #EEF3F8)",
                border: "1px solid rgba(110,231,183,0.15)",
                fontSize: 12, color: "#0E6E55", textAlign: "center", lineHeight: 1.6,
              }}>
                {msgs[Math.floor(Math.random() * msgs.length)]}
              </div>
            );
          })()}

          {/* Wrong answers review */}
          <div style={S.resultList}>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#6E6657", marginBottom: 10 }}>
              오답 복습 {wrongWords.length > 0 && `(${wrongWords.length}개)`}
            </p>
            {wrongWords.length === 0 ? (
              <p style={{ color: "#15803D", fontSize: 14 }}>모두 정답! 완벽합니다 🎉</p>
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
                      <span style={{ color: "#141413", fontWeight: 600, ...(rq?.isMath ? { fontFamily: "'JetBrains Mono', monospace" } : {}) }}>
                        {qText}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#15803D", marginTop: 4, marginLeft: 28 }}>
                      정답: {aText}
                    </div>
                    {hText && (
                      <div style={{ fontSize: 12, color: "#8A6608", marginTop: 2, marginLeft: 28 }}>
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
                    <span style={{ color: "#141413", fontWeight: 600 }}>{r.word.en}</span>
                    {r.word.pos && <span style={{ color: "#43618A", fontSize: 11 }}>({r.word.pos})</span>}
                    <span style={{ color: "#6E6657" }}>—</span>
                    <span style={{ color: "#3F3A33" }}>{r.word.ko}</span>
                  </div>
                  {r.word.def && <div style={{ fontSize: 12, color: "#a78bfa", marginTop: 4, marginLeft: 36, fontStyle: "italic" }}>
                    {r.word.def}
                  </div>}
                  {r.word.ex && <div style={{ fontSize: 12, color: "#7C766B", marginTop: 2, marginLeft: 36 }}>
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
                background: "linear-gradient(135deg, rgba(168,85,247,0.15), #E0E9F3)",
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
                    background: "none", border: "none", color: "#6E6657",
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
                        <div style={{ fontSize: 24, color: "#141413", fontWeight: 700, marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>
                          {rq.mathQuestion}
                        </div>
                        {rq.mathHint && (
                          <div style={{
                            fontSize: 12, color: "#8A6608", marginBottom: 8,
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
                          color: "#8A6608", fontSize: 14, fontWeight: 700,
                          animation: "pulse 2s infinite",
                        }}>
                          👆 탭하여 정답 확인
                        </div>
                      </>
                    ) : isKorean ? (
                      <>
                        <div style={{ fontSize: 18, color: "#141413", fontWeight: 700, marginBottom: 10, lineHeight: 1.6 }}>
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
                          <span style={{ fontSize: 12, color: "#43618A", fontWeight: 600, marginBottom: 6 }}>
                            {rq.word.pos}
                          </span>
                        )}
                        <div style={{ fontSize: 22, color: "#141413", fontWeight: 700, marginBottom: 10 }}>
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
                            fontSize: 12, color: "#7C766B", marginBottom: 8,
                            padding: "8px 14px", borderRadius: 10,
                            background: "#EEF3F8", border: "1px solid #E0E9F3",
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
                          background: "linear-gradient(135deg, rgba(168,85,247,0.2), #DCE6F1)",
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
                        <div style={{ fontSize: 26, color: "#141413", fontWeight: 800, marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
                          {rq.mathQuestion.replace("= ?", `= ${rq.mathAnswer}`)}
                        </div>
                        {rq.mathHint && (
                          <div style={{ fontSize: 13, color: "#8A6608", marginBottom: 6 }}>
                            💡 {rq.mathHint}
                          </div>
                        )}
                        <div style={{
                          marginTop: 10, fontSize: 12, fontWeight: 600,
                          color: results[reviewIdx]?.correct ? "#15803D" : "#DC2626",
                        }}>
                          {results[reviewIdx]?.correct ? "✅ 정답" : "❌ 오답"}
                        </div>
                      </>
                    ) : isKorean ? (
                      <>
                        <div style={{ fontSize: 16, color: "#7C766B", marginBottom: 8, lineHeight: 1.5 }}>
                          {rq.korQuestion}
                        </div>
                        <div style={{ fontSize: 22, color: "#15803D", fontWeight: 800, marginBottom: 8 }}>
                          ✅ {rq.korAnswer}
                        </div>
                        {rq.korHint && (
                          <div style={{
                            fontSize: 13, color: "#8A6608", marginBottom: 6,
                            padding: "8px 14px", borderRadius: 10,
                            background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)",
                          }}>
                            💡 {rq.korHint}
                          </div>
                        )}
                        <div style={{
                          marginTop: 10, fontSize: 12, fontWeight: 600,
                          color: results[reviewIdx]?.correct ? "#15803D" : "#DC2626",
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
                          <span style={{ fontSize: 24, color: "#141413", fontWeight: 800 }}>
                            {rq.word.en}
                          </span>
                          {rq.word.pos && (
                            <span style={{ fontSize: 12, color: "#43618A" }}>({rq.word.pos})</span>
                          )}
                        </div>
                        <div style={{ fontSize: 16, color: "#3F3A33", marginBottom: 8 }}>
                          {rq.word.ko}
                        </div>
                        {rq.word.def && (
                          <div style={{ fontSize: 13, color: "#a78bfa", fontStyle: "italic", marginBottom: 6 }}>
                            {rq.word.def}
                          </div>
                        )}
                        {rq.word.ex && (
                          <div style={{ fontSize: 12, color: "#7C766B", marginTop: 4 }}>
                            📖 {rq.word.ex}
                          </div>
                        )}
                        <div style={{
                          marginTop: 10, fontSize: 12, fontWeight: 600,
                          color: results[reviewIdx]?.correct ? "#15803D" : "#DC2626",
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
                    padding: "8px 20px", borderRadius: 10, border: "1px solid #141413",
                    background: "#FBF8F0", color: reviewIdx === 0 ? "#333" : "#141413",
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
            <button onClick={backToMenu} style={S.menuBtn}>메뉴로</button>
          </div>

          {/* 새 업적 달성 알림 */}
          {newAchievements.length > 0 && (
            <div style={{
              margin: "16px 0 0", padding: 16, borderRadius: 16,
              background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.08))",
              border: "1px solid rgba(251,191,36,0.3)",
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#8A6608", marginBottom: 10, textAlign: "center" }}>
                🎊 새 업적 달성!
              </p>
              {newAchievements.map(a => (
                <div key={a.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <span style={{ fontSize: 28 }}>{a.icon}</span>
                  <div>
                    <div style={{ color: "#141413", fontWeight: 600, fontSize: 14 }}>{a.title}</div>
                    <div style={{ color: "#7C766B", fontSize: 12 }}>{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 누적 통계 미니 */}
          <div style={{
            display: "flex", justifyContent: "center", gap: 16, marginTop: 12,
            fontSize: 11, color: "#6E6657",
          }}>
            <span>누적 {stats.totalCorrect.toLocaleString()}정답</span>
            <span>·</span>
            <span>{stats.totalGames}게임</span>
            <span>·</span>
            <span>{stats.unlockedIds.length}업적</span>
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
        border: "1px solid #E3DCCB",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700 }}>🏅 업적 & 보상</h2>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#6E6657", fontSize: 22, cursor: "pointer",
          }}>✕</button>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#7C766B", marginBottom: 6 }}>
            <span>{stats.unlockedIds.length} / {ACHIEVEMENTS.length} 달성</span>
            <span>{Math.round(stats.unlockedIds.length / ACHIEVEMENTS.length * 100)}%</span>
          </div>
          <div style={{ height: 6, background: "#E7E0D0", borderRadius: 3 }}>
            <div style={{
              height: "100%", borderRadius: 3,
              width: `${(stats.unlockedIds.length / ACHIEVEMENTS.length) * 100}%`,
              background: "linear-gradient(90deg, #15803D, #A16207)",
              transition: "width 0.5s",
            }} />
          </div>
        </div>

        {/* Next milestone */}
        {(() => {
          const next = ACHIEVEMENTS.find(a => !stats.unlockedIds.includes(a.id));
          if (!next) return <p style={{ color: "#8A6608", textAlign: "center", fontSize: 14, marginBottom: 16 }}>🎊 모든 업적 달성! 축하합니다!</p>;
          return (
            <div style={{
              padding: 12, borderRadius: 12, marginBottom: 16,
              background: "#EEF3F8", border: "1px solid #DCE6F1",
              textAlign: "center",
            }}>
              <p style={{ fontSize: 11, color: "#6E6657", marginBottom: 4 }}>다음 목표</p>
              <p style={{ fontSize: 14, color: "#141413" }}>{next.icon} {next.title} — {next.desc}</p>
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
                border: `1px solid ${unlocked ? "rgba(74,222,128,0.15)" : "#FBF8F0"}`,
                opacity: unlocked ? 1 : 0.5,
              }}>
                <span style={{ fontSize: 26, filter: unlocked ? "none" : "grayscale(1)" }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: unlocked ? "#141413" : "#6E6657", fontWeight: 600, fontSize: 13 }}>{a.title}</div>
                  <div style={{ color: unlocked ? "#7C766B" : "#475569", fontSize: 11 }}>{a.desc}</div>
                </div>
                {unlocked && <span style={{ color: "#15803D", fontSize: 16 }}>✓</span>}
              </div>
            );
          })}
        </div>

        <button onClick={onClose} style={{
          width: "100%", marginTop: 20, padding: "12px", borderRadius: 12,
          background: "#DCE6F1", border: "1px solid #141413",
          color: "#43618A", fontSize: 14, fontWeight: 600, cursor: "pointer",
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
    background: "#FAF5EB",
    padding: 16,
    fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  menuCard: {
    width: "100%",
    maxWidth: 440,
    padding: "32px 24px",
    borderRadius: 24,
    background: "#FFFEFB",
    border: "1px solid #E3DCCB",
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
    color: "#141413",
    margin: 0,
    textShadow: "0 0 30px #141413",
  },
  subtitle: { fontSize: 13, color: "#7C766B", marginTop: 6, letterSpacing: 1 },
  wordCount: { fontSize: 11, color: "#6E6657", marginTop: 6 },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#6E6657",
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
    border: "1.5px solid #141413",
    background: "#FFFEFB",
    color: "#141413",
    cursor: "pointer",
    transition: "all 0.2s",
    gap: 2,
  },
  catBtnActive: {
    background: "#F5B60B",
    borderColor: "#43618A",
    boxShadow: "0 0 16px #DCE6F1",
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
    border: "1.5px solid #141413",
    background: "#FFFEFB",
    color: "#141413",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  optionBtnActive: {
    background: "#F5B60B",
    borderColor: "#43618A",
    boxShadow: "0 0 16px #DCE6F1",
  },
  soundToggle: {
    padding: "8px 16px",
    borderRadius: 10,
    border: "1.5px solid",
    background: "transparent",
    color: "#141413",
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
    background: "#FFFEFB",
    fontSize: 12,
    color: "#6E6657",
    lineHeight: 1.9,
  },
  gameCard: {
    width: "100%",
    maxWidth: 460,
    padding: "20px 20px 16px",
    borderRadius: 24,
    background: "#FFFEFB",
    border: "1px solid #E3DCCB",
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
    color: "#8A6608",
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
  progressText: { fontSize: 13, color: "#6E6657", fontWeight: 600 },
  streakDisplay: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  timerBarBg: {
    width: "100%",
    height: 5,
    borderRadius: 3,
    background: "#E7E0D0",
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
  questionLabel: { fontSize: 14, color: "#141413", marginBottom: 8, fontWeight: 600 },
  koreanWord: {
    fontSize: 32,
    fontWeight: 800,
    color: "#141413",
    letterSpacing: 2,
    textShadow: "0 0 30px rgba(248,250,252,0.1)",
  },
  speakerBtn: {
    marginTop: 8,
    padding: "6px 14px",
    borderRadius: 10,
    border: "1px solid #141413",
    background: "#E0E9F3",
    color: "#43618A",
    fontSize: 18,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  helpRow: { display: "flex", gap: 8, justifyContent: "center", marginTop: 8 },
  helpBtn: {
    padding: "5px 14px",
    borderRadius: 8,
    border: "1px solid #141413",
    background: "transparent",
    color: "#6E6657",
    fontSize: 12,
    cursor: "pointer",
  },
  hintBox: {
    marginTop: 8,
    padding: "6px 14px",
    borderRadius: 10,
    background: "rgba(250,204,21,0.08)",
    border: "1px solid rgba(250,204,21,0.2)",
    color: "#8A6608",
    fontSize: 12,
    display: "inline-block",
  },
  revealBox: {
    padding: "8px 14px",
    borderRadius: 10,
    background: "rgba(74,222,128,0.08)",
    border: "1px solid rgba(74,222,128,0.2)",
    color: "#0E6E55",
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
    background: "#E7E0D0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    color: "#6E6657",
    flexShrink: 0,
  },
  choiceText: { flex: 1 },
  progressDots: { display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" },
  resultCard: {
    width: "100%",
    maxWidth: 460,
    padding: "32px 24px",
    borderRadius: 24,
    background: "#FFFEFB",
    border: "1px solid #E3DCCB",
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
    background: "#FBF8F0",
    border: "1px solid #E7E0D0",
  },
  statNum: { fontSize: 22, fontWeight: 800, color: "#141413" },
  statLabel: { fontSize: 10, color: "#6E6657", marginTop: 3, textTransform: "uppercase", letterSpacing: 1 },
  resultList: {
    textAlign: "left",
    padding: 14,
    borderRadius: 14,
    background: "#FFFEFB",
    border: "1px solid #E7E0D0",
  },
  reviewItem: {
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  miniSpeaker: {
    padding: "3px 8px",
    borderRadius: 6,
    border: "1px solid #DCE6F1",
    background: "#EEF3F8",
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
    border: "1.5px solid #141413",
    background: "transparent",
    color: "#7C766B",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: 1,
  },
};
