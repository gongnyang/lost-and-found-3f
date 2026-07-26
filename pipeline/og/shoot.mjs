// OG 이미지 + 아이콘 렌더러.
//   pipeline/og/og.html  → app/public/og.png            (1200x630, 소셜 카드)
//   pipeline/og/icon.svg → app/src/app/icon.png         (512, Next.js file convention)
//                        → app/src/app/apple-icon.png   (180)
//                        → app/src/app/favicon.ico      (32, ImageMagick 있으면)
//
// 실행: node pipeline/og/shoot.mjs   (playwright는 app/node_modules에 있다)
// 사전 준비: playwright는 Vercel 빌드 시간을 늘리지 않도록 package.json에 넣지 않는다.
//            로컬에서만 `cd app && npm i -D playwright --no-save` 로 깔고 쓴다.
// 규칙: 생성 이미지 위에 코드로 글자를 그리지 않는다 — 브라우저가 조판한 결과를 찍는다.

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, relative, resolve } from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');

// playwright는 app/node_modules에만 있다(devDependency) — 스크립트가 pipeline/에 있어도
// app 기준으로 해석되도록 require를 명시적으로 앵커링한다.
const { chromium } = createRequire(resolve(repo, 'app/package.json'))('playwright');

const publicDir = resolve(repo, 'app/public');
const appDir = resolve(repo, 'app/src/app');
const rel = (p) => relative(repo, p);

const browser = await chromium.launch();

// ---- 1) OG 카드 1200x630 ----
{
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(resolve(here, 'og.html')).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  mkdirSync(publicDir, { recursive: true });
  const out = resolve(publicDir, 'og.png');
  await page.screenshot({ path: out });
  await page.close();
  console.log('wrote', rel(out));
}

// ---- 2) 아이콘 (SVG를 여백 없이 뷰포트에 꽉 채워 렌더) ----
const iconSvg = readFileSync(resolve(here, 'icon.svg'), 'utf8');
const iconSizes = [
  { out: resolve(appDir, 'icon.png'), size: 512 },
  { out: resolve(appDir, 'apple-icon.png'), size: 180 },
  { out: resolve(here, 'icon-32.png'), size: 32 },
];

for (const { out, size } of iconSizes) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(
    `<!doctype html><meta charset="utf-8">
     <style>html,body{margin:0;padding:0;width:${size}px;height:${size}px;overflow:hidden}
     svg{display:block;width:${size}px;height:${size}px}</style>${iconSvg}`,
    { waitUntil: 'load' },
  );
  await page.waitForTimeout(80);
  await page.screenshot({ path: out });
  await page.close();
  console.log('wrote', rel(out));
}

await browser.close();

// ---- 3) favicon.ico (app/favicon.ico가 /favicon.ico 라우트를 잡으므로 같이 갱신) ----
try {
  const ico = resolve(appDir, 'favicon.ico');
  execFileSync('convert', [resolve(here, 'icon-32.png'), '-define', 'icon:auto-resize=32,16', ico]);
  console.log('wrote', rel(ico));
} catch {
  console.warn('skip favicon.ico — ImageMagick(convert) 없음. icon.png/apple-icon.png는 생성됨.');
}
