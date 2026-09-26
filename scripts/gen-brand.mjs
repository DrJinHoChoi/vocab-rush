// DataPD + 최박사사진관 brand asset generator.
// Run: npm run brand             → brand assets only (icons, favicons, share cards)
//      npm run brand -- --samples → ALSO regenerate the demo photos + certificates.json
//
// public/                 DataPD (site root): favicon.svg/.ico, favicon-16/32.png, icon-192/512.png,
//                         icon-maskable-512.png, apple-touch-icon.png, og-card.png
// public/drchoistudio/    최박사사진관: favicon.svg/.ico, apple-touch-icon.png, og-card.png
//                         (--samples) samples/sample-original.jpg, samples/sample-edited.jpg, certificates.json
//
// Samples are opt-in because the registry stores the SHA-256 of sample-original.jpg exactly as
// published: rewriting the photo can change its bytes and break every link that quotes the hash.
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PUB = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const STUDIO = join(PUB, 'drchoistudio');
const SAMPLES = process.argv.includes('--samples');
mkdirSync(join(STUDIO, 'samples'), { recursive: true });

const INK = '#0F0F0E', PAPER = '#F4F4F1', RED = '#C8321D';
const png = (svg) => sharp(Buffer.from(svg)).png().toBuffer();
const sha = (buf) => createHash('sha256').update(buf).digest('hex');

// ---- marks -------------------------------------------------------------------
// pad = fraction of the tile left empty around the mark (maskable needs more).

// 최박사사진관: four crop marks + safelight dot, on an ink tile.
function studioMark(size, { pad = 0.2, bg = INK, fg = PAPER, radius = 0.18 } = {}) {
  const inner = size * (1 - pad * 2), o = size * pad;
  const L = inner * 0.3, W = Math.max(1.5, inner * 0.085);
  const x0 = o, y0 = o, x1 = o + inner, y1 = o + inner;
  const path = [
    `M${x0} ${y0 + L}V${y0}H${x0 + L}`, `M${x1 - L} ${y0}H${x1}V${y0 + L}`,
    `M${x1} ${y1 - L}V${y1}H${x1 - L}`, `M${x0 + L} ${y1}H${x0}V${y1 - L}`,
  ].join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * radius}" fill="${bg}"/>
  <path d="${path}" fill="none" stroke="${fg}" stroke-width="${W}" stroke-linecap="square"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${inner * 0.14}" fill="${RED}"/>
</svg>`;
}

// DataPD: a 3×3 field of copies with one original — eight faint dots, one red dot.
// The red dot is the same "원본" signal the studio mark frames with crop marks.
function datapdMark(size, { pad = 0.2, bg = INK, fg = PAPER, radius = 0.18 } = {}) {
  const inner = size * (1 - pad * 2), o = size * pad;
  const small = size <= 32 ? inner * 0.095 : inner * 0.075;
  const pos = [1 / 6, 3 / 6, 5 / 6].map((t) => o + inner * t);
  let dots = '';
  for (const y of pos) for (const x of pos) {
    if (x === pos[1] && y === pos[1]) continue;
    dots += `<circle cx="${x}" cy="${y}" r="${small}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * radius}" fill="${bg}"/>
  <g fill="${fg}" fill-opacity=".42">${dots}</g>
  <circle cx="${pos[1]}" cy="${pos[1]}" r="${inner * 0.15}" fill="${RED}"/>
