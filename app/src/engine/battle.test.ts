// 전투 코어 유닛 테스트 — 턴 순서 / 게이지 / 스킬 코스트 / 승패 판정 / 전투3 수렴.

import { describe, expect, it } from 'vitest';
import {
  GAUGE_MAX,
  GAUGE_ON_ATTACK,
  GAUGE_ON_HIT,
  applySkill,
  canUse,
  createBattleState,
  createUnravelState,
  currentActor,
  endTurn,
  enemyAction,
  enemyLine,
  enemyUnit,
  pickEnemyTarget,
  runRandomBattle,
  seededRng,
  unravelAdvance,
} from './battle';
import { btl_common01 } from '@/data/battles/btl_common01';
import { btl_sea02 } from '@/data/battles/btl_sea02';
import { btl_true03 } from '@/data/battles/btl_true03';
import { BALANCED_BATTLE_IDS, BATTLES } from '@/data/battles';

const fixed = (v: number) => () => v;

describe('턴 순서', () => {
  it('spd 내림차순 고정 로테이션', () => {
    const s = createBattleState(btl_common01);
    expect(s.order).toEqual(['riwon', 'sea', 'yunseul', 'censor_common01']);
    expect(currentActor(s)?.id).toBe('riwon');
  });

  it('적 spd가 더 빠르면 아군 사이에 끼어든다', () => {
    expect(createBattleState(btl_sea02).order).toEqual(['riwon', 'sea', 'censor_sea02', 'yunseul']);
  });

  it('한 바퀴 돌면 라운드가 증가한다', () => {
    let s = createBattleState(btl_common01);
    for (let i = 0; i < 4; i += 1) s = endTurn(btl_common01, s).state;
    expect(s.round).toBe(2);
    expect(currentActor(s)?.id).toBe('riwon');
  });

  it('쓰러진 유닛은 로테이션에서 건너뛴다', () => {
    let s = createBattleState(btl_common01);
    s = { ...s, units: s.units.map((u) => (u.id === 'sea' ? { ...u, hp: 0 } : u)) };
    s = endTurn(btl_common01, s).state; // riwon -> (sea 스킵) -> yunseul
    expect(currentActor(s)?.id).toBe('yunseul');
  });
});

describe('게이지·스킬 코스트', () => {
  const [attack, heavy, heal, ultimate] = btl_common01.party[0].skills;

  it('일반공격은 게이지를 +10 쌓는다', () => {
    const s = createBattleState(btl_common01);
    expect(applySkill(btl_common01, s, attack, fixed(0.5)).state.gauge).toBe(GAUGE_ON_ATTACK);
  });

  it('게이지가 모자라면 커맨드를 쓸 수 없고 상태도 안 변한다', () => {
    const s = createBattleState(btl_common01);
    expect(canUse(s, heavy)).toBe(false);
    expect(canUse(s, heal)).toBe(false);
    expect(canUse(s, ultimate)).toBe(false);
    expect(applySkill(btl_common01, s, ultimate, fixed(0.5)).state).toBe(s);
  });

  it('코스트만큼 차감된다', () => {
    const s = { ...createBattleState(btl_common01), gauge: 60 };
    expect(applySkill(btl_common01, s, heavy, fixed(0.5)).state.gauge).toBe(20);
  });

  it('피격 시 게이지가 +5 쌓이고 100을 넘지 않는다', () => {
    let s = createBattleState(btl_sea02);
    s = { ...s, turnIndex: s.order.indexOf('censor_sea02') };
    expect(enemyAction(btl_sea02, s, fixed(0.5)).state.gauge).toBe(GAUGE_ON_HIT);
    const full = enemyAction(btl_sea02, { ...s, gauge: 98 }, fixed(0.5)).state;
    expect(full.gauge).toBe(GAUGE_MAX);
  });

  it('버프·힐은 파티 전원 HP를 회복하고 최대치를 넘지 않는다', () => {
    let s = createBattleState(btl_common01);
    s = { ...s, gauge: 30, units: s.units.map((u) => (u.side === 'party' ? { ...u, hp: u.maxHp - 5 } : u)) };
    const after = applySkill(btl_common01, s, heal, fixed(0.5)).state;
    expect(after.units.filter((u) => u.side === 'party').every((u) => u.hp === u.maxHp)).toBe(true);
  });
});

describe('적 AI', () => {
  it('60% 확률 구간에서는 HP 최저 아군을 노린다', () => {
    let s = createBattleState(btl_common01);
    s = { ...s, units: s.units.map((u) => (u.id === 'yunseul' ? { ...u, hp: 3 } : u)) };
    expect(pickEnemyTarget(s, fixed(0.1))?.id).toBe('yunseul');
  });

  it('나머지 구간에서는 생존 아군 중에서 고른다', () => {
    const s = createBattleState(btl_common01);
    const picked = pickEnemyTarget(s, fixed(0.9));
    expect(['sea', 'riwon', 'yunseul']).toContain(picked?.id);
  });
});

