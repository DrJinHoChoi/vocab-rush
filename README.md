# DataPD · 오리지널 데이터

복제는 무한하고, 원본은 하나입니다.

DataPD는 오리지널 데이터를 기록합니다. 데이터가 처음 만들어지는 순간 지문(SHA-256)을 남겨,
그것이 원본인지 누구나 스스로 확인할 수 있게 합니다. DataPD가 말하는 희소성은 수량이나 가격이 아니라
**증명할 수 있는 유일성** — 원본이 하나라는 사실을 누구나 확인할 수 있게 하는 것입니다.

사이트: https://www.datapd.ai

## 프로젝트

| # | 프로젝트 | 주소 | 상태 |
|---|---|---|---|
| 01 | 최박사사진관 · Dr. Choi Photo Studio — 원본 인증 셀프 사진관 (대구 수성구 범어동) | [datapd.ai/drchoistudio](https://www.datapd.ai/drchoistudio/) | 오픈 준비 중 |

최박사사진관은 문을 열면 고객이 고른 원본 파일마다 **원본 인증서**(원본 파일의 SHA-256 지문 · 인증서 번호 · 발급 일시)를
발급하고, 선택하면 지문을 공개 블록체인에 기록(**NFT 원본 등록** — 증명 기록이며 가상자산·거래 대상이 아님)할 예정입니다.
`/drchoistudio/verify.html`에서 사진 파일을 넣어 원본인지 확인할 수 있습니다 — 파일은 브라우저 안에서만 계산되고 전송되지 않습니다.

## 구조

| 경로 | 내용 |
|---|---|
| `index.html` | DataPD 홈 (Vite 진입점 — 서비스워커 등록 포함) |
| `public/stories/` | DataPD 이야기 — 오리지널 데이터에 관한 글 |
| `public/privacy.html` | DataPD 웹사이트 개인정보처리방침 |
| `public/404.html` | 전체 404 + 옛 사진관 주소(`/verify.html` 등) → `/drchoistudio/` 자동 이동 |
| `public/drchoistudio/` | 최박사사진관: 홈 · 이용 안내 · 원본 인증 · 원본 확인 · 인증서 · 개인정보처리방침 · 이용약관 |
| `public/drchoistudio/certificates.json` | 공개 인증 레지스트리 (지문·번호·일시만, 개인정보·이미지 없음) |
| `public/drchoistudio/samples/` | 원본 확인 체험용 샘플 (원본 / 4% 보정본) |
| `public/static/` | 공통 디자인 시스템 `site.css`, `site.js` |
| `scripts/gen-brand.mjs` | DataPD·사진관 아이콘, 파비콘, 공유 이미지 생성 (`--samples`: 샘플·레지스트리도 재생성) |
| `_archive/doyou/` | 이전 사업(DOYOU 팝업스토어) 문서 보관 — 배포되지 않음 |

## 개발

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
npm run preview  # 빌드 결과 미리보기 (/drchoistudio/ 같은 하위 폴더 index 확인은 preview로)
npm run brand    # 아이콘·파비콘·공유 이미지 재생성
```

`npm run brand -- --samples`는 샘플 사진과 `certificates.json`까지 다시 만듭니다. 샘플 파일의 바이트가 바뀌면
공개된 지문과 달라지므로, 꼭 필요할 때만 사용하세요.

`main` 브랜치에 푸시하면 Vercel이 빌드해 www.datapd.ai로 배포합니다 (`vercel.json`: 폴더 주소는 `/drchoistudio/`처럼 끝에 `/`를 붙여 엽니다).
저장소의 `.github/workflows/deploy.yml`은 GitHub Pages로도 배포하지만, 도메인은 Vercel을 가리킵니다.

## 인증서 추가 (최박사사진관)

`public/drchoistudio/certificates.json`의 `certificates` 배열에 항목을 추가합니다. `sha256`은 고객에게 전달한
원본 파일 그대로의 지문(소문자 16진수 64자)이어야 합니다. 사진·이름·연락처는 넣지 않습니다.
