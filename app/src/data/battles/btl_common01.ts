// 전투1 「검열자」 — docs/STORY.md §7.1 (공통 1장 / c1s05). 목표: 3턴 버티기(격파 아님,
// 적 HP는 '검열 강도' 게이지). 적 3체(검열자·낙서 ×3)는 "검열 강도" 공유 게이지 하나로
// 표현(§7 공통 규칙). 수치는 pipeline/scripts/battle_sim.mjs 1000회 랜덤 정책 승률로 조정.

import type { BattleDef, BattleUnit, Skill } from './battle01';

const basicAttack: Skill = {
  id: 'attack',
  name: '일반공격',
  power: 10,
  cost: 0,
  target: 'enemy',
  anim: 'attack',
  sfx: '/assets/audio/sfx/hit-1.ogg',
};

const heavyAttack: Skill = {
  id: 'heavy',
  name: '강공격',
  power: 22,
  cost: 40,
  target: 'enemy',
  anim: 'skill',
  sfx: '/assets/audio/sfx/hit-2.ogg',
  fx: 'shake',
};

const partyHeal: Skill = {
  id: 'heal',
  name: '버프·힐',
  power: 15,
  cost: 30,
  target: 'allAllies',
  anim: 'skill',
  sfx: '/assets/audio/sfx/buff-heal.ogg',
};

const ultimate: Skill = {
  id: 'ultimate',
  name: '필살기',
  power: 40,
  cost: 100,
  target: 'enemy',
  anim: 'skill',
  sfx: '/assets/audio/sfx/victory-fanfare.ogg',
  fx: 'flash',
};

function unit(id: 'sea' | 'riwon' | 'yunseul', name: string, maxHp: number, spd: number): BattleUnit {
  return {
    id,
    name,
    maxHp,
    spd,
    sheet: `/assets/sd/${id}/sheet.webp`,
    manifest: `/assets/sd/${id}/manifest.app.json`,
    skills: [basicAttack, heavyAttack, partyHeal, ultimate],
  };
}

export const btl_common01: BattleDef = {
  id: 'btl_common01',
  name: '검열자',
  enemyShape: 'scribble',
  roundLimit: 3, // 3턴 버티기 — 그 안에 검열 강도를 0으로 못 만들면 잔상이 90%에서 끊긴다
  party: [unit('sea', '문세아', 100, 12), unit('riwon', '백리원', 90, 15), unit('yunseul', '강윤슬', 95, 10)],
  enemy: {
    id: 'censor_common01',
    name: '검열자·낙서 ×3',
    maxHp: 70, // battle_sim.mjs 1000회 랜덤 정책 기준 승률 60~85% 밴드에 맞춘 값
    spd: 9,
    sheet: '/assets/sd/aoi/sheet.svg', // 미사용(적은 CSS 실루엣) — 스키마 필수 필드라 유지
    manifest: '/assets/sd/aoi/manifest.json',
    skills: [{ ...basicAttack, power: 14 }],
  },
  // 코믹 톤 — 검열자는 단어만 뱉는다(STORY §7.1)
  lines: { enemy: ['■■■.', '지워.', '보지 마.'] },
};
