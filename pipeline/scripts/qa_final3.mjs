// P5 최종 3종 QA 스크린샷 — 타이틀 히어로 / 플레이 중 갤러리 버튼 / 갤러리 복귀 / OG 미리보기.
// 콘솔 에러·페이지 에러를 전부 수집해서 1건이라도 있으면 exit 1.
//
// 실행: (별도 셸에서) cd app && npx next start -p 3210
//       node pipeline/scripts/qa_final3.mjs http://localhost:3210
// 사전 준비: playwright는 Vercel 빌드 시간을 늘리지 않도록 package.json에 넣지 않는다.
//            로컬에서만 `cd app && npm i -D playwright --no-save` 로 깔고 쓴다.
// 출력: docs/qa/final3/*.png

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, copyFileSync, readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const { chromium } = createRequire(resolve(repo, 'app/package.json'))('playwright');

const base = process.argv[2] ?? 'http://localhost:3210';
const outDir = resolve(repo, 'docs/qa/final3');
mkdirSync(outDir, { recursive: true });

const problems = [];
const notes = [];

// 자동재생 정책 경고는 브라우저가 사용자 제스처 없이 오디오를 만들 때 항상 뜬다 —
// 실제 플레이(클릭 후)에서는 발생하지 않으므로 실패로 세지 않고 기록만 남긴다.
const BENIGN = [/AudioContext was not allowed to start/];

function watch(page, tag) {
  page.on('console', (m) => {
    const type = m.type();
    if (type !== 'error' && type !== 'warning') return;
    const line = `[${tag}] console.${type}: ${m.text()}`;
    (BENIGN.some((re) => re.test(m.text())) ? notes : problems).push(line);
  });
  page.on('pageerror', (e) => problems.push(`[${tag}] pageerror: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`[${tag}] requestfailed: ${r.url()} — ${r.failure()?.errorText}`));
}

const browser = await chromium.launch();
const shot = (page, name) => page.screenshot({ path: resolve(outDir, name) });

// ---- 1) 타이틀 히어로 · 데스크톱 ----
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  watch(page, 'title-desktop');
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1600); // 스태거 페이드인이 끝난 상태를 찍는다
  await shot(page, '01-title-desktop.png');

  // 메뉴 호버(종이가 밀려 들어오는 상태)
  await page.getByRole('button', { name: '새 게임' }).hover();
  await page.waitForTimeout(400);
  await shot(page, '02-title-hover.png');
  await page.close();
}

// ---- 2) 타이틀 히어로 · 모바일 390 ----
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  watch(page, 'title-mobile');
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1600);
  await shot(page, '03-title-mobile-390.png');
  await page.close();
}

// ---- 3) /play QuickMenu 갤러리 버튼 → 4) 갤러리 복귀 버튼 ----
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  watch(page, 'play-gallery');
  await page.goto(base + '/play', { waitUntil: 'networkidle' });
  await page.waitForSelector('.quick-menu');
  await page.mouse.move(700, 500); // 유휴 감쇠 해제
  await page.waitForTimeout(900);
  await shot(page, '04-play-quickmenu.png');

  // 퀵메뉴만 확대 크롭
  const qm = await page.locator('.quick-menu').boundingBox();
  await page.screenshot({
    path: resolve(outDir, '05-play-quickmenu-crop.png'),
    clip: { x: qm.x - 12, y: qm.y - 12, width: qm.width + 24, height: qm.height + 24 },
  });

  await page.getByRole('link', { name: '갤러리' }).click();
  await page.waitForURL('**/gallery');
  await page.waitForSelector('.gallery-back');
  await page.waitForTimeout(700);
  await shot(page, '06-gallery-back-from-play.png');

  // 복귀가 실제로 /play로 되돌아가는지까지 확인
  await page.getByRole('button', { name: '게임으로 돌아가기' }).click();
  await page.waitForURL('**/play');
  await page.waitForTimeout(400);
  if (!page.url().endsWith('/play')) problems.push('[gallery-back] 복귀 후 URL이 /play가 아님: ' + page.url());
  await page.close();
}

// ---- 5) 타이틀에서 들어간 갤러리에는 복귀 버튼이 없어야 한다 ----
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  watch(page, 'gallery-from-title');
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: '갤러리' }).click();
  await page.waitForURL('**/gallery');
  await page.waitForTimeout(600);
  if ((await page.locator('.gallery-back').count()) !== 0) {
    problems.push('[gallery-from-title] 타이틀 경유인데 「게임으로 돌아가기」가 노출됨');
  }
  await shot(page, '07-gallery-from-title.png');
  await page.close();
}

// ---- 6) OG 미리보기(소셜 카드 목업) ----
{
  const page = await browser.newPage({ viewport: { width: 760, height: 520 }, deviceScaleFactor: 2 });
  watch(page, 'og-preview');
  // og.png는 파일에서 읽어 data URI로 심는다 — about:blank(origin null)에서 로컬 서버로
  // 요청하면 Chromium의 Private Network Access 정책에 막힌다.
  const ogDataUri =
    'data:image/png;base64,' + readFileSync(resolve(repo, 'app/public/og.png')).toString('base64');
  await page.goto('about:blank');
  await page.setContent(
    `<!doctype html><meta charset="utf-8">
     <style>
       html,body{margin:0;height:100%;display:grid;place-items:center;
         background:#15181c;font:400 13px/1.5 -apple-system,"Segoe UI",sans-serif;color:#8b98a5}
       .card{width:600px;border:1px solid #2f3336;border-radius:16px;overflow:hidden;background:#000}
       .card img{display:block;width:100%;height:auto}
       .foot{padding:10px 14px;background:#16181c}
       .foot b{display:block;color:#e7e9ea;font-weight:700;font-size:15px;margin-bottom:2px}
       .foot p{margin:0;font-size:13px;color:#8b98a5;
         display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
       .foot span{font-size:12px}
     </style>
     <div class="card">
       <img src="${ogDataUri}" alt="og">
       <div class="foot">
         <span>lost-and-found-3f.vercel.app</span>
         <b>분실물 보관소, 3층 D열</b>
         <p>"잊고 싶은 일이 있으면 그 일과 얽힌 물건을 3층 D열에 맡겨라." 기억과 상실을 테마로 한 웹 비주얼노벨 데모 — 히로인 3인 분기·호감도·CG 갤러리·SD 전투 프리뷰.</p>
       </div>
     </div>`,
    { waitUntil: 'networkidle' },
  );
  await page.waitForTimeout(300);
  await shot(page, '08-og-preview.png');
  await page.close();
}

await browser.close();

// 원본 OG도 QA 폴더에 함께 남긴다
copyFileSync(resolve(repo, 'app/public/og.png'), resolve(outDir, '09-og-1200x630.png'));

for (const n of notes) console.log('(무해) ' + n);

if (problems.length) {
  console.error('콘솔/네트워크 문제 ' + problems.length + '건:');
  for (const p of problems) console.error(' - ' + p);
  process.exit(1);
}
console.log('QA 스크린샷 완료 — docs/qa/final3/ (콘솔 에러 0)');
