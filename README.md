# ⚡ VOCAB RUSH - 직장인 영어 어휘 타이머 챌린지

직장인을 위한 영어 어휘 학습 PWA 게임입니다.

## 🚀 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev

# 3. 프로덕션 빌드
npm run build
```

## 🌐 웹 배포 (Vercel 추천 - 무료)

1. GitHub에 이 프로젝트를 push
2. [vercel.com](https://vercel.com) 가입 → "Import Project" → 저장소 선택
3. 자동 빌드 & 배포 → `https://your-app.vercel.app` URL 발급

> Netlify도 가능: Build command `npm run build`, Publish directory `dist`

## 📱 Google Play Store 등록 (TWA 방식)

### 전제 조건
- 위 웹 배포 완료 (HTTPS URL 필요)
- Android Studio + JDK 11+ 설치
- Google Play Console 개발자 계정 ($25 일회성)

### Step 1: Digital Asset Links 설정
`public/.well-known/assetlinks.json` 파일 생성:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.vocabrush.app",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
  }
}]
```

### Step 2: Bubblewrap으로 AAB 생성
Google Chrome Labs의 **Bubblewrap CLI**를 사용합니다.

```bash
# Bubblewrap 설치
npm install -g @nicholasgodfreyt/nicholasgodfreyt-nicholasgodfreyt/nicholasgodfreyt/bubblewrap-cli

# 프로젝트 초기화
bubblewrap init --manifest https://your-app.vercel.app/manifest.webmanifest

# 빌드
bubblewrap build
```

> 정확한 패키지명은 "bubblewrap cli" 로 npm 검색하거나
> GitHub에서 "nicholasgodfreyt nicholasgodfreyt nicholasgodfreyt nicholasgodfreyt bubblewrap" 을 검색하세요.

### Step 3: Google Play Console 등록
1. [play.google.com/console](https://play.google.com/console) 접속
2. "앱 만들기" → 앱 정보 입력
   - 앱 이름: **VOCAB RUSH**
   - 기본 언어: 한국어
   - 앱 유형: 게임 → 교육
3. 스토어 등록정보 작성 (스크린샷, 설명, 아이콘 등)
4. 생성된 AAB 파일 업로드
5. 콘텐츠 등급 설문 완료
6. 가격 및 배포 → 무료 → 국가 선택
7. 검토 제출 (심사 3~7일 소요)

## 🔧 프로젝트 구조

```
vocab-rush/
├── public/
│   ├── favicon.svg
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   └── VocabChallenge.jsx
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## 💡 PWA 기능
- 오프라인 지원 (Service Worker 자동 생성)
- 홈 화면 추가 가능
- 풀스크린 앱 모드
- 정적 자산 캐싱으로 빠른 로딩

## 📄 라이선스
MIT License
