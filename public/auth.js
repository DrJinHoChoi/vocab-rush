/*
 * DataPD 데모 인증 레이어 (client-side, localStorage).
 * ─────────────────────────────────────────────────────────────
 * ⚠️ 프로토타입 전용입니다. 비밀번호가 이 브라우저의 localStorage에
 *    평문으로 저장되므로 실제 서비스에는 절대 그대로 쓰지 마세요.
 *    실제 인증·소셜 로그인은 백엔드(Supabase / Firebase / Auth0 등)로
 *    교체해야 합니다 — 이 파일의 함수 시그니처만 맞추면 됩니다.
 */
(function () {
  var SESSION_KEY = 'datapd.session.v1';
  var USERS_KEY = 'datapd.users.v1';

  function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (e) { return fallback; }
  }
  function users() { return readJSON(USERS_KEY, []); }
  function saveUsers(list) { localStorage.setItem(USERS_KEY, JSON.stringify(list)); }
  function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      name: user.name, email: user.email, provider: user.provider, at: Date.now(),
    }));
  }

  var PROVIDERS = { google: 'Google', kakao: '카카오', naver: '네이버', apple: 'Apple' };

  window.DataPDAuth = {
    // 현재 로그인 세션(없으면 null)
    session: function () { return readJSON(SESSION_KEY, null); },

    // 이메일 회원가입
    signUp: function (payload) {
      var email = (payload.email || '').trim().toLowerCase();
      var pw = payload.password || '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('올바른 이메일을 입력해 주세요.');
      if (pw.length < 6) throw new Error('비밀번호는 6자 이상이어야 합니다.');
      var list = users();
      if (list.some(function (u) { return u.email === email; })) throw new Error('이미 가입된 이메일입니다.');
      var user = {
        name: (payload.name || '').trim() || email.split('@')[0],
        email: email, password: pw, provider: 'email', createdAt: Date.now(),
      };
      list.push(user); saveUsers(list); setSession(user);
      return user;
    },

    // 이메일 로그인
    logIn: function (payload) {
      var email = (payload.email || '').trim().toLowerCase();
      var pw = payload.password || '';
      var user = users().find(function (u) { return u.email === email; });
      if (!user || user.password !== pw) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
      setSession(user);
      return user;
    },

    // 소셜 로그인 (데모: 실제 OAuth는 provider client ID + 리다이렉트/백엔드 필요)
    social: function (provider) {
      var label = PROVIDERS[provider] || provider;
      var email = 'demo_' + provider + '@datapd.ai';
      var list = users();
      var user = list.find(function (u) { return u.email === email; });
      if (!user) {
        user = { name: label + ' 사용자', email: email, provider: provider, createdAt: Date.now() };
        list.push(user); saveUsers(list);
      }
      setSession(user);
      return user;
    },

    logOut: function () { localStorage.removeItem(SESSION_KEY); },

    providerLabel: function (p) { return PROVIDERS[p] || '이메일'; },
  };
})();
