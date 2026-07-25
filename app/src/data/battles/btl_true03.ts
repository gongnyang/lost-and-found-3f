// 전투3 「검열자·본체」 — docs/STORY.md §7.3 (true1s04). UI 3단 박리(ui_strip_level)와
// 마지막 커맨드 「내 이름을 말한다」로의 축소는 씬 스크립트의 set/fx(uiStrip)/choice
// 커맨드가 담당한다(P3C 실 턴제 로직 전까지는 battle 데이터에 반영할 대상이 없음).
// party는 기존 구조를 유지하되, 3단계 종료 시 스크립트가 히로인 스프라이트를 전부
// hide하므로 실제 화면상 파티는 사라진 것처럼 보인다("하람은 파티에 없다" — 관측자 배치).

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
  name: '내 이름을 말한다', // 3단계 진입 후 유일하게 활성인 커맨드(STORY.md §7.3) — 나머지 3종은 회색 처리 대상
  power: 0,
  cost: 0,
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

export const btl_true03: BattleDef = {
  id: 'btl_true03',
  party: [unit('sea', '문세아', 100, 12), unit('riwon', '백리원', 90, 15), unit('yunseul', '강윤슬', 95, 10)],
  enemy: {
    id: 'censor_true03',
    name: '검열자·본체',
    maxHp: 200, // 3단계 스크립트 이벤트 강제 진행(수치 무관) — 자리표시 값
    spd: 10,
    sheet: '/assets/sd/aoi/sheet.svg',
    manifest: '/assets/sd/aoi/manifest.json',
    skills: [basicAttack],
  },
};