</svg>`;
}

// PNG-in-ICO container (16/32/48)
async function writeIco(file, mark) {
  const imgs = await Promise.all([16, 32, 48].map(async (s) => ({ s, buf: await png(mark(s, { pad: s <= 16 ? 0.1 : 0.14 })) })));
  const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
  const dir = Buffer.alloc(16 * imgs.length);
  let off = 6 + 16 * imgs.length;
  imgs.forEach(({ s, buf }, i) => {
    const b = i * 16;
    dir.writeUInt8(s, b); dir.writeUInt8(s, b + 1); dir.writeUInt8(0, b + 2); dir.writeUInt8(0, b + 3);
    dir.writeUInt16LE(1, b + 4); dir.writeUInt16LE(32, b + 6); dir.writeUInt32LE(buf.length, b + 8); dir.writeUInt32LE(off, b + 12);
    off += buf.length;
  });
  writeFileSync(file, Buffer.concat([head, dir, ...imgs.map((x) => x.buf)]));
}

// ---- DataPD icons (site root; also used by the PWA manifest) -------------------
writeFileSync(join(PUB, 'favicon.svg'), datapdMark(64, { pad: 0.16, radius: 0.2 }));
const rootTargets = [
  ['icon-512.png', 512, { pad: 0.2 }],
  ['icon-192.png', 192, { pad: 0.2 }],
  ['apple-touch-icon.png', 180, { pad: 0.2, radius: 0 }],          // iOS rounds it itself
  ['icon-maskable-512.png', 512, { pad: 0.3, radius: 0 }],         // mark inside the 80% safe zone
  ['favicon-32.png', 32, { pad: 0.14 }],
  ['favicon-16.png', 16, { pad: 0.1 }],
];
for (const [file, size, opt] of rootTargets) writeFileSync(join(PUB, file), await png(datapdMark(size, opt)));
await writeIco(join(PUB, 'favicon.ico'), datapdMark);
console.log('✓ DataPD icons  public/{favicon.svg,favicon.ico,favicon-16/32,icon-192/512,icon-maskable-512,apple-touch-icon}');

// ---- 최박사사진관 icons (page-level <link rel=icon> under /drchoistudio/) ------
writeFileSync(join(STUDIO, 'favicon.svg'), studioMark(64, { pad: 0.16, radius: 0.2 }));
writeFileSync(join(STUDIO, 'apple-touch-icon.png'), await png(studioMark(180, { pad: 0.2, radius: 0 })));
await writeIco(join(STUDIO, 'favicon.ico'), studioMark);
console.log('✓ studio icons  public/drchoistudio/{favicon.svg,favicon.ico,apple-touch-icon.png}');

// ---- demo photo + registry (opt-in) ------------------------------------------------
const originalPath = join(STUDIO, 'samples', 'sample-original.jpg');
const editedPath = join(STUDIO, 'samples', 'sample-edited.jpg');

if (SAMPLES) {
  // Studio still life on a seamless sweep. No people, no third-party imagery.
  const W = 1200, H = 900;
  const photoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sweep" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#AEB5A6"/><stop offset=".52" stop-color="#C9CEC0"/>
      <stop offset=".70" stop-color="#D9DCD1"/><stop offset="1" stop-color="#C3C7BA"/>
    </linearGradient>
    <radialGradient id="key" cx=".28" cy=".22" r=".75">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity=".42"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="shadow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#3A3B33" stop-opacity=".42"/><stop offset="1" stop-color="#3A3B33" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7E5A39"/><stop offset=".45" stop-color="#A9804F"/><stop offset="1" stop-color="#6F4E31"/>
    </linearGradient>
    <linearGradient id="clay" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#D9D3C7"/><stop offset=".4" stop-color="#F3EFE7"/><stop offset="1" stop-color="#BDB6A8"/>
    </linearGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .07 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sweep)"/>
  <rect width="${W}" height="${H}" fill="url(#key)"/>
  <ellipse cx="640" cy="772" rx="300" ry="44" fill="url(#shadow)"/>
  <!-- stool legs -->
  <path d="M500 590 L462 770 L478 772 L518 596Z" fill="#5E4129"/>
  <path d="M700 590 L742 770 L726 772 L684 596Z" fill="#5E4129"/>
  <path d="M598 604 L602 790 L618 790 L614 604Z" fill="#4E3622"/>
  <!-- stool seat -->
  <rect x="452" y="560" width="296" height="34" rx="6" fill="url(#wood)"/>
  <ellipse cx="600" cy="560" rx="148" ry="30" fill="#B58B58"/>
  <ellipse cx="600" cy="560" rx="148" ry="30" fill="none" stroke="#8A6641" stroke-width="2"/>
  <!-- vase -->
  <path d="M556 548 C548 500 548 452 570 420 C580 404 580 392 574 380 L626 380 C620 392 620 404 630 420 C652 452 652 500 644 548 Z" fill="url(#clay)"/>
  <ellipse cx="600" cy="380" rx="26" ry="6" fill="#A79F90"/>
  <!-- dried branch -->
  <g stroke="#5B4A36" stroke-width="3" fill="none" stroke-linecap="round">
    <path d="M598 382 C592 320 574 250 540 180"/><path d="M572 290 C548 268 520 262 490 262"/>
    <path d="M556 236 C570 212 590 200 612 196"/><path d="M604 380 C620 318 650 262 700 214"/>
    <path d="M652 266 C676 262 702 270 724 288"/>
  </g>
  <g fill="#8E7657"><circle cx="540" cy="180" r="6"/><circle cx="490" cy="262" r="5"/><circle cx="612" cy="196" r="5"/><circle cx="700" cy="214" r="6"/><circle cx="724" cy="288" r="5"/></g>
  <rect width="${W}" height="${H}" filter="url(#grain)"/>
</svg>`;

  const original = await sharp(Buffer.from(photoSvg)).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  writeFileSync(originalPath, original);
  // "edited": the same shot, brightened 4% — visually near-identical, different file fingerprint
  const edited = await sharp(original).modulate({ brightness: 1.04 }).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  writeFileSync(editedPath, edited);
  console.log('✓ samples  original', sha(original), '\n           edited  ', sha(edited));

  const registry = {
    issuer: { name: '최박사사진관', en: 'Dr. Choi Photo Studio', location: '대구 수성구 범어동' },
    algorithm: 'SHA-256',
    updatedAt: '2026-09-25',
    note: '시범 운영 레지스트리. 정식 오픈 후 발급분은 선택 시 공개 블록체인(NFT)에도 지문을 기록합니다.',
    certificates: [
      {
        id: 'DRC-2026-000001',
        sha256: sha(original),
        issuedAt: '2026-09-25T15:00:00+09:00',
        title: '원본 확인 체험용 샘플',
        category: '샘플 · 그래픽',
        studio: '범어점',
        file: { name: 'sample-original.jpg', bytes: original.length, width: W, height: H, type: 'image/jpeg' },
        chain: { status: 'pilot', network: null, tx: null, note: '시범 운영 — 블록체인(NFT) 등록 전, 이 레지스트리에만 기록' },
        demo: true,
      },
    ],
  };
  writeFileSync(join(STUDIO, 'certificates.json'), JSON.stringify(registry, null, 2) + '\n');
  console.log('✓ drchoistudio/certificates.json');
}

