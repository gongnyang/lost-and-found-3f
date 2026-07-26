// 전투3 「검열자·본체」 — docs/STORY.md §7.3 (true1s04). UI 3단 박리는 `unravel` 단계
// 정의로 전투 화면이 직접 수행한다(커맨드 횟수로 강제 진행, 수치 무관). 2단계부터 히로인
// 스프라이트가 파티에서 사라지고("셋은 처음부터 여기에 없었다"), 마지막 단계에서는 커맨드
// 4종 중 「내 이름을 말한다」 하나만 활성이며 선택 시 승패 구분 없이 true1s05로 수렴한다.

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
  name: '검열자·본체',
  enemyShape: 'self',
  roundLimit: 99, // 수치 무관 — 진행은 unravel 단계(커맨드 횟수)가 강제한다
  party: [unit('sea', '문세아', 100, 12), unit('riwon', '백리원', 90, 15), unit('yunseul', '강윤슬', 95, 10)],
  enemy: {
    id: 'censor_true03',
    name: '검열자',
    maxHp: 200, // 깎이지만 0이 되기 전에 3단계가 끝난다
    spd: 10,
    sheet: '/assets/sd/aoi/sheet.svg',
    manifest: '/assets/sd/aoi/manifest.json',
    skills: [{ ...basicAttack, power: 8 }],
  },
  // UI 박리 3단 — 검열자 대사 궤적은 STORY §7.3 표 그대로.
  unravel: [
    { commands: 2, line: '보지 마.', note: '적의 HP바가 사라졌다. 그 자리가 비었다.' },
    { commands: 2, line: '네가 부탁했잖아.', note: '셋은 처음부터 여기에 없었다.' },
    { commands: 1, line: '…네가 맡겼잖아. 3년 전에.', note: '고를 수 있는 칸은 하나뿐이었다.' },
  ],
};
