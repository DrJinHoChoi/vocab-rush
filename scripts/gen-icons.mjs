// Generates PWA install icons (DOYOU 팝업스토어 cubist face) from an inline SVG.
// Run: node scripts/gen-icons.mjs  → writes public/icon-192.png, icon-512.png, apple-touch-icon.png
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PUB = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

// Cubist DOYOU face — split-plane portrait, brand palette.
// Native coords live in viewBox "305 222 488 620"; we re-fit into a square canvas.
const FACE = `<g stroke="#141413" stroke-width="14" stroke-linejoin="round" stroke-linecap="round">
  <path d="M540,235 C690,235 770,360 770,540 C770,720 680,825 540,825 C400,825 320,710 320,540 C320,360 390,235 540,235 Z" fill="#F5B60B"/>
  <path d="M540,250 C610,250 670,300 700,360 C672,430 690,440 778,478 C840,512 838,520 800,548 C742,560 760,585 786,600 C740,628 742,632 720,648 C760,672 742,690 700,742 C648,790 600,805 540,810 L540,250 Z" fill="#FAF5EB"/>
  <path d="M540,540 L320,540 C328,690 410,795 540,812 Z" fill="#5B7FA6"/>
  <path d="M540,235 C430,235 360,300 335,395 C400,360 470,350 540,355 C560,300 560,265 540,235 Z" fill="#141413"/>
  <ellipse cx="445" cy="470" rx="62" ry="42" fill="#FAF5EB"/>
  <circle cx="462" cy="470" r="22" fill="#141413"/>
  <path d="M628,452 C660,432 705,438 724,460 C700,478 660,480 628,452 Z" fill="#FAF5EB"/>
  <circle cx="690" cy="458" r="13" fill="#141413"/>
  <polygon points="540,470 600,640 470,640" fill="#C75D3A"/>
  <path d="M455,705 C500,690 560,690 600,705 C560,742 500,742 455,705 Z" fill="#C75D3A"/>
</g>`;

function svg(size, { pad = 0.78, bg = '#FAF5EB' } = {}) {
  const s = (size * pad) / 620;
  const w = 488 * s, h = 620 * s;
  const tx = (size - w) / 2 - 305 * s;
  const ty = (size - h) / 2 - 222 * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${bg}"/>
    <g transform="translate(${tx},${ty}) scale(${s})">${FACE}</g>
  </svg>`;
}

const targets = [
  { file: 'icon-512.png', size: 512, pad: 0.80 },
  { file: 'icon-192.png', size: 192, pad: 0.80 },
  // Apple touch icon: fuller bleed since iOS masks to a rounded square.
  { file: 'apple-touch-icon.png', size: 180, pad: 0.86 },
  // Maskable: face kept inside the center-80% safe zone so Android's mask
  // (circle / squircle / teardrop) never clips the portrait.
  { file: 'icon-maskable-512.png', size: 512, pad: 0.58 },
  // Browser-tab / link-preview PNG favicons (crawlers that skip SVG use these).
  { file: 'favicon-32.png', size: 32, pad: 0.84 },
  { file: 'favicon-16.png', size: 16, pad: 0.84 },
];

for (const t of targets) {
  const buf = Buffer.from(svg(t.size, { pad: t.pad }));
  await sharp(buf).png().toFile(join(PUB, t.file));
  console.log(`✓ ${t.file} (${t.size}×${t.size})`);
}

// favicon.ico — the file browsers auto-request at /favicon.ico and that most
// link-preview crawlers (KakaoTalk, iMessage, Slack…) use because they don't
// read SVG favicons. Multi-resolution, PNG-compressed entries (all modern UAs).
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + 16 * images.length;
  images.forEach((img, i) => {
    const b = i * 16;
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, b);     // width
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, b + 1); // height
    dir.writeUInt16LE(1, b + 4);              // color planes
    dir.writeUInt16LE(32, b + 6);             // bits per pixel
    dir.writeUInt32LE(img.buf.length, b + 8); // byte size
    dir.writeUInt32LE(offset, b + 12);        // offset
    offset += img.buf.length;
  });
  return Buffer.concat([header, dir, ...images.map((i) => i.buf)]);
}

const icoSizes = [16, 32, 48];
const icoImgs = await Promise.all(
  icoSizes.map(async (size) => ({
    size,
    buf: await sharp(Buffer.from(svg(size, { pad: 0.84 }))).png().toBuffer(),
  })),
);
const { writeFileSync } = await import('node:fs');
writeFileSync(join(PUB, 'favicon.ico'), buildIco(icoImgs));
console.log(`✓ favicon.ico (${icoSizes.join('/')})`);
