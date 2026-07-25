// 전투2 「그만 봐, 너 다쳐」(세아형) — docs/STORY.md §7.2 (sea2s01). 3루트 공유 스크립트,
// 적 스킨·목소리만 다름(개인 대사 차등은 씬 스크립트 쪽 대사에서 처리). 목표: 5턴 버티기,
// 3턴째 검열 강도 회복 이벤트(밸런싱/이벤트 로직은 P3C 후속).

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

export const btl_sea02: BattleDef = {
  id: 'btl_sea02',
  party: [unit('sea', '문세아', 100, 12), unit('riwon', '백리원', 90, 15), unit('yunseul', '강윤슬', 95, 10)],
  enemy: {
    id: 'censor_sea02',
    name: '검열자·세아형',
    maxHp: 180, // 5턴 버티기 + 3턴째 강도 회복 이벤트 감안한 상향(밸런싱 후속)
    spd: 11,
    sheet: '/assets/sd/aoi/sheet.svg', // 전용 시트 없음 — 플레이스홀더 재사용
    manifest: '/assets/sd/aoi/manifest.json',
    skills: [basicAttack],
  },
};
