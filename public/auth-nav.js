/*
 * 전역 로그인 상태 칩 — 모든 페이지 우상단에 로그인/계정 표시.
 * auth-config.js + auth.js 를 먼저 로드해야 합니다.
 * peekSession()으로 SDK 없이 즉시 표시하고, 다른 탭의 로그인/로그아웃도 반영합니다.
 */
(function () {
  var path = location.pathname.replace(/\/+$/, '');
  if (/\/(login|dashboard)\.html$/.test(path)) return;   // 로그인·대시보드 페이지엔 표시 안 함
  if (!window.DataPDAuth || !DataPDAuth.peekSession) return;

  function esc(x) { return String(x == null ? '' : x).replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); }

  var CSS = '#dp-authchip{position:fixed;top:8px;right:10px;z-index:10000;font-family:"Pretendard","Apple SD Gothic Neo","Malgun Gothic",-apple-system,sans-serif}' +
    '.dp-chip{display:inline-flex;align-items:center;gap:7px;background:#FFFEFB;border:2px solid #141413;border-radius:999px;padding:4px 11px 4px 5px;font-weight:800;font-size:12.5px;color:#141413;cursor:pointer;text-decoration:none;box-shadow:0 2px 8px rgba(20,16,12,.14)}' +
    '.dp-chip.dp-login{background:#F5B60B;padding:7px 15px}' +
    '.dp-av{width:22px;height:22px;border-radius:50%;background:#141413;color:#F5B60B;display:grid;place-items:center;font-size:12px;font-weight:900;overflow:hidden;flex:0 0 auto}' +
    '.dp-av img{width:100%;height:100%;object-fit:cover}' +
    '.dp-nm{max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.dp-ca{font-size:9px;color:#7C766B}' +
    '.dp-menu{position:absolute;top:42px;right:0;background:#FFFEFB;border:2px solid #141413;border-radius:12px;padding:5px;min-width:136px;box-shadow:0 10px 26px rgba(20,16,12,.18);display:grid;gap:2px}' +
    '.dp-menu[hidden]{display:none}' +
    '.dp-menu a,.dp-menu button{display:block;width:100%;text-align:left;font:inherit;font-size:13px;font-weight:700;padding:8px 10px;border:0;border-radius:8px;background:transparent;color:#141413;cursor:pointer;text-decoration:none}' +
    '.dp-menu a:hover,.dp-menu button:hover{background:#FAF5EB}' +
    '#dp-logout{color:#a23a1c}' +
    '@media(max-width:480px){.dp-nm{display:none}}' +
    '@media print{#dp-authchip{display:none}}';

  function render() {
    var wrap = document.getElementById('dp-authchip');
    if (!wrap) return;
    var s = DataPDAuth.peekSession();
    if (s) {
      var av = s.picture
        ? '<span class="dp-av"><img src="' + esc(s.picture) + '" alt="" referrerpolicy="no-referrer"></span>'
        : '<span class="dp-av">' + esc((s.name || 'D').charAt(0).toUpperCase()) + '</span>';
      wrap.innerHTML = '<button class="dp-chip" id="dp-chipbtn" aria-haspopup="true">' + av +
        '<span class="dp-nm">' + esc(s.name || '회원') + '</span><span class="dp-ca">▾</span></button>' +
        '<div class="dp-menu" id="dp-menu" hidden><a href="/dashboard.html">📊 내 데이터</a><button id="dp-logout" type="button">로그아웃</button></div>';
      var btn = document.getElementById('dp-chipbtn'), menu = document.getElementById('dp-menu');
      btn.addEventListener('click', function (e) { e.stopPropagation(); menu.hidden = !menu.hidden; });
      document.getElementById('dp-logout').addEventListener('click', function () {
        DataPDAuth.signOut().then(render);
      });
    } else {
      wrap.innerHTML = '<a class="dp-chip dp-login" href="/login.html">로그인</a>';
    }
  }

  function inject() {
    if (document.getElementById('dp-authchip')) return;
    var style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    var wrap = document.createElement('div'); wrap.id = 'dp-authchip'; document.body.appendChild(wrap);
    render();
    // 다른 탭에서 로그인/로그아웃 시 동기화
    window.addEventListener('storage', function (e) {
      if (!e.key || /datapd\.session|sb-.*-auth-token/.test(e.key)) render();
    });
    // 바깥 클릭 시 메뉴 닫기
    document.addEventListener('click', function () { var m = document.getElementById('dp-menu'); if (m) m.hidden = true; });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
