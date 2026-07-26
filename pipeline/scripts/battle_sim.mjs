#!/usr/bin/env node
// 전투 밸런스 시뮬레이터 — 일반 전투 3종을 랜덤 정책으로 N회(기본 1000) 자동 전투시켜
// 승률이 목표 밴드(60~85%)에 있는지 확인한다. 코어는 app/src/engine/battle.ts를 그대로
// 쓰므로 실제 플레이와 동일한 규칙으로 돈다.
//
// 실행: cd app && npx tsx ../pipeline/scripts/battle_sim.mjs [runs]
// 밴드를 벗어나면 exit 1 — 데이터(app/src/data/battles/*.ts)의 maxHp/power를 조정하고 재실행.

import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(here, '../../app');

const { runRandomBattle, seededRng } = await import(
  pathToFileURL(join(APP_ROOT, 'src', 'engine', 'battle.ts')).href
);
const { BATTLES, BALANCED_BATTLE_IDS } = await import(
  pathToFileURL(join(APP_ROOT, 'src', 'data', 'battles', 'index.ts')).href
);

const RUNS = Number(process.argv[2] ?? 1000);
const BAND = [0.6, 0.85];

let failed = false;
console.log(`전투 밸런스 시뮬레이션 — ${RUNS}회 / 랜덤 정책 / 목표 승률 밴드 ${BAND[0] * 100}~${BAND[1] * 100}%\n`);

for (const id of BALANCED_BATTLE_IDS) {
  const def = BATTLES[id];
  const rng = seededRng(0x5eed ^ [...id].reduce((a, c) => a + c.charCodeAt(0), 0));
  let wins = 0;
  let rounds = 0;
  for (let i = 0; i < RUNS; i += 1) {
    const r = runRandomBattle(def, rng);
    if (r.outcome === 'win') wins += 1;
    rounds += r.rounds;
  }
  const rate = wins / RUNS;
  const ok = rate >= BAND[0] && rate <= BAND[1];
  if (!ok) failed = true;
  console.log(
    `${ok ? 'OK  ' : 'FAIL'} ${id.padEnd(14)} 승률 ${(rate * 100).toFixed(1)}%` +
      `  (${wins}/${RUNS})  평균 ${(rounds / RUNS).toFixed(2)}라운드` +
      `  [적 HP ${def.enemy.maxHp} / 적 power ${def.enemy.skills[0].power} / roundLimit ${def.roundLimit}]`
  );
}

process.exit(failed ? 1 : 0);
