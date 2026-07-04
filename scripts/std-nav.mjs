// DOYOU 페이지 상단 내비를 하나로 통일(sticky, 넘겨도 위치·항목 동일).
// 기존 nav/topbar는 CSS로 숨기고 표준 #dpnav를 <body> 직후 주입. match(모드 스위처)는 제외.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// 8개 슬림 내비 — 동네·운영·비즈니스는 허브 카드로(내비 제외). 입점·가맹 = 모집 랜딩(회사 내비와 일치).
const NAV_ITEMS = [
  ['/doyou-hub.html', 'doyou-hub', '허브'],
  ['/doyou-curation.html', 'doyou-curation', '큐레이션'],
  ['/doyou-invite.html', 'doyou-invite', '입점'],
  ['/doyou-partners.html', 'doyou-partners', '입점사'],
  ['/doyou-content.html', 'doyou-content', '콘텐츠'],
  ['/doyou-join.html', 'doyou-join', '가맹'],
  ['/play.html', 'play', '게임'],
];
// 내비에 없는 페이지의 활성 표시 별칭 (신청폼→입점, 모델 상세→가맹 등)
const ALIAS = { 'doyou-apply': 'doyou-invite', 'doyou-franchise': 'doyou-join', 'doyou-locations': 'doyou-curation', 'doyou-ops': 'doyou-hub', 'doyou-business': 'doyou-hub', 'doyou-edu': 'doyou-hub', 'doyou-precon': 'doyou-hub', 'doyou-canvas': 'doyou-hub', 'doyou-ads': 'doyou-invite' };
const STYLE = `<style id="dpnav-css">nav:not(#dpnav){display:none!important}.topbar{display:none!important}#dpnav{position:sticky;top:0;z-index:9000;background:#FFFEFB;border-bottom:2px solid #141413}#dpnav .in{max-width:1000px;margin:0 auto;padding:10px 20px;display:flex;gap:6px 15px;align-items:center;flex-wrap:wrap;font-family:'Pretendard','Apple SD Gothic Neo','Malgun Gothic',-apple-system,sans-serif;font-size:13px}#dpnav .in::-webkit-scrollbar{display:none}#dpnav a{white-space:nowrap;flex:0 0 auto;color:#7C766B;text-decoration:none}#dpnav a:hover{color:#141413}#dpnav a.bd{font-weight:900;color:#141413;font-size:15px;margin-right:4px}#dpnav a.on{color:#141413;font-weight:800;border-bottom:2px solid #F5B60B;padding-bottom:3px}</style>`;

function navFor(page) {
  const key = ALIAS[page] || page;
  const links = NAV_ITEMS.map(([href, p, label]) => `<a href="${href}"${p === key ? ' class="on"' : ''}>${label}</a>`).join('');
  return `${STYLE}<nav id="dpnav"><div class="in"><a class="bd" href="/">DataPD</a>${links}</div></nav>`;
}

// vibe-coding/게임은 DataPD 회사 레벨(#cnav), crabox는 브랜드 내비(#bn) — 대상 아님.
const PAGES = ['doyou-hub', 'doyou-curation', 'doyou-locations', 'doyou-apply', 'doyou-partners', 'doyou-content', 'doyou-franchise', 'doyou-join', 'doyou-invite', 'doyou-ads', 'doyou-ops', 'doyou-business', 'doyou-edu', 'doyou-precon', 'doyou-canvas'];
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
