/*
 * DataPD 인증 설정
 * ─────────────────────────────────────────────────────────────
 * 아래 두 값을 채우면 구글·카카오 실제 로그인이 켜집니다(Supabase Auth).
 * 비워두면 데모 모드(localStorage)로 동작합니다.
 *
 * 값 얻는 법 → SETUP-AUTH.md 참고
 *   supabaseUrl     : Supabase → Project Settings → API → Project URL
 *   supabaseAnonKey : Supabase → Project Settings → API → anon public key
 *                     (anon 키는 공개돼도 안전합니다. RLS로 보호됨)
 */
window.DATAPD_AUTH_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
};
