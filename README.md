# 최박사사진관 · Dr. Choi Photo Studio

찍는 순간, 원본이 증명되는 셀프 사진관 — 대구 수성구 범어동 (오픈 준비 중).

셀프 촬영한 모든 사진에 **원본 인증서**(원본 파일의 SHA-256 지문 · 인증서 번호 · 발급 일시)를 발급하고,
선택하면 지문을 공개 블록체인에 기록(**NFT 원본 등록**)합니다. 누구나 `/verify.html`에서
사진 파일을 넣어 원본인지 확인할 수 있습니다 — 파일은 브라우저 안에서만 계산되고 전송되지 않습니다.

사이트: https://www.datapd.ai

## 구조

| 경로 | 내용 |
|---|---|
| `index.html` | 홈 (Vite 진입점 — 서비스워커 등록 포함) |
| `public/guide.html` | 이용 안내 · 요금(오픈 예정가) · 공간 구성안 |
| `public/authenticity.html` | 원본 인증 · NFT 원본 등록 설명 |
| `public/verify.html` | 원본 확인 도구 (Web Crypto SHA-256, 서버 없음) |
| `public/certificate.html?id=` | 원본 인증서 보기 · 인쇄 |
| `public/certificates.json` | 공개 인증 레지스트리 (지문·번호·일시만, 개인정보·이미지 없음) |
| `public/static/` | 디자인 시스템 `site.css`, `site.js`, 공간 구성안 `studio-plan.svg` |
| `public/samples/` | 원본 확인 체험용 샘플 (원본 / 4% 보정본) |
| `scripts/gen-brand.mjs` | 아이콘·파비콘·공유 이미지·샘플·레지스트리 생성 |
| `_archive/doyou/` | 이전 사업(DOYOU 팝업스토어) 문서 보관 — 배포되지 않음 |

## 개발

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
npm run brand    # 아이콘·샘플·레지스트리 재생성 (샘플을 다시 만들면 지문이 바뀝니다)
```

`main` 브랜치에 푸시하면 GitHub Actions가 빌드해 GitHub Pages(www.datapd.ai)로 배포합니다.

## 인증서 추가

`public/certificates.json`의 `certificates` 배열에 항목을 추가합니다. `sha256`은 고객에게 전달한
원본 파일 그대로의 지문(소문자 16진수 64자)이어야 합니다. 사진·이름·연락처는 넣지 않습니다.
