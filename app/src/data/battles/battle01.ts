// 전투 정의 — docs/ARCHITECTURE.md §3 스키마 그대로. 지금 단계는 SpritePlayer 스텁이
// manifest를 소비하는 것만 검증하는 목적이라 밸런싱 수치는 자리표시자.

export interface Skill {
  id: string;
  name: string;
  power: number;
  cost: number; // 파티 공유 게이지(0~100, 일반공격/피격 시 +10/+5)
  target: 'enemy' | 'ally' | 'allAllies';
  anim: 'attack' | 'skill';
  sfx: string;
  fx?: 'flash' | 'shake';
}

export interface BattleUnit {
  id: string;
  name: string;
  maxHp: number;
  spd: number;
  sheet: string; // /assets/sd/{id}/sheet.webp — 실제 SD 시트
  manifest: string; // SpritePlayer 소비용 manifest.app.json 경로 (actions.{idle,attack}.frames)
  skills: Skill[]; // 아군 4종 고정: 일반공격/강공격(게이지)/버프·힐/필살기
}

export interface BattleDef {
  id: string;
  party: BattleUnit[];
  enemy: BattleUnit;
}

const basicAttack: Skill = {
  id: 'attack',
  name: '일반공격',
  power: 10,
  cost: 0,
  target: 'enemy',
  anim: 'attack',
  sfx: '/assets/audio/sfx/hit.ogg',
};

const heavyAttack: Skill = {
  id: 'heavy',
  name: '강공격',
  power: 22,
  cost: 40,
  target: 'enemy',
  anim: 'skill',
  sfx: '/assets/audio/sfx/heavy.ogg',
  fx: 'shake',
};

const partyHeal: Skill = {
  id: 'heal',
  name: '버프·힐',
  power: 15,
  cost: 30,
  target: 'allAllies',
  anim: 'skill',
  sfx: '/assets/audio/sfx/heal.ogg',
};

const ultimate: Skill = {
  id: 'ultimate',
  name: '필살기',
  power: 40,
  cost: 100,
  target: 'enemy',
  anim: 'skill',
  sfx: '/assets/audio/sfx/ultimate.ogg',
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

export const battle01: BattleDef = {
  id: 'battle01',
  party: [unit('sea', '문세아', 100, 12), unit('riwon', '백리원', 90, 15), unit('yunseul', '강윤슬', 95, 10)],
  enemy: {
    id: 'enemy_boss1',
    name: '???',
    maxHp: 260,
    spd: 8,
    sheet: '/assets/sd/aoi/sheet.svg', // 보스 시트 없음 — 기존 SVG 플레이스홀더(sd/aoi, 유지) 재사용
    manifest: '/assets/sd/aoi/manifest.json',
    skills: [basicAttack],
  },
};
