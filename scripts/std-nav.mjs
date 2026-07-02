// DOYOU 페이지 상단 내비를 하나로 통일(sticky, 넘겨도 위치·항목 동일).
// 기존 nav/topbar는 CSS로 숨기고 표준 #dpnav를 <body> 직후 주입. match(모드 스위처)는 제외.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const NAV_ITEMS = [
  ['/doyou-hub.html', 'doyou-hub', '허브'],
  ['/doyou-curation.html', 'doyou-curation', '큐레이션'],
  ['/doyou-locations.html', 'doyou-locations', '동네'],
  ['/doyou-apply.html', 'doyou-apply', '입점'],
  ['/doyou-franchise.html', 'doyou-franchise', '가맹'],
  ['/doyou-ops.html', 'doyou-ops', '운영'],
  ['/doyou-business.html', 'doyou-business', '비즈니스'],
  ['/play.html', 'play', '게임'],
  ['/vibe-coding.html', 'vibe-coding', '바이브코딩'],
];
const STYLE = `<style id="dpnav-css">nav:not(#dpnav){display:none!important}.topbar{display:none!important}#dpnav{position:sticky;top:0;z-index:9000;background:#FFFEFB;border-bottom:2px solid #141413}#dpnav .in{max-width:1000px;margin:0 auto;padding:10px 20px;display:flex;gap:6px 15px;align-items:center;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;font-family:'Pretendard','Apple SD Gothic Neo','Malgun Gothic',-apple-system,sans-serif;font-size:13px}#dpnav .in::-webkit-scrollbar{display:none}#dpnav a{white-space:nowrap;flex:0 0 auto;color:#7C766B;text-decoration:none}#dpnav a:hover{color:#141413}#dpnav a.bd{font-weight:900;color:#141413;font-size:15px;margin-right:4px}#dpnav a.on{color:#141413;font-weight:800;border-bottom:2px solid #F5B60B;padding-bottom:3px}</style>`;

function navFor(page) {
  const links = NAV_ITEMS.map(([href, p, label]) => `<a href="${href}"${p === page ? ' class="on"' : ''}>${label}</a>`).join('');
  return `${STYLE}<nav id="dpnav"><div class="in"><a class="bd" href="/">DataPD</a>${links}</div></nav>`;
}

const PAGES = ['doyou-hub', 'doyou-curation', 'doyou-locations', 'doyou-apply', 'doyou-franchise', 'doyou-ops', 'doyou-business', 'doyou-edu', 'doyou-precon', 'doyou-canvas', 'vibe-coding'];
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
