// 전투 코어 — React 비의존 순수 로직. docs/ARCHITECTURE.md §3 + docs/STORY.md §7.
// 화면(components/battle/BattleScreen.tsx)은 이 모듈이 낸 (state, events)만 소비해 연출한다.
//
// 승패 규약(STORY §7 공통 규칙을 수치로 옮긴 것):
//   - 적 HP = '검열 강도' 게이지. 0이 되면 잔상 재생 완주 → win.
//   - `roundLimit`(= STORY의 "N턴 버티기") 안에 검열 강도를 못 깎으면 잔상이 중간에 끊김 → lose.
//   - 파티 3인이 전부 쓰러져도 lose. 어느 쪽이든 게임오버는 없고 onLose 라벨로 스토리가 이어진다.

import type { BattleDef, BattleUnit, Skill } from '@/data/battles/battle01';

export type Rng = () => number;

/** 결정론 시뮬레이션·테스트용 시드 RNG (mulberry32). */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const GAUGE_MAX = 100;
export const GAUGE_ON_ATTACK = 10; // 일반공격(코스트 0) 사용 시
export const GAUGE_ON_HIT = 5; // 아군이 피격당했을 때

export type BattleOutcome = 'win' | 'lose';
export type Side = 'party' | 'enemy';

export interface UnitState {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  spd: number;
  side: Side;
}

export interface BattleState {
  defId: string;
  units: UnitState[];
  /** spd 내림차순 고정 로테이션(전투 중 재정렬 없음). */
  order: string[];
  turnIndex: number;
  round: number; // 1-based
  gauge: number;
  enemyActs: number; // 적 대사 순환용 카운터
  recovered: boolean; // recover 이벤트 1회성 소비 여부
  outcome: BattleOutcome | null;
}

export type BattleEvent =
  | { kind: 'act'; actorId: string; skillId: string; skillName: string; anim: 'attack' | 'skill'; sfx: string; fx?: 'flash' | 'shake' }
  | { kind: 'hit'; targetId: string; amount: number }
  | { kind: 'heal'; targetId: string; amount: number }
  | { kind: 'down'; unitId: string }
  | { kind: 'line'; who: string; text: string }
  | { kind: 'recover'; amount: number }
  | { kind: 'end'; outcome: BattleOutcome };

export interface TurnResult {
  state: BattleState;
  events: BattleEvent[];
}

function toUnitState(u: BattleUnit, side: Side): UnitState {
  return { id: u.id, name: u.name, hp: u.maxHp, maxHp: u.maxHp, spd: u.spd, side };
}

export function createBattleState(def: BattleDef): BattleState {
  const units = [...def.party.map((u) => toUnitState(u, 'party')), toUnitState(def.enemy, 'enemy')];
  const order = [...units].sort((a, b) => b.spd - a.spd).map((u) => u.id);
  return {
    defId: def.id,
    units,
    order,
    turnIndex: 0,
    round: 1,
    gauge: 0,
    enemyActs: 0,
    recovered: false,
    outcome: null,
  };
}

export function isAlive(u: UnitState): boolean {
  return u.hp > 0;
}

export function findUnit(state: BattleState, id: string): UnitState | undefined {
  return state.units.find((u) => u.id === id);
}

/** 지금 턴인 유닛. 쓰러진 유닛은 order에 남아 있어도 스킵된다. */
export function currentActor(state: BattleState): UnitState | null {
  if (state.outcome) return null;
  const id = state.order[state.turnIndex];
  const u = id ? findUnit(state, id) : undefined;
  return u && isAlive(u) ? u : null;
}

export function canUse(state: BattleState, skill: Skill): boolean {
  return state.gauge >= skill.cost;
}

export function partyAlive(state: BattleState): UnitState[] {
  return state.units.filter((u) => u.side === 'party' && isAlive(u));
}

export function enemyUnit(state: BattleState): UnitState {
  return state.units.find((u) => u.side === 'enemy')!;
}

/** power 기준 ±15% 롤. */
function roll(power: number, rng: Rng): number {
  return Math.max(1, Math.round(power * (0.85 + rng() * 0.3)));
}

function patch(state: BattleState, id: string, hp: number): BattleState {
  return { ...state, units: state.units.map((u) => (u.id === id ? { ...u, hp } : u)) };
}

