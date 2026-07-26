// sea2s01 전투 복귀 회귀 QA — 「[battle btl_sea02] 뒤 8줄이 도달 불가」 버그의 실플레이 확인.
// 슬롯0에 sea2s01 진입 세이브를 심고 「이어하기」로 들어가 → 전투 승리 → /play 복귀 후
// 검열자 대사 「오빠, 듣지 마.」~「이건 네 거 아니야.」가 실제로 재생되는지 본다.
//
// 실행: (별도 셸에서) cd app && npx next start -p 3212
//       node pipeline/scripts/qa_sea_battle_return.mjs http://localhost:3212
// 출력: docs/qa/battle/sea2s01-fix.png

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const { chromium } = createRequire(resolve(repo, 'app/package.json'))('playwright');

const base = process.argv[2] ?? 'http://localhost:3212';
const outDir = resolve(repo, 'docs/qa/battle');
mkdirSync(outDir, { recursive: true });

// 전투 복귀 직후 재생돼야 할 원고 8줄(sea2s01.md #57~#64) 중 대사 6줄.
const EXPECTED = [
  '오빠, 듣지 마.',
  '너 다쳐.',
  '물방울 소리가 격자 안쪽에서 났다',
  '그 소리 나빠요.',
  '나 저런 말 한 적 없는데',
  '이건 네 거 아니야.',
];

const problems = [];
const BENIGN = [/AudioContext was not allowed to start/, /play\(\) failed because the user/];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  if (!BENIGN.some((re) => re.test(m.text()))) problems.push(`console.error: ${m.text()}`);
});
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

// ---- 1) sea2s01 진입 세이브를 슬롯0에 심고 「이어하기」 ----
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.setItem(
    'miyensi:save:0',
    JSON.stringify({
      ver: 2,
      sceneId: 'sea2s01',
      sceneTitle: '잡음',
      cursor: 0,
      flags: { aff_sea: 8, aff_riwon: 2, aff_yunseul: 2, last_choice: 1, route_id: 1 },
      stage: [],
      speaker: null,
      // 로드는 스냅샷 hydrate만 하고 advance를 돌리지 않는다(state.loadFromSlot) — 대사창이
      // 떠 있어야 첫 클릭이 커서 0부터 진행된다. 그래서 자리표시 대사를 하나 넣어 둔다.
      dialogue: { who: null, text: '(QA 진입)' },
      choice: null,
      bg: null,
      bgm: null,
      cg: null,
      cgUnlocked: [],
      settings: { textSpeedMs: 0, bgmVolume: 0, sfxVolume: 0 },
      mcName: '하람',
      savedAt: new Date().toISOString(),
    }),
  );
});
await page.reload({ waitUntil: 'networkidle' });
await page.getByRole('button', { name: '이어하기' }).click();
await page.waitForURL('**/play');

// ---- 2) 전투 진입까지 클릭 진행 ----
for (let i = 0; i < 200 && !page.url().includes('/battle'); i += 1) {
  if (await page.locator('.choice-menu').isVisible().catch(() => false)) {
    await page.locator('.choice-btn').first().click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(500);
  } else {
    await page.locator('.dialogue-box').click({ timeout: 3000 }).catch(() => {});
  }
  await page.waitForTimeout(50);
}
if (!page.url().includes('/battle')) {
  problems.push(`btl_sea02 진입 실패 — 최종 URL ${page.url()}`);
  await browser.close();
  console.error('\n[문제]\n' + problems.join('\n'));
  process.exit(1);
}

// ---- 3) 승리 ----
await page.waitForSelector('.battle-command-menu', { timeout: 8000 });
const attack = page.getByRole('button', { name: /일반공격/ });
for (let i = 0; i < 160; i += 1) {
  if (await page.locator('.battle-result').isVisible().catch(() => false)) break;
  if (await attack.isEnabled().catch(() => false)) await attack.click().catch(() => {});
  await page.waitForTimeout(300);
}
await page.waitForSelector('.battle-result', { timeout: 15000 });
const verdict = (await page.locator('.battle-result-label').innerText()).trim();
if (verdict !== '잔상 재생 완주') problems.push(`승리하지 못했다 — 결과: ${verdict}`);
await page.getByRole('button', { name: '계속하기' }).click();
await page.waitForURL('**/play', { timeout: 6000 });

// ---- 4) 복귀 후 대사 수집 — 8줄 구간이 실제로 재생되는지 ----
// 복귀 첫 줄을 놓치지 않도록 대사창이 실제로 그려질 때까지 기다린 뒤 읽기 시작한다.
await page.waitForFunction(
  () => (document.querySelector('.dialogue-text')?.textContent ?? '').trim().length > 0,
  { timeout: 8000 },
);
const seen = [];
let shotTaken = false;
for (let i = 0; i < 60; i += 1) {
  const text = await page.locator('.dialogue-text').innerText().catch(() => '');
  const line = text.replace(/\s+/g, ' ').trim();
  if (line && seen[seen.length - 1] !== line) seen.push(line);
  if (!shotTaken && line.includes('오빠, 듣지 마')) {
    await page.waitForTimeout(300);
    await page.screenshot({ path: resolve(outDir, 'sea2s01-fix.png') });
    shotTaken = true;
  }
  if (seen.some((l) => l.includes('미안해'))) break; // label win 진입 = 8줄 구간 통과
  await page.locator('.dialogue-box').click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(200);
}

for (const want of EXPECTED) {
  if (!seen.some((l) => l.includes(want))) problems.push(`전투 복귀 후 미재생: "${want}"`);
}
if (!shotTaken) problems.push('스크린샷 지점(「오빠, 듣지 마.」)에 도달하지 못했다');

await browser.close();
console.log(`결과: ${verdict} · 복귀 후 재생 ${seen.length}줄`);
console.log(seen.slice(0, 12).map((l, i) => `  ${i + 1}. ${l.slice(0, 40)}`).join('\n'));
if (problems.length) {
  console.error('\n[문제]\n' + problems.join('\n'));
  process.exit(1);
}
console.log('\nOK — 전투 복귀 8줄 구간 전부 재생 · docs/qa/battle/sea2s01-fix.png');