// The share cards quote the published original's fingerprint, whichever run produced it.
const hOrig = sha(readFileSync(originalPath));

// ---- 최박사사진관 share card (1200x630) ---------------------------------------------
const shortHash = hOrig.slice(0, 16) + '…' + hOrig.slice(-8);
const studioOg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${PAPER}"/>
  <g stroke="${INK}" stroke-width="3" fill="none">
    <path d="M60 104V60H104"/><path d="M1096 60H1140V104"/><path d="M1140 526V570H1096"/><path d="M104 570H60V526"/>
  </g>
  <g transform="translate(96,96)">${studioMark(84, { pad: 0.2 }).replace(/<\/?svg[^>]*>/g, '')}</g>
  <text x="200" y="152" font-family="Consolas, monospace" font-size="20" letter-spacing="3" fill="#5C5C58">DR. CHOI PHOTO STUDIO · 대구 범어</text>
  <text x="96" y="330" font-family="Malgun Gothic, sans-serif" font-size="112" font-weight="800" letter-spacing="-5" fill="${INK}">최박사사진관</text>
  <text x="100" y="408" font-family="Malgun Gothic, sans-serif" font-size="40" font-weight="700" fill="#2A2A28">찍는 순간, 원본이 증명되는 셀프 사진관</text>
  <circle cx="110" cy="500" r="9" fill="${RED}"/>
  <text x="134" y="508" font-family="Consolas, monospace" font-size="22" fill="${INK}">ORIGINAL CERTIFIED · SHA-256 ${shortHash}</text>
</svg>`;
writeFileSync(join(STUDIO, 'og-card.png'), await png(studioOg));
console.log('✓ drchoistudio/og-card.png');

// ---- DataPD share card (1200x630): a row of copies, one original -------------------
// Copies get deterministic stand-in fingerprints; the highlighted one is the real sample's.
const cols = 7, cellW = 144, gx = 96, rowsY = [486, 540];
let cells = '';
rowsY.forEach((y, r) => {
  for (let c = 0; c < cols; c++) {
    const x = gx + c * cellW;
    const isOriginal = r === 0 && c === 4;
    const h = isOriginal ? hOrig : sha(`datapd-copy-${r}-${c}`);
    const label = h.slice(0, 8);
    cells += isOriginal
      ? `<rect x="${x - 12}" y="${y - 26}" width="${cellW - 16}" height="38" fill="none" stroke="${RED}" stroke-width="2.5"/>
         <circle cx="${x + 2}" cy="${y - 7}" r="6" fill="${RED}"/>
         <text x="${x + 16}" y="${y}" font-family="Consolas, monospace" font-size="20" font-weight="700" fill="${RED}">${label}</text>`
      : `<text x="${x + 16}" y="${y}" font-family="Consolas, monospace" font-size="20" fill="#9C9C96">${label}</text>`;
  }
});
const datapdOg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${PAPER}"/>
  <g transform="translate(96,86)">${datapdMark(84, { pad: 0.2 }).replace(/<\/?svg[^>]*>/g, '')}</g>
  <text x="200" y="140" font-family="Consolas, monospace" font-size="20" letter-spacing="3" fill="#5C5C58">ORIGINAL DATA · www.datapd.ai</text>
  <text x="92" y="318" font-family="Segoe UI, Malgun Gothic, sans-serif" font-size="128" font-weight="800" letter-spacing="-4" fill="${INK}">DataPD</text>
  <text x="98" y="398" font-family="Malgun Gothic, sans-serif" font-size="44" font-weight="700" letter-spacing="-1" fill="#2A2A28">복제는 무한하고, 원본은 하나입니다.</text>
  <line x1="96" y1="440" x2="1104" y2="440" stroke="#D6D6CF" stroke-width="2"/>
  ${cells}
</svg>`;
writeFileSync(join(PUB, 'og-card.png'), await png(datapdOg));
console.log('✓ og-card.png (DataPD)');