function checkOutcome(def: BattleDef, state: BattleState): BattleState {
  if (state.outcome) return state;
  if (enemyUnit(state).hp <= 0) return { ...state, outcome: 'win' };
  if (partyAlive(state).length === 0) return { ...state, outcome: 'lose' };
  if (state.round > def.roundLimit) return { ...state, outcome: 'lose' };
  return state;
}

/** 아군 커맨드 실행. targetId 미지정이면 스킬 target에 따라 자동 결정. */
export function applySkill(def: BattleDef, state: BattleState, skill: Skill, rng: Rng): TurnResult {
  const actor = currentActor(state);
  if (!actor || actor.side !== 'party' || !canUse(state, skill)) return { state, events: [] };

  const events: BattleEvent[] = [
    { kind: 'act', actorId: actor.id, skillId: skill.id, skillName: skill.name, anim: skill.anim, sfx: skill.sfx, fx: skill.fx },
  ];
  let s: BattleState = { ...state, gauge: Math.max(0, state.gauge - skill.cost) };

  if (skill.target === 'enemy') {
    const enemy = enemyUnit(s);
    const amount = Math.min(enemy.hp, roll(skill.power, rng));
    s = patch(s, enemy.id, enemy.hp - amount);
    events.push({ kind: 'hit', targetId: enemy.id, amount });
    if (skill.cost === 0) s = { ...s, gauge: Math.min(GAUGE_MAX, s.gauge + GAUGE_ON_ATTACK) };
  } else {
    // 'ally' | 'allAllies' — 버프·힐은 파티 전원 회복으로 통일(§3 스킬 4종 고정 구성).
    for (const ally of partyAlive(s)) {
      const amount = Math.min(ally.maxHp - ally.hp, skill.power);
      if (amount <= 0) continue;
      s = patch(s, ally.id, ally.hp + amount);
      events.push({ kind: 'heal', targetId: ally.id, amount });
    }
  }

  s = checkOutcome(def, s);
  if (s.outcome) events.push({ kind: 'end', outcome: s.outcome });
  return { state: s, events };
}

/** 적 AI — HP 최저 타깃 60%, 나머지는 생존 아군 중 균등 랜덤. */
export function pickEnemyTarget(state: BattleState, rng: Rng): UnitState | null {
  const alive = partyAlive(state);
  if (alive.length === 0) return null;
  if (rng() < 0.6) {
    return alive.reduce((lo, u) => (u.hp < lo.hp ? u : lo), alive[0]);
  }
  return alive[Math.floor(rng() * alive.length) % alive.length];
}

/** 전투 대사 — 공통 대사 사이에 루트별 개인 대사 2줄을 끼워 순환. 마지막 라운드는 final 고정. */
export function enemyLine(def: BattleDef, state: BattleState): string | null {
  const lines = def.lines;
  if (!lines) return null;
  if (lines.final && state.round >= def.roundLimit) return lines.final;
  const pool = lines.personal?.length
    ? lines.enemy.flatMap((l, i) => (lines.personal![i] ? [l, lines.personal![i]] : [l]))
    : lines.enemy;
  return pool.length ? pool[state.enemyActs % pool.length] : null;
}

export function enemyAction(def: BattleDef, state: BattleState, rng: Rng): TurnResult {
  const actor = currentActor(state);
  if (!actor || actor.side !== 'enemy') return { state, events: [] };

  const skill = def.enemy.skills[0];
  const target = pickEnemyTarget(state, rng);
  if (!target) return { state, events: [] };

  const events: BattleEvent[] = [];
  const line = enemyLine(def, state);
  if (line) events.push({ kind: 'line', who: def.enemy.name, text: line });
  events.push({ kind: 'act', actorId: actor.id, skillId: skill.id, skillName: skill.name, anim: skill.anim, sfx: skill.sfx, fx: skill.fx });

  const amount = Math.min(target.hp, roll(skill.power, rng));
  let s = patch(state, target.id, target.hp - amount);
  s = { ...s, gauge: Math.min(GAUGE_MAX, s.gauge + GAUGE_ON_HIT), enemyActs: s.enemyActs + 1 };
  events.push({ kind: 'hit', targetId: target.id, amount });
  if (target.hp - amount <= 0) events.push({ kind: 'down', unitId: target.id });

  s = checkOutcome(def, s);
  if (s.outcome) events.push({ kind: 'end', outcome: s.outcome });
  return { state: s, events };
}

