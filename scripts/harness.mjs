// DataPD site harness — measure every page, then optimize against the numbers.
//
//   npm run harness                         build → static checks → html-validate → Lighthouse (mobile + desktop)
//   npm run harness -- --form mobile        Lighthouse mobile only (faster loop)
//   npm run harness -- --no-lighthouse      static checks + html-validate only (seconds)
//   npm run harness -- --skip-build         reuse the current dist/
//   npm run harness -- --only /,/stories/   limit Lighthouse to these paths
//   npm run harness -- --base https://www.datapd.ai   Lighthouse against the live site (no build/preview)
//
// Writes harness-report/report.json and harness-report/report.md (gitignored).
// Lighthouse and html-validate run through npx so they never become build dependencies.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'harness-report');
const SITE = 'https://www.datapd.ai';
const PORT = 4319;

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name, fallback) => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback; };
const LIGHTHOUSE = !flag('--no-lighthouse');
const FORMS = opt('--form', 'mobile,desktop').split(',');
const BASE = opt('--base', null);
const ONLY = opt('--only', null)?.split(',');
const SKIP_BUILD = flag('--skip-build') || !!BASE;
const CHROME = process.env.CHROME_PATH || ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', '/usr/bin/google-chrome'].find(existsSync);
// npx via its JS entry so no shell is involved (Windows cannot spawn npx.cmd without one).
const NPX_CLI = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js');
const npx = (args, o = {}) => (existsSync(NPX_CLI)
  ? spawnSync(process.execPath, [NPX_CLI, ...args], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20, ...o })
  : spawnSync('npx', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20, ...o }));

const issues = [];   // { page, check, severity: 'error'|'warn'|'info', message }
const add = (page, check, severity, message) => issues.push({ page, check, severity, message });
const log = (...a) => console.log('[harness]', ...a);

