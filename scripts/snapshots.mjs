// Visual snapshots of every built page — to prove an optimization changed no pixels.
//
//   node scripts/snapshots.mjs <dir>                     capture dist/ pages (500 & 1280 wide, light & dark)
//   node scripts/snapshots.mjs <dir> --compare <baseDir>  capture, then diff against an earlier capture
//
// Uses the local Chrome headless and `vite preview` on port 4321. Run `npm run build` first.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PORT = 4321;
const OUT = process.argv[2];
const ci = process.argv.indexOf('--compare');
const BASE = ci > 0 ? process.argv[ci + 1] : null;
if (!OUT) { console.error('usage: node scripts/snapshots.mjs <dir> [--compare <baseDir>]'); process.exit(1); }
const CHROME = process.env.CHROME_PATH || ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', '/usr/bin/google-chrome'].find(existsSync);

const pages = [];
(function walk(d) { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && pages.push(p); } })(DIST);
const paths = pages.map((f) => '/' + relative(DIST, f).split(sep).join('/').replace(/(^|\/)index\.html$/, '$1'))
  .filter((p) => p !== '/drchoistudio/')   // redirected to the external studio site in production
  .map((p) => (p === '/drchoistudio/certificate.html' ? p + '?id=DRC-2026-000001' : p));

// Headless Chrome on Windows never lays a page out narrower than ~500px (a 390px window just crops a
// 500px layout), so the narrow capture is 500px. Check true phone widths (360px) with iframe emulation instead.
const VIEWS = [{ w: 500, h: 8000 }, { w: 1280, h: 6000 }];
const SCHEMES = [{ name: 'light', flag: 'preferredColorScheme=1' }, { name: 'dark', flag: 'preferredColorScheme=0' }];
const slug = (p) => (p.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home');

mkdirSync(OUT, { recursive: true });
const server = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
process.on('exit', () => { try { server.kill(); } catch {} });
for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 250)); }

// A blank capture (one flat colour) means Chrome shot before painting — retry once, then report it.
const isBlank = async (file) => {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const seen = new Set();
  for (let i = 0; i < data.length && seen.size < 8; i += info.channels * 211) seen.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
  return seen.size < 8;
};
const blanks = [];
let n = 0;
for (const p of paths) for (const v of VIEWS) for (const s of SCHEMES) {
  const file = join(OUT, `${slug(p)}.${v.w}.${s.name}.png`);
  let ok = false;
  for (let attempt = 0; attempt < 2 && !ok; attempt++) {
    rmSync(file, { force: true });
    const profile = join(tmpdir(), `datapd-snap-${process.pid}-${n++}`);   // fresh profile per shot: no shared locks or service workers
    spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${profile}`, '--force-device-scale-factor=1',
      `--window-size=${v.w},${v.h}`, '--virtual-time-budget=6000', `--blink-settings=${s.flag}`, `--screenshot=${file}`, `http://localhost:${PORT}${p}`], { stdio: 'ignore', timeout: 90000 });
    // Chrome's crashpad handler can hold the profile for a moment after the browser exits (EPERM on Windows).
    try { rmSync(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }); } catch {}
    ok = existsSync(file) && !(await isBlank(file));
  }
  if (!ok) blanks.push(file);
  process.stdout.write(ok ? '.' : 'x');
}
if (blanks.length) console.log(`\n${blanks.length} blank/missing capture(s):\n  ${blanks.join('\n  ')}`);
console.log(`\ncaptured ${paths.length} pages × ${VIEWS.length} widths × ${SCHEMES.length} schemes → ${OUT}`);

if (BASE) {
  let changed = 0;
  for (const n of readdirSync(OUT).filter((x) => x.endsWith('.png'))) {
    const b = join(BASE, n);
    if (!existsSync(b)) { console.log(`new   ${n}`); continue; }
    const [x, y] = await Promise.all([join(OUT, n), b].map((f) => sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
    if (x.info.width !== y.info.width || x.info.height !== y.info.height) { console.log(`size  ${n}`); changed++; continue; }
    let diff = 0;
    for (let i = 0; i < x.data.length; i += 4) {
      if (Math.abs(x.data[i] - y.data[i]) + Math.abs(x.data[i + 1] - y.data[i + 1]) + Math.abs(x.data[i + 2] - y.data[i + 2]) > 24) diff++;
    }
    const pct = (100 * diff) / (x.info.width * x.info.height);
    if (pct > 0.05) { console.log(`diff  ${n}  ${pct.toFixed(2)}% of pixels`); changed++; }
  }
  console.log(changed ? `${changed} snapshot(s) differ` : 'no visual differences');
}
process.exit(0);