/** 턴 종료 — 다음 생존 유닛으로 로테이션. 한 바퀴 돌면 라운드 증가 + recover 이벤트 처리. */
export function endTurn(def: BattleDef, state: BattleState): TurnResult {
  if (state.outcome) return { state, events: [] };
  const events: BattleEvent[] = [];
  let s = state;

  for (let step = 0; step < s.order.length + 1; step += 1) {
    let idx = s.turnIndex + 1;
    let round = s.round;
    if (idx >= s.order.length) {
      idx = 0;
      round += 1;
    }
    s = { ...s, turnIndex: idx, round };
    if (round !== state.round && def.recover && !s.recovered && round === def.recover.round) {
      // 3턴째 '검열 강도' 회복 — 초조함 연출(STORY §7.2)
      const enemy = enemyUnit(s);
      const amount = Math.min(def.recover.amount, enemy.maxHp - enemy.hp);
      if (amount > 0) {
        s = patch(s, enemy.id, enemy.hp + amount);
        events.push({ kind: 'recover', amount });
      }
      s = { ...s, recovered: true };
    }
    const next = currentActor(s);
    if (next) break;
  }

  s = checkOutcome(def, s);
  if (s.outcome) events.push({ kind: 'end', outcome: s.outcome });
  return { state: s, events };
}

// ---------------------------------------------------------------------------
// 전투3(btl_true03) UI 박리 상태 기계 — 수치가 아니라 커맨드 횟수로 강제 진행한다.
// stripLevel: 0=온전, 1=적 HP바 소실, 2=히로인 스프라이트 소실+커맨드 3종 비활성.
// 마지막 단계(finalReady)에서 「내 이름을 말한다」를 고르면 level 3(전 UI 페이드아웃) 후 수렴.

export interface UnravelState {
  stage: number; // 0-based 현재 단계
  commands: number; // 현재 단계에서 소비한 커맨드 수
  stripLevel: number;
  finalReady: boolean;
}

export function createUnravelState(def: BattleDef): UnravelState {
  return { stage: 0, commands: 0, stripLevel: 0, finalReady: (def.unravel?.length ?? 0) <= 1 };
}

/** 커맨드 1회 소비. 단계 정원을 채우면 다음 단계로 넘어가며 박리 레벨이 올라간다. */
export function unravelAdvance(def: BattleDef, prev: UnravelState): UnravelState {
  const stages = def.unravel;
  if (!stages || stages.length === 0) return prev;
  const last = stages.length - 1;
  if (prev.stage >= last) return { ...prev, stripLevel: Math.min(prev.stage, 2), finalReady: true };

  const commands = prev.commands + 1;
  if (commands < stages[prev.stage].commands) return { ...prev, commands };
  const stage = prev.stage + 1;
  return { stage, commands: 0, stripLevel: Math.min(stage, 2), finalReady: stage >= last };
}

// ---------------------------------------------------------------------------
// 랜덤 정책 자동전투 — pipeline/scripts/battle_sim.mjs(밸런싱)와 유닛 테스트가 공유한다.

/** 사용 가능한 스킬 중 균등 랜덤으로 고르는 더미 정책. */
export function randomPolicy(state: BattleState, skills: Skill[], rng: Rng): Skill {
  const usable = skills.filter((s) => canUse(state, s));
  return usable[Math.floor(rng() * usable.length) % usable.length];
}

export function runRandomBattle(def: BattleDef, rng: Rng): { outcome: BattleOutcome; rounds: number } {
  let s = createBattleState(def);
  let guard = 0;
  while (!s.outcome && guard++ < 500) {
    const actor = currentActor(s);
    if (!actor) {
      s = endTurn(def, s).state;
      continue;
    }
    if (actor.side === 'party') {
      const unit = def.party.find((u) => u.id === actor.id)!;
      s = applySkill(def, s, randomPolicy(s, unit.skills, rng), rng).state;
    } else {
      s = enemyAction(def, s, rng).state;
    }
    if (s.outcome) break;
    s = endTurn(def, s).state;
  }
  return { outcome: s.outcome ?? 'lose', rounds: s.round };
}
