// DOYOU 페이지 상단 내비를 하나로 통일(sticky, 넘겨도 위치·항목 동일).
// 기존 nav/topbar는 CSS로 숨기고 표준 #dpnav를 <body> 직후 주입. match(모드 스위처)는 제외.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// 모집 여정 중심 내비 — 허브·큐레이션·콘텐츠는 내비 제외(문맥 링크로 도달: 허브=홈 그리드·푸터,
// 큐레이션=입점 안내·신청 폼, 콘텐츠=invite 🎁 카드·crabox). 회사 내비(#cnav)와 의미 일치.
const NAV_ITEMS = [
  ['/#doyou', 'doyou-home', 'DOYOU 팝업'],
  ['/doyou-invite.html', 'doyou-invite', '입점'],
  ['/doyou-partners.html', 'doyou-partners', '입점사'],
  ['/doyou-join.html', 'doyou-join', '가맹'],
];
// 입점사 하위 줄(짝대기 아래) — 입점사 섹션에서만 노출. 입점사가 늘면 여기에 추가.
const TENANTS = [
  ['/crabox.html', '🦀 crabox.ai'],
];
// 내비에 없는 페이지의 활성 표시 별칭 (신청폼·콘텐츠·큐레이션 등 → 입점 여정)
const ALIAS = { 'doyou-apply': 'doyou-invite', 'doyou-content': 'doyou-invite', 'doyou-curation': 'doyou-invite', 'doyou-locations': 'doyou-invite', 'doyou-ads': 'doyou-invite', 'doyou-franchise': 'doyou-join' };
const STYLE = `<style id="dpnav-css">nav:not(#dpnav){display:none!important}.topbar{display:none!important}#dpnav{position:sticky;top:0;z-index:9000;background:#FFFEFB;border-bottom:2px solid #141413}#dpnav .in{max-width:1000px;margin:0 auto;padding:10px 20px;display:flex;gap:6px 15px;align-items:center;flex-wrap:wrap;font-family:'Pretendard','Apple SD Gothic Neo','Malgun Gothic',-apple-system,sans-serif;font-size:13px}#dpnav .in::-webkit-scrollbar{display:none}#dpnav a{white-space:nowrap;flex:0 0 auto;color:#7C766B;text-decoration:none}#dpnav a:hover{color:#141413}#dpnav a.bd{font-weight:900;color:#141413;font-size:15px;margin-right:4px}#dpnav a.on{color:#141413;font-weight:800;border-bottom:2px solid #F5B60B;padding-bottom:3px}#dpnav .sub{border-top:2px solid #141413;background:#FBF8F0}#dpnav .sub .si{max-width:1000px;margin:0 auto;padding:7px 20px;display:flex;gap:6px 16px;align-items:center;flex-wrap:wrap;font-family:'Pretendard','Apple SD Gothic Neo','Malgun Gothic',-apple-system,sans-serif;font-size:12.5px}#dpnav .sub .sl{font-weight:800;color:#8A6608;letter-spacing:1px;font-size:11px}#dpnav .sub a{color:#141413;font-weight:800;text-decoration:none}#dpnav .sub a:hover{color:#C75D3A}#dpnav .sub a.mut{color:#7C766B;font-weight:700}#dpnav .sub a.on{border-bottom:2px solid #F5B60B;padding-bottom:2px}</style>`;

function navFor(page) {
  const key = ALIAS[page] || page;
  const links = NAV_ITEMS.map(([href, p, label]) => `<a href="${href}"${p === key ? ' class="on"' : ''}>${label}</a>`).join('');
  // 입점사 섹션(리스트 페이지)에서는 짝대기 아래 하위 줄에 입점사들을 노출
  const sub = key === 'doyou-partners'
    ? `<div class="sub"><div class="si"><span class="sl">입점사 ▾</span>${TENANTS.map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}<a class="mut" href="/doyou-invite.html">+ 빈 자리 3 · 1기 모집 중 →</a></div></div>`
    : '';
  return `${STYLE}<nav id="dpnav"><div class="in"><a class="bd" href="/">DataPD</a>${links}</div>${sub}</nav>`;
}

// vibe-coding/게임은 DataPD 회사 레벨(#cnav), crabox는 브랜드 내비(#bn) — 대상 아님.
const PAGES = ['doyou-hub', 'doyou-curation', 'doyou-locations', 'doyou-apply', 'doyou-partners', 'doyou-content', 'doyou-franchise', 'doyou-join', 'doyou-invite', 'doyou-ads', 'doyou-ops', 'doyou-business', 'doyou-edu', 'doyou-precon', 'doyou-canvas'];
// crabox 브랜드 페이지(crabox·vibe-coding): 같은 상단 바 + 짝대기 아래 crabox 콘텐츠 하위 줄
function brandNav(activeVibe) {
  const links = NAV_ITEMS.map(([href, p, label]) => `<a href="${href}"${p === 'doyou-partners' ? ' class="on"' : ''}>${label}</a>`).join('');
  const sub = `<div class="sub"><div class="si"><a class="sl" href="/crabox.html">🦀 crabox.ai ▾</a><a href="/play.html">⚡ STUDY RUSH</a><a href="/guides.html">📖 학습 자료 15편</a><a href="/vibe-coding.html"${activeVibe ? ' class="on"' : ''}>💻 바이브 코딩</a></div></div>`;
  return `${STYLE}<nav id="dpnav"><div class="in"><a class="bd" href="/">DataPD</a>${links}</div>${sub}</nav>`;
}
for (const [f, activeVibe] of [['public/crabox.html', false], ['public/vibe-coding.html', true]]) {
  if (!existsSync(f)) continue;
  let h = readFileSync(f, 'utf8');
  const nav = brandNav(activeVibe);
  if (h.includes('id="dpnav-css"')) h = h.replace(/<style id="dpnav-css">[\s\S]*?<\/nav>/, nav);
  else if (h.includes('id="cnav-css"')) h = h.replace(/<style id="cnav-css">[\s\S]*?<\/nav>/, nav);
  else if (h.includes('<nav id="bn">')) h = h.replace(/<nav id="bn">[\s\S]*?<\/nav>/, nav);
  writeFileSync(f, h, 'utf8');
  console.log('브랜드 내비 적용: ' + f);
}

const done = [];
for (const page of PAGES) {
  const f = `public/${page}.html`;
  if (!existsSync(f)) continue;
  let h = readFileSync(f, 'utf8');
  const nav = navFor(page);
  if (h.includes('id="dpnav"')) {
    h = h.replace(/<style id="dpnav-css">[\s\S]*?<\/nav>/, nav);
  } else {
    h = h.replace(/(<body[^>]*>)/i, `$1\n${nav}`);
  }
  writeFileSync(f, h, 'utf8');
  done.push(page);
}
console.log(`표준 내비 적용: ${done.length}개 — ${done.join(', ')}`);
