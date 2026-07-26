// P3C 전투 실플레이 QA — 새 게임 → c1 스킵 진행 → btl_common01 진입 → 커맨드 선택 →
// 공격 연출 → 승리 → /play 복귀까지를 실제 브라우저로 통과시키고 스크린샷 3장을 남긴다.
// 콘솔 에러·페이지 에러가 1건이라도 있으면 exit 1.
//
// 실행: (별도 셸에서) cd app && npx next start -p 3211
//       node pipeline/scripts/qa_battle.mjs http://localhost:3211
// 출력: docs/qa/battle/*.png

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const { chromium } = createRequire(resolve(repo, 'app/package.json'))('playwright');

const base = process.argv[2] ?? 'http://localhost:3211';
const outDir = resolve(repo, 'docs/qa/battle');
mkdirSync(outDir, { recursive: true });

const problems = [];
const notes = [];
// 사용자 제스처 전 오디오 생성 경고는 실플레이에서 발생하지 않는다 — 기록만.
const BENIGN = [/AudioContext was not allowed to start/, /play\(\) failed because the user/];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
page.on('console', (m) => {
  const type = m.type();
  if (type !== 'error' && type !== 'warning') return;
  const line = `console.${type}: ${m.text()}`;
  (BENIGN.some((re) => re.test(m.text())) ? notes : problems).push(line);
});
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('requestfailed', (r) => {
  const err = r.failure()?.errorText ?? '';
  // 씬 프리로더가 띄운 표정 이미지 요청은 /battle로 라우팅되는 순간 취소된다 — 실패가 아니다.
  const line = `requestfailed: ${r.url()} — ${err}`;
  (err.includes('ERR_ABORTED') ? notes : problems).push(line);
});

const shot = (name) => page.screenshot({ path: resolve(outDir, name) });

// ---- 1) 새 게임 → 전투1 진입까지 스킵 진행 ----
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: '새 게임' }).click();
await page.waitForURL('**/play');

for (let i = 0; i < 400 && !page.url().includes('/battle'); i += 1) {
  if (await page.locator('.nameinput-panel').isVisible().catch(() => false)) {
    await page.locator('.nameinput-field').fill('하람');
    await page.locator('.nameinput-confirm').click();
  } else if (await page.locator('.choice-menu').isVisible().catch(() => false)) {
    // 선택 확정 애니메이션 동안 버튼이 disabled로 바뀐다 — 짧게 시도하고 넘어간다.
    await page
      .locator('.choice-btn')
      .first()
      .click({ timeout: 1500 })
      .catch(() => {});
    await page.waitForTimeout(500);
  } else {
    await page.locator('.dialogue-box').click({ timeout: 3000 }).catch(() => {});
  }
  await page.waitForTimeout(60);
}

if (!page.url().includes('/battle')) {
  problems.push(`전투 진입 실패 — 최종 URL ${page.url()}`);
} else {
  await page.waitForSelector('.battle-command-menu', { timeout: 5000 });
  await page.waitForTimeout(500);
  await shot('01-battle-command.png');

  // ---- 2) 커맨드 선택 → 공격 연출 (임팩트 순간을 잡는다) ----
  const attack = page.getByRole('button', { name: /일반공격/ });
  await attack.click();
  await page.waitForTimeout(300); // IMPACT_MS 직후 = 백스텝 + 적색 플래시 + HP바 트윈
  await shot('02-battle-impact.png');

  // ---- 3) 승리까지 일반공격 반복 → 결과 배너 ----
  // 커맨드 1회당 연출이 약 1~2초(적 턴 포함) — 3라운드 9커맨드를 다 소화할 만큼 여유를 준다.
  for (let i = 0; i < 120; i += 1) {
    if (await page.locator('.battle-result').isVisible().catch(() => false)) break;
    if (await attack.isEnabled().catch(() => false)) await attack.click().catch(() => {});
    await page.waitForTimeout(300);
  }
  await page.waitForSelector('.battle-result', { timeout: 15000 });
  const verdict = (await page.locator('.battle-result-label').innerText()).trim();
  if (verdict !== '잔상 재생 완주') problems.push(`승리하지 못했다 — 결과: ${verdict}`);
  await page.waitForTimeout(400);
  await shot('03-battle-victory.png');

  // ---- 4) /play 복귀 ----
  await page.getByRole('button', { name: '계속하기' }).click();
  await page.waitForURL('**/play', { timeout: 5000 });
  await page.waitForTimeout(600);
  const dialogue = await page.locator('.dialogue-box').isVisible().catch(() => false);
  if (!dialogue) problems.push('/play 복귀 후 대사창이 보이지 않는다');
  console.log(`결과: ${verdict} · 복귀 URL ${page.url()}`);
}

// ---- 5) 전투3 특수전투 — UI 3단 박리 → 커맨드 1개 수렴 (?id= QA 경로) ----
await page.goto(base + '/battle?id=btl_true03', { waitUntil: 'networkidle' });
await page.waitForSelector('.battle-command-menu', { timeout: 5000 });
const screen = page.locator('.battle-screen');
const strip = () => screen.getAttribute('data-strip');

if ((await strip()) !== '0') problems.push(`전투3 시작 박리 레벨이 0이 아니다 — ${await strip()}`);
for (let i = 0; i < 4; i += 1) {
  const btn = page.locator('.battle-command-btn:not([disabled])').first();
  await btn.click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(2600); // 연출 + 단계 지문 노출
  if (i === 1) {
    if ((await strip()) !== '1') problems.push(`1단계 종료 후 박리 레벨 1이 아니다 — ${await strip()}`);
    if (await page.locator('.battle-hp-row--enemy').isVisible().catch(() => false)) {
      problems.push('1단계 종료 후에도 적 HP바가 남아 있다');
    }
    await shot('04-battle-unravel-1.png');
  }
}
if ((await strip()) !== '2') problems.push(`2단계 종료 후 박리 레벨 2가 아니다 — ${await strip()}`);
if (await page.locator('.battle-party').isVisible().catch(() => false)) {
  problems.push('2단계 종료 후에도 히로인 스프라이트가 남아 있다');
}
const enabled = page.locator('.battle-command-btn:not([disabled])');
if ((await enabled.count()) !== 1) problems.push(`마지막 단계 활성 커맨드가 1개가 아니다 — ${await enabled.count()}개`);
const finalLabel = (await enabled.first().innerText()).replace(/\s+/g, ' ').trim();
if (!finalLabel.includes('내 이름을 말한다')) problems.push(`마지막 커맨드 라벨이 다르다 — ${finalLabel}`);
await shot('05-battle-unravel-final.png');

await enabled.first().click();
await page.waitForURL('**/play', { timeout: 6000 }).catch(() => problems.push('전투3 수렴 후 /play로 복귀하지 않았다'));
console.log(`전투3: 박리 3단 통과 · 최종 커맨드 「${finalLabel}」 · 복귀 URL ${page.url()}`);

await browser.close();
if (notes.length) console.log('\n[무시한 경고]\n' + notes.slice(0, 5).join('\n'));
if (problems.length) {
  console.error('\n[문제]\n' + problems.join('\n'));
  process.exit(1);
}
console.log('\nOK — 콘솔 에러 0, 스크린샷 5장: docs/qa/battle/');
