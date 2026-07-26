// 전투 정의 스키마 — docs/ARCHITECTURE.md §3 정본 + STORY.md §7이 요구하는 필드 보강
// (name / roundLimit / recover / lines / unravel / enemyShape). 실행 로직은 engine/battle.ts,
// 화면은 components/battle/BattleScreen.tsx. battle01 자체는 스크립트가 참조하지 않는
// 개발용 연습 전투(스키마 레퍼런스 겸용).

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

/** 전투 중 적(검열자) 대사 — STORY §7.2. 공통 대사 사이에 루트별 개인 2줄이 끼어든다. */
export interface BattleLines {
  enemy: string[];
  personal?: string[];
  final?: string; // 마지막 라운드 한정
}

/** 전투3 UI 박리 단계 — 수치 무관, 커맨드 횟수로 강제 진행(STORY §7.3). */
export interface UnravelStage {
  commands: number;
  line: string; // 단계 진입 시 검열자 대사
  note: string; // 단계 진입 시 지문(자막)
}

export interface BattleDef {
  id: string;
  name: string; // 화면 표기용 전투명
  party: BattleUnit[];
  enemy: BattleUnit;
  /** STORY §7의 "N턴 버티기". 이 라운드 안에 검열 강도를 0으로 못 만들면 잔상이 끊긴다(lose). */
  roundLimit: number;
  /** 지정 라운드에 검열 강도가 한 번 회복되는 스크립트 이벤트. */
  recover?: { round: number; amount: number };
  lines?: BattleLines;
  unravel?: UnravelStage[];
  /** 적 전용 SD 시트가 없어 CSS 실루엣으로 표현한다 — 형태 프리셋. */
  enemyShape: 'scribble' | 'figure' | 'self';
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
  name: '연습 전투',
  enemyShape: 'scribble',
  roundLimit: 6,
  party: [unit('sea', '문세아', 100, 12), unit('riwon', '백리원', 90, 15), unit('yunseul', '강윤슬', 95, 10)],
  enemy: {
    id: 'enemy_boss1',
    name: '???',
    maxHp: 200,
    spd: 8,
    sheet: '/assets/sd/aoi/sheet.svg', // 미사용(적은 CSS 실루엣) — 스키마 필수 필드라 유지
    manifest: '/assets/sd/aoi/manifest.json',
    skills: [{ ...basicAttack, power: 16 }],
  },
};
