// 전투2 「그만 봐, 너 다쳐」(윤슬형) — docs/STORY.md §7.2 (yun2s01). btl_sea02와 구조 동일,
// 적 스킨만 윤슬형으로 교체. 개인 대사 차등은 씬 스크립트 대사에서 처리.

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

export const btl_yun02: BattleDef = {
  id: 'btl_yun02',
  name: '그만 봐, 너 다쳐',
  enemyShape: 'figure',
  roundLimit: 5,
  recover: { round: 3, amount: 20 },
  party: [unit('sea', '문세아', 100, 12), unit('riwon', '백리원', 90, 15), unit('yunseul', '강윤슬', 95, 10)],
  enemy: {
    id: 'censor_yun02',
    name: '검열자·윤슬형',
    maxHp: 100,
    spd: 11,
    sheet: '/assets/sd/aoi/sheet.svg',
    manifest: '/assets/sd/aoi/manifest.json',
    skills: [{ ...basicAttack, power: 16 }],
  },
  lines: {
    enemy: ['그만 봐.', '너 다쳐.', '이건 네 거 아니야.'],
    personal: ['여기까지만 해요.', '제가 만든 거예요.'],
    final: '…미안해.',
  },
};
