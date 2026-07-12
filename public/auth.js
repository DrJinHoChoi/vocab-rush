/*
 * DataPD 인증 레이어 — Supabase(실제 구글·카카오) + 데모 폴백.
 * ─────────────────────────────────────────────────────────────
 * auth-config.js 에 supabaseUrl/anonKey 를 넣으면 → 실제 로그인(Supabase Auth).
 * 비어 있으면 → 데모 모드(localStorage, 프로토타입 전용).
 *
 * 공개 API (모두 Promise 반환):
 *   DataPDAuth.mode                     'supabase' | 'demo'
 *   DataPDAuth.getSession()             → {name,email,provider,picture,at} | null
 *   DataPDAuth.signUpEmail({name,email,password})
 *   DataPDAuth.signInEmail({email,password})
 *   DataPDAuth.signInProvider('google'|'kakao')   // supabase: 리다이렉트 / demo: 즉시
 *   DataPDAuth.signOut()
 *   DataPDAuth.providerLabel(p)
 */
(function () {
  var cfg = window.DATAPD_AUTH_CONFIG || {};
  var HAS_SUPA = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  var SESSION_KEY = 'datapd.session.v1';
  var USERS_KEY = 'datapd.users.v1';
  var PROVIDERS = { google: 'Google', kakao: '카카오', email: '이메일' };

  /* ---------- 공통 ---------- */
  function readJSON(key, fb) { try { return JSON.parse(localStorage.getItem(key)) || fb; } catch (e) { return fb; } }
  function label(p) { return PROVIDERS[p] || '이메일'; }

  /* ---------- 데모(localStorage) ---------- */
  function users() { return readJSON(USERS_KEY, []); }
  function saveUsers(l) { localStorage.setItem(USERS_KEY, JSON.stringify(l)); }
  function setDemoSession(u) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      name: u.name, email: u.email, provider: u.provider, picture: '',
      role: u.role || 'member', company: u.company || '', at: u.at || Date.now(),
    }));
  }
  function demoSignUp(p) {
    var email = (p.email || '').trim().toLowerCase(), pw = p.password || '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('올바른 이메일을 입력해 주세요.');
    if (pw.length < 6) throw new Error('비밀번호는 6자 이상이어야 합니다.');
    var l = users();
    if (l.some(function (u) { return u.email === email; })) throw new Error('이미 가입된 이메일입니다.');
    var u = { name: (p.name || '').trim() || email.split('@')[0], email: email, password: pw,
      provider: 'email', role: p.role || 'member', company: (p.company || '').trim(), at: Date.now() };
    l.push(u); saveUsers(l); setDemoSession(u); return u;
  }
  function demoSignIn(p) {
    var email = (p.email || '').trim().toLowerCase(), pw = p.password || '';
    var u = users().find(function (x) { return x.email === email; });
    if (!u || u.password !== pw) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
    setDemoSession(u); return u;
  }
  function demoSocial(provider, role) {
    var tenant = role === 'tenant';
    var email = 'demo_' + provider + (tenant ? '_tenant' : '') + '@datapd.ai', l = users();
    var u = l.find(function (x) { return x.email === email; });
    if (!u) {
      u = { name: label(provider) + ' ' + (tenant ? '입점사' : '사용자'), email: email,
        provider: provider, role: tenant ? 'tenant' : 'member', company: tenant ? 'crabox.ai' : '', at: Date.now() };
      l.push(u); saveUsers(l);
    }
    setDemoSession(u); return u;
  }

  /* ---------- Supabase(실제) ---------- */
  var supa = null, supaReady = null;
  function loadSupa() {
    if (supaReady) return supaReady;
    supaReady = new Promise(function (resolve, reject) {
      if (window.supabase && window.supabase.createClient) return resolve();
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Supabase SDK를 불러오지 못했습니다.')); };
      document.head.appendChild(s);
    }).then(function () {
      supa = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' },
      });
    });
    return supaReady;
  }
  function fromSupa(sess) {
    if (!sess || !sess.user) return null;
    var u = sess.user, m = u.user_metadata || {}, a = u.app_metadata || {};
    return {
      name: m.name || m.full_name || m.nickname || (u.email || '').split('@')[0],
      email: u.email || m.email || '',
      provider: a.provider || 'email',
      picture: m.avatar_url || m.picture || '',
      role: m.role || 'member',
      company: m.company || '',
      at: Date.parse(u.created_at) || Date.now(),
    };
  }

  /* ---------- 공개 API ---------- */
  window.DataPDAuth = {
    mode: HAS_SUPA ? 'supabase' : 'demo',
    providerLabel: label,

    getSession: function () {
      if (HAS_SUPA) return loadSupa().then(function () {
        return supa.auth.getSession().then(function (r) {
          var sess = fromSupa(r.data.session);
          if (!sess) return null;
          // OAuth는 provider가 역할을 모르므로, 로그인 직전 저장한 pending 역할을
          // 로그인 후 user_metadata에 1회 반영(입점사/회원 구분 유지).
          var pending = readJSON('datapd.pending', null);
          if (pending && pending.role && sess.role !== pending.role) {
            return supa.auth.updateUser({ data: { role: pending.role, company: pending.company || sess.company || '' } })
              .then(function () { localStorage.removeItem('datapd.pending'); sess.role = pending.role; if (pending.company) sess.company = pending.company; return sess; })
              .catch(function () { localStorage.removeItem('datapd.pending'); return sess; });
          }
          return sess;
        });
      });
      return Promise.resolve(readJSON(SESSION_KEY, null));
    },

    // 동기·경량 세션 확인(localStorage만; SDK 미로드) — 전역 내비 칩용
    peekSession: function () {
      if (HAS_SUPA) {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (/^sb-.*-auth-token$/.test(k)) {
            try {
              var o = JSON.parse(localStorage.getItem(k)); var sess = (o && o.currentSession) || o;
              if (sess && sess.user) {
                if (sess.expires_at && sess.expires_at * 1000 < Date.now()) return null;
                return fromSupa(sess);
              }
            } catch (e) {}
          }
        }
        return null;
      }
      return readJSON(SESSION_KEY, null);
    },

    signUpEmail: function (p) {
      if (HAS_SUPA) return loadSupa().then(function () {
        return supa.auth.signUp({ email: p.email, password: p.password,
          options: { data: { name: p.name || '', role: p.role || 'member', company: p.company || '' } } });
      }).then(function (r) {
        if (r.error) throw new Error(r.error.message);
        if (!r.data.session) throw new Error('확인 메일을 보냈습니다. 메일의 링크를 눌러 가입을 완료해 주세요.');
        return fromSupa(r.data.session);
      });
      try { return Promise.resolve(demoSignUp(p)); } catch (e) { return Promise.reject(e); }
    },

    signInEmail: function (p) {
      if (HAS_SUPA) return loadSupa().then(function () {
        return supa.auth.signInWithPassword({ email: p.email, password: p.password });
      }).then(function (r) {
        if (r.error) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
        return fromSupa(r.data.session);
      });
      try { return Promise.resolve(demoSignIn(p)); } catch (e) { return Promise.reject(e); }
    },

    // supabase: 브라우저가 provider로 리다이렉트됨 / demo: 즉시 로그인
    // role='tenant'면 입점사 대시보드로, 기본은 회원 대시보드로.
    signInProvider: function (provider, role) {
      var dest = role === 'tenant' ? '/partner.html' : '/dashboard.html';
      if (HAS_SUPA) return loadSupa().then(function () {
        // provider 리다이렉트 전에 의도한 역할을 저장(복귀 후 getSession이 반영).
        if (role) localStorage.setItem('datapd.pending', JSON.stringify({ role: role }));
        return supa.auth.signInWithOAuth({
          provider: provider,
          options: { redirectTo: location.origin + dest },
        });
      }).then(function (r) { if (r.error) throw new Error(r.error.message); return { redirecting: true }; });
      try { demoSocial(provider, role); return Promise.resolve({ redirecting: false }); } catch (e) { return Promise.reject(e); }
    },

    signOut: function () {
      var done = HAS_SUPA ? loadSupa().then(function () { return supa.auth.signOut(); }) : Promise.resolve();
      return done.then(function () { localStorage.removeItem(SESSION_KEY); });
    },

    // 초기화된 Supabase 클라이언트(실모드) 또는 null(데모) — datapd-db.js가 사용
    supabase: function () { return HAS_SUPA ? loadSupa().then(function () { return supa; }) : Promise.resolve(null); },
  };
})();