// ---------- build ------------------------------------------------------------------
if (!SKIP_BUILD) {
  log('vite build');
  const r = spawnSync(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--logLevel', 'error'], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) { console.error('build failed'); process.exit(1); }
}

// ---------- page inventory -----------------------------------------------------------
function walk(d, acc = []) {
  for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p, acc) : acc.push(p); }
  return acc;
}
const files = walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const toUrlPath = (f) => '/' + relative(DIST, f).split(sep).join('/').replace(/(^|\/)index\.html$/, '$1');
const pages = htmlFiles.map((f) => ({ file: f, path: toUrlPath(f), html: readFileSync(f, 'utf8') }));
const sitemap = existsSync(join(DIST, 'sitemap.xml'))
  ? [...readFileSync(join(DIST, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, ''))
  : [];

// ---------- static checks --------------------------------------------------------------
const textOf = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i')); return m ? m[1] : null; };
const meta = (html, key, val) => {
  const tag = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]).find((t) => attr(t, key) === val);
  return tag ? attr(tag, 'content') : null;
};
const exists = (urlPath) => {
  const clean = decodeURIComponent(urlPath.split(/[?#]/)[0]);
  const p = join(DIST, clean);
  return existsSync(clean.endsWith('/') ? join(p, 'index.html') : p);
};

// Headings outside [hidden] / <template> / <script> / <style> subtrees, in document order.
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr',
  'path', 'circle', 'rect', 'line', 'ellipse', 'polygon', 'polyline', 'stop', 'use']);
function visibleHeadings(html) {
  const out = [], stack = [];
  const body = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, '');
  for (const m of body.matchAll(/<(\/)?([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*?)(\/)?>/g)) {
    const [, close, rawName, attrs, selfClose] = m;
    const name = rawName.toLowerCase();
    if (close) { const i = stack.map((x) => x.name).lastIndexOf(name); if (i >= 0) stack.length = i; continue; }
    const hidden = /(^|\s)hidden(\s|=|$)/i.test(attrs);
    if (/^h[1-6]$/.test(name) && !hidden && !stack.some((x) => x.hidden)) out.push(+name[1]);
    if (!VOID.has(name) && !selfClose) stack.push({ name, hidden });
  }
  return out;
}

// Words the brief bans (advertising law, virtual-asset framing). A hit inside a negated
// sentence ("…이 아닙니다", "…하지 않습니다") is only info; otherwise it needs a human look.
const GUARD = ['위조 불가능', '위조할 수 없', '완벽한 증명', '완벽하게 증명', '100%', '영원히', '영구 보존', '영구히', '해킹 불가', '해킹할 수 없',
  '최초', '유일한 기술', '투자 가치', '가격 상승', '값이 오르', '수익을 보장', '한정판', '소장 가치', '희소가치', '시세', '프리미엄'];
const NEG = /(아니|않|없|금지|말아|못|아닌|대신)/;

const shells = { datapd: new Map(), studio: new Map() };
for (const pg of pages) {
  const { html, path } = pg;
  const isStudio = path.startsWith('/drchoistudio/');
  const noindex = /<meta[^>]+name="robots"[^>]+noindex/i.test(html);
  pg.noindex = noindex;

  // document basics
  if (!/<html[^>]*\slang="ko"/i.test(html)) add(path, 'lang', 'error', '<html lang="ko"> missing');
  if (!/<meta[^>]+name="viewport"/i.test(html)) add(path, 'viewport', 'error', 'viewport meta missing');
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1];
  if (!title) add(path, 'title', 'error', '<title> missing');
  else if ([...title].length > 60) add(path, 'title', 'warn', `title is ${[...title].length} chars (search results cut around 30 Korean chars / 60 total)`);
  const desc = meta(html, 'name', 'description');
  if (!desc) add(path, 'description', noindex ? 'warn' : 'error', 'meta description missing');
  else if ([...desc].length > 160 || [...desc].length < 50) add(path, 'description', 'warn', `description is ${[...desc].length} chars (aim 50–160)`);

  // canonical + open graph (indexable pages only)
  if (!noindex) {
    const canon = ([...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/gi)][0] || [])[0];
    const href = canon ? attr(canon, 'href') : null;
    const expect = SITE + path;
    if (!href) add(path, 'canonical', 'error', 'canonical missing');
    else if (href !== expect) add(path, 'canonical', 'error', `canonical ${href} ≠ ${expect}`);
    for (const k of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type', 'og:site_name']) {
      if (!meta(html, 'property', k)) add(path, 'open-graph', 'error', `${k} missing`);
    }
    const ogUrl = meta(html, 'property', 'og:url');
    if (ogUrl && href && ogUrl !== href) add(path, 'open-graph', 'warn', `og:url ${ogUrl} ≠ canonical ${href}`);
    const ogImg = meta(html, 'property', 'og:image');
    if (ogImg && ogImg.startsWith(SITE) && !exists(ogImg.replace(SITE, ''))) add(path, 'open-graph', 'error', `og:image not in dist: ${ogImg}`);
    if (!meta(html, 'name', 'twitter:card')) add(path, 'open-graph', 'warn', 'twitter:card missing');
    if (!sitemap.includes(path)) add(path, 'sitemap', 'warn', 'indexable page not listed in sitemap.xml');
  } else if (sitemap.includes(path)) add(path, 'sitemap', 'error', 'noindex page listed in sitemap.xml');

  // headings: exactly one h1 outside [hidden] blocks
  const levels = visibleHeadings(html);
  const h1 = levels.filter((l) => l === 1).length;
  if (h1 !== 1) add(path, 'h1', 'error', `${h1} visible <h1>`);
  levels.forEach((l, i) => { if (i && l > levels[i - 1] + 1) add(path, 'heading-order', 'warn', `h${levels[i - 1]} → h${l} skips a level`); });

  // images
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const t = m[0], src = attr(t, 'src');
    if (attr(t, 'alt') === null) add(path, 'img', 'error', `img without alt: ${src}`);
    if (!attr(t, 'width') || !attr(t, 'height')) add(path, 'img', 'warn', `img without width/height (CLS): ${src}`);
  }

  // internal links, sources and #anchors
  for (const m of html.matchAll(/\s(?:href|src|data-sample)="([^"]+)"/gi)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(u) || u.startsWith('//')) continue;
    if (u.startsWith('#')) {
      const id = u.slice(1);
      if (id && !html.includes(`id="${id}"`)) add(path, 'anchor', 'error', `#${id} has no target on this page`);
      continue;
    }
    if (!u.startsWith('/')) { add(path, 'link', 'warn', `relative URL ${u} (404.html is served at any depth — prefer absolute)`); continue; }
    if (!exists(u)) { add(path, 'link', 'error', `broken internal link ${u}`); continue; }
    const hash = u.split('#')[1];
    if (hash) {
      const target = pages.find((p) => p.path === u.split(/[?#]/)[0]);
      if (target && !target.html.includes(`id="${hash}"`)) add(path, 'anchor', 'error', `${u} — anchor missing on target page`);
    }
  }

  // JSON-LD
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(m[1]); } catch (e) { add(path, 'json-ld', 'error', `JSON-LD does not parse: ${e.message}`); }
  }

  // wording guardrails
  const text = textOf(html);
  for (const w of GUARD) {
    let i = text.indexOf(w);
    while (i >= 0) {
      const s = Math.max(text.lastIndexOf('.', i), text.lastIndexOf('다 ', i), 0);
      const e = text.indexOf('.', i + w.length);
      const sentence = text.slice(s, e < 0 ? i + 80 : e + 1).trim();
      add(path, 'guardrail', NEG.test(sentence) ? 'info' : 'warn', `"${w}" — ${sentence.slice(0, 140)}`);
      i = text.indexOf(w, i + w.length);
    }
  }

  // shared header/footer must be identical inside each site
  const norm = (s) => (s || '').replace(/\s+aria-current="page"/g, '').replace(/\s+/g, ' ').trim();
  const head = norm((html.match(/<header class="site-head">[\s\S]*?<\/header>/) || [])[0]);
  const foot = norm((html.match(/<footer class="site-foot">[\s\S]*?<\/footer>/) || [])[0]);
  const bucket = shells[isStudio ? 'studio' : 'datapd'];
  const key = head + '\n' + foot;
  bucket.set(key, [...(bucket.get(key) || []), path]);

  // page weight (local assets only; external fonts listed separately)
  const local = new Set();
  for (const m of html.matchAll(/<(?:link[^>]+href|script[^>]+src|img[^>]+src)="(\/[^"?#]+)"/gi)) local.add(m[1]);
  let bytes = Buffer.byteLength(html);
  for (const u of local) { const p = join(DIST, decodeURIComponent(u)); if (existsSync(p)) bytes += statSync(p).size; }
  pg.bytes = bytes;
  pg.external = [...new Set([...html.matchAll(/(?:href|src)="(https:\/\/[^"]+)"/gi)].map((m) => new URL(m[1]).host).filter((h) => !h.endsWith('datapd.ai')))];
}
for (const [site, map] of Object.entries(shells)) {
  if (map.size > 1) {
    const groups = [...map.values()].sort((a, b) => b.length - a.length);
    for (const g of groups.slice(1)) add(g.join(', '), 'shell', 'error', `${site} header/footer differs from the majority (${groups[0].slice(0, 3).join(', ')}…)`);
  }
}

// registry integrity: every certificate with a published sample file must hash to its record
const regPath = join(DIST, 'drchoistudio', 'certificates.json');
if (existsSync(regPath)) {
  const reg = JSON.parse(readFileSync(regPath, 'utf8'));
  for (const c of reg.certificates || []) {
    if (!/^DRC-\d{4}-\d{6}$/.test(c.id)) add('/drchoistudio/certificates.json', 'registry', 'error', `bad id ${c.id}`);
    if (!/^[0-9a-f]{64}$/.test(c.sha256)) add('/drchoistudio/certificates.json', 'registry', 'error', `bad sha256 for ${c.id}`);
    const sample = c.file && join(DIST, 'drchoistudio', 'samples', c.file.name);
    if (sample && existsSync(sample)) {
      const buf = readFileSync(sample);
      const h = createHash('sha256').update(buf).digest('hex');
      if (h !== c.sha256) add('/drchoistudio/certificates.json', 'registry', 'error', `${c.id}: sample hash ${h.slice(0, 12)}… ≠ registry ${c.sha256.slice(0, 12)}…`);
      if (c.file.bytes && c.file.bytes !== buf.length) add('/drchoistudio/certificates.json', 'registry', 'error', `${c.id}: bytes ${buf.length} ≠ registry ${c.file.bytes}`);
    }
  }
} else add('/drchoistudio/certificates.json', 'registry', 'error', 'registry missing from dist');

// ---------- html-validate -------------------------------------------------------------------
log('html-validate');
const hvConfig = join(OUT, 'htmlvalidate.json');
mkdirSync(OUT, { recursive: true });
writeFileSync(hvConfig, JSON.stringify({
  extends: ['html-validate:recommended'],
  rules: {
    'no-inline-style': 'off', 'void-style': 'off', 'no-trailing-whitespace': 'off', 'long-title': 'off',
    'attribute-boolean-style': 'off', 'no-raw-characters': 'off', 'prefer-native-element': 'off', 'no-redundant-role': 'warn',
    'element-required-attributes': 'error', 'unique-landmark': 'warn', 'text-content': 'warn',
  },
}, null, 2));
const hv = npx(['--yes', 'html-validate@9', '--config', hvConfig, '--formatter', 'json', ...htmlFiles.map((f) => relative(ROOT, f))]);
try {
  for (const r of JSON.parse(hv.stdout || '[]')) {
    const page = toUrlPath(/^([A-Za-z]:|\/)/.test(r.filePath) ? r.filePath : join(ROOT, r.filePath));
    for (const m of r.messages) add(page, `html:${m.ruleId}`, m.severity === 2 ? 'error' : 'warn', `${m.message} (line ${m.line})`);
  }
  if (!hv.stdout) add('*', 'html-validate', 'warn', `html-validate produced no output (exit ${hv.status}): ${(hv.stderr || '').slice(0, 300)}`);
} catch { add('*', 'html-validate', 'warn', `could not parse html-validate output: ${(hv.stderr || hv.stdout || '').slice(0, 300)}`); }

// ---------- Lighthouse ---------------------------------------------------------------------------
const lh = [];
if (LIGHTHOUSE) {
  if (!CHROME) { console.error('Chrome not found — set CHROME_PATH'); process.exit(1); }
  let server = null;
  let base = BASE;
  if (!base) {
    base = `http://localhost:${PORT}`;
    server = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
    for (let i = 0; i < 40; i++) { try { if ((await fetch(base + '/')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 250)); }
  }
  const targets = pages
    .filter((p) => !ONLY || ONLY.includes(p.path))
    .map((p) => (p.path === '/drchoistudio/certificate.html' ? '/drchoistudio/certificate.html?id=DRC-2026-000001' : p.path));
  const tmp = join(OUT, 'lh');
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  let n = 0;
  for (const path of targets) {
    for (const form of FORMS) {
      n++;
      const file = join(tmp, `${n}.json`);
      log(`lighthouse ${form.padEnd(7)} ${path}`);
      const args = ['--yes', 'lighthouse@12', base + path, '--quiet', '--output=json', `--output-path=${file}`,
        '--only-categories=performance,accessibility,best-practices,seo', '--chrome-flags=--headless=new --no-first-run --disable-extensions'];
      if (form === 'desktop') args.push('--preset=desktop');
      const r = npx(args, { env: { ...process.env, CHROME_PATH: CHROME }, timeout: 180000 });
      if (!existsSync(file)) { add(path, 'lighthouse', 'error', `${form} run failed: ${(r.stderr || '').slice(-300)}`); continue; }
      const j = JSON.parse(readFileSync(file, 'utf8'));
      const score = (k) => (j.categories[k]?.score == null ? null : Math.round(j.categories[k].score * 100));
      const failing = [];
      for (const [cat, c] of Object.entries(j.categories)) {
        for (const ref of c.auditRefs) {
          const a = j.audits[ref.id];
          if (!a || a.score === null || a.score >= 1 || ['notApplicable', 'informative', 'manual'].includes(a.scoreDisplayMode)) continue;
          if (cat === 'performance' && !ref.group && ref.weight === 0 && a.score >= 0.9) continue;
          const items = (a.details?.items || []).slice(0, 4).map((it) => it.node?.snippet || it.node?.selector || it.url || it.source?.url || it.label || JSON.stringify(it).slice(0, 120));
          failing.push({ category: cat, id: ref.id, title: a.title, score: a.score, displayValue: a.displayValue || '', weight: ref.weight, items });
        }
      }
      const metric = (id) => j.audits[id]?.displayValue || '';
      lh.push({ path, form, perf: score('performance'), a11y: score('accessibility'), bp: score('best-practices'), seo: score('seo'),
        fcp: metric('first-contentful-paint'), lcp: metric('largest-contentful-paint'), tbt: metric('total-blocking-time'), cls: metric('cumulative-layout-shift'),
        failing: failing.sort((a, b) => b.weight - a.weight || a.score - b.score) });
    }
  }
  if (server) server.kill();
}

// ---------- report --------------------------------------------------------------------------------
const bySev = (s) => issues.filter((i) => i.severity === s);
const report = {
  generatedAt: new Date().toISOString(), base: BASE || `local preview :${PORT}`, forms: LIGHTHOUSE ? FORMS : [],
  totals: { pages: pages.length, errors: bySev('error').length, warnings: bySev('warn').length, info: bySev('info').length },
  pages: pages.map((p) => ({ path: p.path, noindex: p.noindex, bytes: p.bytes, external: p.external })),
  lighthouse: lh, issues,
};
writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));

const md = [];
md.push(`# Harness report`, '', `- base: ${report.base}`, `- pages: ${pages.length} · errors: ${report.totals.errors} · warnings: ${report.totals.warnings} · info: ${report.totals.info}`, '');
if (lh.length) {
  md.push('## Lighthouse', '', '| page | form | perf | a11y | bp | seo | LCP | TBT | CLS |', '|---|---|---|---|---|---|---|---|---|');
  for (const r of lh) md.push(`| ${r.path} | ${r.form} | ${r.perf} | ${r.a11y} | ${r.bp} | ${r.seo} | ${r.lcp} | ${r.tbt} | ${r.cls} |`);
  const agg = new Map();
  for (const r of lh) for (const f of r.failing) {
    const k = f.category + ':' + f.id;
    const e = agg.get(k) || { ...f, pages: [] };
    e.pages.push(`${r.path} (${r.form}${f.displayValue ? ', ' + f.displayValue : ''})`);
    agg.set(k, e);
  }
  md.push('', '### Failing audits (all pages)', '');
  for (const e of [...agg.values()].sort((a, b) => b.pages.length - a.pages.length)) {
    md.push(`- **${e.category} · ${e.id}** — ${e.title} — ${e.pages.length} run(s)`);
    md.push(`  - where: ${e.pages.slice(0, 6).join('; ')}${e.pages.length > 6 ? ' …' : ''}`);
    if (e.items.length) md.push(`  - e.g. ${e.items.map((x) => '`' + String(x).replace(/`/g, "'").slice(0, 110) + '`').join(' · ')}`);
  }
}
for (const sev of ['error', 'warn', 'info']) {
  const list = bySev(sev);
  if (!list.length) continue;
  md.push('', `## Static ${sev} (${list.length})`, '');
  for (const i of list) md.push(`- \`${i.page}\` **${i.check}** — ${i.message}`);
}
md.push('', '## Page weight (local HTML+CSS+JS+img, bytes)', '');
for (const p of report.pages) md.push(`- \`${p.path}\` ${p.bytes.toLocaleString()} B${p.external.length ? ' · external: ' + p.external.join(', ') : ''}${p.noindex ? ' · noindex' : ''}`);
writeFileSync(join(OUT, 'report.md'), md.join('\n') + '\n');

log(`done — ${report.totals.errors} errors, ${report.totals.warnings} warnings → ${relative(ROOT, join(OUT, 'report.md'))}`);
if (lh.length) {
  const avg = (k, form) => { const xs = lh.filter((r) => r.form === form && r[k] != null).map((r) => r[k]); return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : '-'; };
  for (const form of FORMS) log(`${form.padEnd(7)} avg  perf ${avg('perf', form)} · a11y ${avg('a11y', form)} · bp ${avg('bp', form)} · seo ${avg('seo', form)}  (min perf ${Math.min(...lh.filter((r) => r.form === form).map((r) => r.perf ?? 100))})`);
}
