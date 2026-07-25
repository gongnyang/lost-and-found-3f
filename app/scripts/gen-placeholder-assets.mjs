// 1회성 생성 스크립트 — placeholder SVG(실루엣 3인 + 배경 2장 + 전투 시트/manifest)를
// public/assets에 만든다. 실제 파이프라인(codex-imagegen → postprocess.mjs)이 .webp로
// 교체하기 전까지의 임시 자리표시자.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public', 'assets');

const CHAR_COLORS = { aoi: '#7fb8ff', haru: '#ffb3c6', sena: '#c9a7ff' };

const MOUTHS = {
  neutral: 'M 40 118 Q 60 118 80 118',
  smile: 'M 38 112 Q 60 132 82 112',
  surprise: 'M 52 108 a 8 10 0 1 0 16 0 a 8 10 0 1 0 -16 0',
  sad: 'M 38 124 Q 60 108 82 124',
};

function silhouetteSvg(name, expr, color) {
  const mouth = MOUTHS[expr] ?? MOUTHS.neutral;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="720" viewBox="0 0 480 720">
  <rect width="480" height="720" fill="none"/>
  <ellipse cx="240" cy="600" rx="150" ry="220" fill="${color}" opacity="0.9"/>
  <circle cx="240" cy="130" r="90" fill="${color}"/>
  <g transform="translate(180 60)" fill="#0b0b0d" opacity="0.85">
    <circle cx="35" cy="55" r="7"/>
    <circle cx="85" cy="55" r="7"/>
    <path d="${mouth}" stroke="#0b0b0d" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>
  <text x="240" y="700" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#0b0b0d" opacity="0.55">${name} · ${expr}</text>
</svg>`;
}

function bgSvg(label, colorA, colorB) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${colorA}"/>
      <stop offset="100%" stop-color="${colorB}"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#g)"/>
  <text x="960" y="560" text-anchor="middle" font-family="sans-serif" font-size="72" fill="#ffffff" opacity="0.25">${label}</text>
</svg>`;
}

function spriteSheetSvg() {
  // idle: frame 0-1 (x=0,64), attack: frame 0-2 (x=128,192,256). 64x64 프레임, 총 320x64.
  const frames = [
    { x: 0, arm: 0, color: '#7fb8ff' },
    { x: 64, arm: -6, color: '#7fb8ff' },
    { x: 128, arm: 0, color: '#ffd27f' },
    { x: 192, arm: 30, color: '#ffd27f' },
    { x: 256, arm: -20, color: '#ffd27f' },
  ];
  const bodies = frames
    .map(
      (f) => `
    <g transform="translate(${f.x} 0)">
      <rect width="64" height="64" fill="#1a1a1e"/>
      <circle cx="32" cy="20" r="10" fill="#e8e8ea"/>
      <rect x="22" y="30" width="20" height="24" fill="#e8e8ea"/>
      <rect x="14" y="34" width="8" height="20" fill="#e8e8ea" transform="rotate(${f.arm} 18 34)"/>
      <rect x="42" y="34" width="8" height="20" fill="${f.color}" transform="rotate(${-f.arm} 46 34)"/>
    </g>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="64" viewBox="0 0 320 64">${bodies}</svg>`;
}

function spriteManifest() {
  return {
    actions: {
      idle: {
        frames: [
          { x: 0, y: 0, w: 64, h: 64 },
          { x: 64, y: 0, w: 64, h: 64 },
        ],
        fps: 4,
        loop: true,
      },
      attack: {
        frames: [
          { x: 128, y: 0, w: 64, h: 64 },
          { x: 192, y: 0, w: 64, h: 64 },
          { x: 256, y: 0, w: 64, h: 64 },
        ],
        fps: 8,
        loop: false,
      },
    },
  };
}

const EXPRS = ['neutral', 'smile', 'surprise', 'sad'];
for (const [id, color] of Object.entries(CHAR_COLORS)) {
  const dir = join(PUBLIC, 'char', id);
  mkdirSync(dir, { recursive: true });
  for (const expr of EXPRS) {
    const file = expr === 'neutral' ? 'base.svg' : `expr_${expr}.svg`;
    writeFileSync(join(dir, file), silhouetteSvg(id, expr, color));
  }
}

mkdirSync(join(PUBLIC, 'bg'), { recursive: true });
writeFileSync(join(PUBLIC, 'bg', 'classroom.svg'), bgSvg('교실', '#1c2230', '#0b0d12'));
writeFileSync(join(PUBLIC, 'bg', 'rooftop.svg'), bgSvg('옥상', '#2a3550', '#0c1018'));

const sdDir = join(PUBLIC, 'sd', 'aoi');
mkdirSync(sdDir, { recursive: true });
writeFileSync(join(sdDir, 'sheet.svg'), spriteSheetSvg());
writeFileSync(join(sdDir, 'manifest.json'), JSON.stringify(spriteManifest(), null, 2));

console.log('placeholder assets generated.');
