# 구글·카카오 실제 로그인 켜기 (Supabase Auth)

사이트는 **백엔드가 없는 정적 사이트**(GitHub Pages)라, 구글·카카오를 둘 다 실제로 붙이는
가장 간단한 방법은 **Supabase Auth**입니다. 두 provider가 기본 제공되고 서버 코드가 필요 없습니다.

> 키를 넣기 전까지는 자동으로 **데모 모드**(localStorage)로 동작합니다. 아래를 마치면 실제 로그인으로 전환됩니다.
> ⚠️ 계정 생성·콘솔 설정은 **직접** 하셔야 합니다(제가 대신 못 합니다). 순서대로 5~15분이면 됩니다.

---

## 1. Supabase 프로젝트 만들기
1. https://supabase.com → 로그인 → **New project** (지역: Northeast Asia (Seoul) 권장, 무료 플랜)
2. 프로젝트가 만들어지면 **Project Settings → API** 에서 두 값을 복사:
   - **Project URL** (예: `https://abcd1234.supabase.co`)
   - **anon public** 키
3. 저장소 `public/auth-config.js` 를 열어 붙여넣기:
   ```js
   window.DATAPD_AUTH_CONFIG = {
     supabaseUrl: 'https://abcd1234.supabase.co',
     supabaseAnonKey: 'eyJhbGciOi...(anon public 키)',
   };
   ```

## 2. 리다이렉트 주소 등록
Supabase → **Authentication → URL Configuration**
- **Site URL**: `https://www.datapd.ai`
- **Redirect URLs** 에 추가:
  - `https://www.datapd.ai/dashboard.html`
  - `http://localhost:5188/dashboard.html`  ← 로컬 테스트용(선택)

## 3. 구글 로그인 켜기
1. **Google Cloud Console** (https://console.cloud.google.com) → 프로젝트 생성
2. **APIs & Services → OAuth consent screen** 설정(외부, 앱 이름 DataPD)
3. **Credentials → Create Credentials → OAuth client ID → Web application**
   - **Authorized redirect URIs** 에 Supabase 콜백 추가:
     `https://abcd1234.supabase.co/auth/v1/callback`
   - 만들면 **Client ID / Client secret** 복사
4. Supabase → **Authentication → Providers → Google** → 사용 ON → Client ID·Secret 붙여넣기 → 저장

## 4. 카카오 로그인 켜기
1. **Kakao Developers** (https://developers.kakao.com) → **내 애플리케이션 → 애플리케이션 추가**
2. **앱 설정 → 플랫폼 → Web** 에 사이트 도메인 등록: `https://www.datapd.ai`
3. **제품 설정 → 카카오 로그인** → 활성화 ON
   - **Redirect URI** 에 Supabase 콜백 추가:
     `https://abcd1234.supabase.co/auth/v1/callback`
   - **동의 항목**: 닉네임·이메일 정도 선택(이메일은 검수 필요할 수 있음 — 없으면 닉네임만으로도 로그인됨)
4. **앱 키**에서 **REST API 키** 복사, **보안 → Client Secret** 발급(코드 발급)
5. Supabase → **Authentication → Providers → Kakao** → 사용 ON →
   - **REST API 키** → Client ID 칸
   - **Client Secret** → Client Secret 칸
   → 저장

## 5. (선택) 이메일 가입 즉시 허용
데모처럼 이메일 회원가입을 확인메일 없이 바로 쓰려면:
Supabase → **Authentication → Providers → Email** → **Confirm email** 끄기.

## 5.5 계정 데이터 동기화 켜기 (선택, 권장)
학습·신청 데이터를 계정에 저장해 **기기 간 동기화**하려면:
1. Supabase → **SQL Editor** → 저장소의 [`supabase-schema.sql`](supabase-schema.sql) 내용을 붙여넣고 **Run**
   (profiles·applications·learning_stats 테이블 + 본인만 접근하는 RLS 생성)
2. 끝. 로그인하면 대시보드가 이 브라우저의 로컬 데이터를 계정으로 올리고(중복 자동 무시),
   이후에는 계정에서 읽어옵니다. 스키마를 안 넣으면 대시보드는 로컬 데이터로 폴백합니다.

## 6. 배포 & 테스트
```bash
git add public/auth-config.js
git commit -m "auth: Supabase 키 설정"
git push
```
배포(1~2분) 후 `https://www.datapd.ai/login.html` 에서 **Google / 카카오로 계속하기** →
로그인하면 `/dashboard.html`(내 데이터)로 돌아옵니다.

---

### 동작 요약
| 상태 | 로그인 페이지 | 세션 |
|---|---|---|
| 키 미설정 | 데모(가짜 계정, localStorage) | 이 브라우저에만 |
| 키 설정됨 | 구글·카카오·이메일 **실제** | Supabase가 관리(기기 간 유지) |

코드는 이미 두 모드를 모두 지원합니다(`public/auth.js`). `auth-config.js` 값만 채우면 자동 전환됩니다.