describe('승패 판정', () => {
  it('검열 강도가 0이 되면 win', () => {
    let s = createBattleState(btl_common01);
    s = { ...s, units: s.units.map((u) => (u.side === 'enemy' ? { ...u, hp: 1 } : u)) };
    const res = applySkill(btl_common01, s, btl_common01.party[0].skills[0], fixed(0.5));
    expect(res.state.outcome).toBe('win');
    expect(res.events.at(-1)).toEqual({ kind: 'end', outcome: 'win' });
  });

  it('roundLimit을 넘기면 lose', () => {
    let s = createBattleState(btl_common01);
    while (!s.outcome) s = endTurn(btl_common01, s).state; // 아무도 공격하지 않고 턴만 넘기면 시간 초과
    expect(s.outcome).toBe('lose');
    expect(s.round).toBe(btl_common01.roundLimit + 1);
  });

  it('파티 전멸이면 lose', () => {
    let s = createBattleState(btl_sea02);
    s = {
      ...s,
      turnIndex: s.order.indexOf('censor_sea02'),
      units: s.units.map((u) => (u.side === 'party' ? { ...u, hp: u.id === 'sea' ? 1 : 0 } : u)),
    };
    expect(enemyAction(btl_sea02, s, fixed(0.1)).state.outcome).toBe('lose');
  });

  it('recover 이벤트는 지정 라운드에 한 번만 검열 강도를 회복시킨다', () => {
    let s = createBattleState(btl_sea02);
    s = { ...s, units: s.units.map((u) => (u.side === 'enemy' ? { ...u, hp: 40 } : u)) };
    const events = [];
    while (s.round < 4 && !s.outcome) {
      const r = endTurn(btl_sea02, s);
      events.push(...r.events);
      s = r.state;
    }
    expect(events.filter((e) => e.kind === 'recover')).toHaveLength(1);
    expect(enemyUnit(s).hp).toBe(40 + btl_sea02.recover!.amount);
  });
});

describe('전투 대사', () => {
  it('공통 대사 사이에 루트별 개인 2줄이 끼어 순환한다', () => {
    const s = createBattleState(btl_sea02);
    const seq = [0, 1, 2, 3, 4].map((n) => enemyLine(btl_sea02, { ...s, enemyActs: n })!);
    expect(seq).toEqual(['그만 봐.', '오빠, 듣지 마.', '너 다쳐.', '그 소리 나빠요.', '이건 네 거 아니야.']);
  });

  it('마지막 라운드에는 final 대사가 고정된다', () => {
    const s = createBattleState(btl_sea02);
    expect(enemyLine(btl_sea02, { ...s, round: btl_sea02.roundLimit })).toBe('…미안해.');
  });
});

describe('전투3 UI 박리 수렴', () => {
  it('단계별 커맨드 정원을 채우면 박리 레벨이 오르고 마지막 단계로 수렴한다', () => {
    let u = createUnravelState(btl_true03);
    expect(u).toMatchObject({ stage: 0, stripLevel: 0, finalReady: false });

    const total = btl_true03.unravel!.slice(0, -1).reduce((n, st) => n + st.commands, 0);
    const levels: number[] = [];
    for (let i = 0; i < total; i += 1) {
      u = unravelAdvance(btl_true03, u);
      levels.push(u.stripLevel);
    }
    expect(levels).toEqual([0, 1, 1, 2]);
    expect(u.finalReady).toBe(true);

    // 마지막 단계 이후로는 더 진행되지 않고 finalReady가 유지된다(= 커맨드 1개로 수렴).
    u = unravelAdvance(btl_true03, u);
    expect(u).toMatchObject({ stage: btl_true03.unravel!.length - 1, stripLevel: 2, finalReady: true });
  });

  it('마지막 단계에서 활성인 커맨드는 「내 이름을 말한다」 하나뿐이다', () => {
    const active = btl_true03.party[0].skills.filter((s) => s.id === 'ultimate');
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe('내 이름을 말한다');
  });

  it('unravel이 없는 일반 전투는 박리 상태 기계가 동작하지 않는다', () => {
    const u = createUnravelState(btl_common01);
    expect(unravelAdvance(btl_common01, u)).toBe(u);
  });
});

describe('밸런스 회귀 가드', () => {
  it('일반 전투 3종은 랜덤 정책 승률 60~85% 밴드 안에 있다', () => {
    for (const id of BALANCED_BATTLE_IDS) {
      const def = BATTLES[id];
      const rng = seededRng(0x5eed);
      let wins = 0;
      const RUNS = 500;
      for (let i = 0; i < RUNS; i += 1) if (runRandomBattle(def, rng).outcome === 'win') wins += 1;
      const rate = wins / RUNS;
      expect(rate, `${id} 승률 ${(rate * 100).toFixed(1)}%`).toBeGreaterThanOrEqual(0.6);
      expect(rate, `${id} 승률 ${(rate * 100).toFixed(1)}%`).toBeLessThanOrEqual(0.85);
    }
  });
});
