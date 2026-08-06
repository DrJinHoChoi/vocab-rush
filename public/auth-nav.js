/*
 * 전역 로그인 상태 칩 — 모든 페이지 우상단에 로그인/계정 표시.
 * auth-config.js + auth.js 를 먼저 로드해야 합니다.
 * peekSession()으로 SDK 없이 즉시 표시하고, 다른 탭의 로그인/로그아웃도 반영합니다.
 */
(function () {
  var path = location.pathname.replace(/\/+$/, '');
  if (/\/(login|dashboard|partner-login|partner)\.html$/.test(path)) return;   // 로그인·대시보드 페이지엔 표시 안 함
  if (!window.DataPDAuth || !DataPDAuth.peekSession) return;

  function esc(x) { return String(x == null ? '' : x).replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); }

  // 내비 바(.in/.inner)가 있으면 그 안에 in-flow 로 넣어 메뉴와 나란히 정렬(dp-inline),
  // 없는 페이지만 우상단 고정(dp-fixed). 칩 높이 32px.
  var CSS = '#dp-authchip{font-family:"Pretendard","Apple SD Gothic Neo","Malgun Gothic",-apple-system,sans-serif}' +
    '#dp-authchip.dp-fixed{position:fixed;top:7px;right:12px;z-index:10000}' +
    '#dp-authchip.dp-inline{position:relative;margin-left:auto;order:999;flex:0 0 auto;display:inline-flex;align-items:center}' +
    '.dp-chip{display:inline-flex;align-items:center;gap:7px;box-sizing:border-box;height:32px;background:#FFFEFB;border:2px solid #141413;border-radius:999px;padding:0 11px 0 4px;font-weight:800;font-size:12.5px;line-height:1;color:#141413;cursor:pointer;text-decoration:none;box-shadow:0 2px 8px rgba(20,16,12,.14)}' +
    '.dp-chip.dp-login{background:#F5B60B;padding:0 16px}' +
    '#dp-authchip.dp-inline .dp-chip{box-shadow:none}' +
    '.dp-av{width:22px;height:22px;border-radius:50%;background:#141413;color:#F5B60B;display:grid;place-items:center;font-size:12px;font-weight:900;overflow:hidden;flex:0 0 auto}' +
    '.dp-av img{width:100%;height:100%;object-fit:cover}' +
    '.dp-nm{max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.dp-ca{font-size:9px;color:#7C766B}' +
    '.dp-menu{position:absolute;top:calc(100% + 6px);right:0;background:#FFFEFB;border:2px solid #141413;border-radius:12px;padding:5px;min-width:136px;box-shadow:0 10px 26px rgba(20,16,12,.18);display:grid;gap:2px;z-index:10001}' +
    '.dp-menu[hidden]{display:none}' +
    '.dp-menu a,.dp-menu button{display:block;width:100%;text-align:left;font:inherit;font-size:13px;font-weight:700;padding:8px 10px;border:0;border-radius:8px;background:transparent;color:#141413;cursor:pointer;text-decoration:none}' +
    '.dp-menu a:hover,.dp-menu button:hover{background:#FAF5EB}' +
    '#dp-logout{color:#a23a1c}' +
    '@media(max-width:480px){.dp-nm{display:none}}' +
    // dp-fixed 폴백(내비 없는 페이지)에서만 링크 가림 방지 여백이 필요할 수 있으나,
    // 그 페이지들은 상단 내비 자체가 없으므로 별도 여백은 두지 않음.
    '@media print{#dp-authchip{display:none}}';

  function render() {
    var wrap = document.getElementById('dp-authchip');
    if (!wrap) return;
    var s = DataPDAuth.peekSession();
    if (s) {
      var isTenant = s.role === 'tenant';
      var display = (isTenant && s.company) ? s.company : (s.name || (isTenant ? '입점사' : '회원'));
      var dashHref = isTenant ? '/partner.html' : '/dashboard.html';
      var dashLabel = isTenant ? '🏬 입점사 대시보드' : '📊 내 데이터';
      var av = s.picture
        ? '<span class="dp-av"><img src="' + esc(s.picture) + '" alt="" referrerpolicy="no-referrer"></span>'
        : '<span class="dp-av">' + esc((display || 'D').charAt(0).toUpperCase()) + '</span>';
      wrap.innerHTML = '<button class="dp-chip" id="dp-chipbtn" aria-haspopup="true">' + av +
        '<span class="dp-nm">' + esc(display) + '</span><span class="dp-ca">▾</span></button>' +
        '<div class="dp-menu" id="dp-menu" hidden><a href="' + dashHref + '">' + dashLabel + '</a><button id="dp-logout" type="button">로그아웃</button></div>';
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
    var wrap = document.createElement('div'); wrap.id = 'dp-authchip';
    // 페이지 상단 나비게이션이 있으면 그 안에 넣어 메뉴와 나란히 정렬(겹침 방지),
    // 없으면 기존처럼 우상단 고정.
    var host = document.querySelector('#cnav .in, #dpnav .in, nav .in, nav .inner');
    if (host) { wrap.className = 'dp-inline'; host.appendChild(wrap); }
    else { wrap.className = 'dp-fixed'; document.body.appendChild(wrap); }
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
