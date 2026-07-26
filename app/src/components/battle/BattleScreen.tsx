'use client';

// 전투 화면 — engine/battle.ts(순수 코어)가 낸 상태·이벤트를 async 직렬 시퀀서로 연출한다.
// 연출 규약(ARCHITECTURE §3): 커맨드 확정 → 시전자 attack 1루프 → 임팩트에 SFX + 피격측
// 백스텝/적색 플래시 + HP바 트윈(300ms) → idle 복귀. victory는 정지 프레임 + 점프 트윈.
// 적 전용 SD 시트가 없어 적은 CSS 실루엣(검열자 = 어두운 형체 + 글리치)으로 그린다.
// 전투3(btl_true03)은 같은 UI를 쓰되 `unravel` 단계에 따라 UI를 한 겹씩 벗긴다(STORY §7.3).

import { useCallback, useEffect, useRef, useState } from 'react';
import SpritePlayer, { type SpriteManifest } from '@/components/battle/SpritePlayer';
import { playSfx } from '@/engine/audio';
import type { BattleDef, Skill } from '@/data/battles/battle01';
import {
  GAUGE_MAX,
  applySkill,
  canUse,
  createBattleState,
  createUnravelState,
  currentActor,
  endTurn,
  enemyAction,
  isAlive,
  unravelAdvance,
  type BattleEvent,
  type BattleState,
  type TurnResult,
  type UnravelState,
} from '@/engine/battle';

const IMPACT_MS = 260; // 커맨드 확정 → 임팩트 프레임
const HIT_MS = 320; // 임팩트 → idle 복귀(HP바 트윈 300ms를 덮는다)
const LINE_MS = 900; // 적 대사 자막 노출
const NOTE_MS = 1400; // 박리 단계 지문 노출
const FADEOUT_MS = 900; // 전투3 최종 커맨드 후 UI 페이드아웃

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function hpTier(hp: number, maxHp: number): 'ok' | 'warn' | 'danger' {
  const ratio = maxHp > 0 ? hp / maxHp : 0;
  if (ratio < 0.2) return 'danger';
  if (ratio < 0.4) return 'warn';
  return 'ok';
}

export interface BattleScreenProps {
  def: BattleDef;
  sfxVolume: number;
  /** 승패 확정 시 호출 — 호출측이 resumeAfterBattle(won) + /play 복귀를 담당한다. */
  onResolve: (won: boolean) => void;
}

export default function BattleScreen({ def, sfxVolume, onResolve }: BattleScreenProps) {
  const [view, setView] = useState<BattleState>(() => createBattleState(def));
  const [unravel, setUnravel] = useState<UnravelState>(() => createUnravelState(def));
  const [manifests, setManifests] = useState<Record<string, SpriteManifest>>({});
  const [animUnitId, setAnimUnitId] = useState<string | null>(null);
  const [hitIds, setHitIds] = useState<string[]>([]);
  const [screenFx, setScreenFx] = useState<'flash' | 'shake' | null>(null);
  const [subtitle, setSubtitle] = useState<{ who: string; text: string } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  const [closing, setClosing] = useState(false); // 전투3 최종 커맨드 → 전 UI 페이드아웃

  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const rngRef = useRef<() => number>(Math.random);
  const isSpecial = (def.unravel?.length ?? 0) > 0;
  const stripLevel = isSpecial ? (closing ? 3 : unravel.stripLevel) : 0;

  // 파티 SD manifest 로드(적은 실루엣이라 시트 없음).
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      def.party.map((u) =>
        fetch(u.manifest)
          .then((r) => r.json())
          .then((m: SpriteManifest) => [u.id, m] as const)
          .catch(() => null)
      )
    ).then((pairs) => {
      if (cancelled) return;
      setManifests(Object.fromEntries(pairs.filter((p): p is readonly [string, SpriteManifest] => p !== null)));
    });
    return () => {
      cancelled = true;
    };
  }, [def]);

  // 전투3 1단계 대사는 시작하자마자 띄운다.
  useEffect(() => {
    const first = def.unravel?.[0];
    if (!first) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubtitle({ who: def.enemy.name, text: first.line });
  }, [def]);

  /** 한 유닛의 행동 1건(act + hit/heal)을 연출한다. */
  const playTurn = useCallback(
    async (res: TurnResult, enemyName: string) => {
      const line = res.events.find((e): e is Extract<BattleEvent, { kind: 'line' }> => e.kind === 'line');
      if (line) {
        setSubtitle({ who: enemyName, text: line.text });
        await wait(LINE_MS);
      }
      const act = res.events.find((e): e is Extract<BattleEvent, { kind: 'act' }> => e.kind === 'act');
      if (!act) {
        setView(res.state);
        return;
      }
      setAnimUnitId(act.actorId);
      playSfx(act.sfx, sfxVolume);
      await wait(IMPACT_MS);

      const targets = res.events
        .filter((e) => e.kind === 'hit' || e.kind === 'heal')
        .map((e) => (e.kind === 'hit' ? e.targetId : e.kind === 'heal' ? e.targetId : ''))
        .filter(Boolean);
      setHitIds(targets);
      if (act.fx) setScreenFx(act.fx);
      setView(res.state); // HP바 트윈 시작
      await wait(HIT_MS);

      setHitIds([]);
      setScreenFx(null);
      setAnimUnitId(null);
    },
    [sfxVolume]
  );

  /** 다음 아군 차례가 올 때까지 적 턴을 소화한다. */
  const runEnemyTurns = useCallback(
    async (start: BattleState): Promise<BattleState> => {
      let s = start;
      let guard = 0;
      while (!s.outcome && currentActor(s)?.side === 'enemy' && guard++ < 8) {
        const res = enemyAction(def, s, rngRef.current);
        await playTurn(res, def.enemy.name);
        s = res.state;
        if (s.outcome) break;
        const turned = endTurn(def, s);
        s = turned.state;
        const recovered = turned.events.find((e) => e.kind === 'recover');
        if (recovered) {
          setSubtitle({ who: def.enemy.name, text: '…아직이야.' });
          setNote('검열 강도가 다시 짙어졌다.');
          setView(s);
          await wait(NOTE_MS);
          setNote(null);
        }
        setView(s);
      }
      return s;
    },
    [def, playTurn]
  );

  /** 전투3 — 커맨드 1회마다 박리 단계를 진행하고 갱신된 단계를 돌려준다. */
  const runUnravelStep = useCallback(
    async (prev: UnravelState): Promise<UnravelState> => {
      const next = unravelAdvance(def, prev);
      setUnravel(next);
      if (next.stage === prev.stage) return next;
      const prevStage = def.unravel?.[prev.stage];
      const nextStage = def.unravel?.[next.stage];
      if (prevStage) {
        setNote(prevStage.note);
        await wait(NOTE_MS);
        setNote(null);
      }
      if (nextStage) setSubtitle({ who: next.stage >= 1 ? '???' : def.enemy.name, text: nextStage.line });
      return next;
    },
    [def]
  );

  const finish = useCallback(
    (outcome: 'win' | 'lose') => {
      setResult(outcome);
      playSfx(outcome === 'win' ? '/assets/audio/sfx/victory-fanfare.ogg' : '/assets/audio/sfx/sfx_static.ogg', sfxVolume);
      busyRef.current = false;
      setBusy(false);
    },
    [sfxVolume]
  );

  async function handleCommand(skill: Skill) {
    if (busyRef.current || result || closing) return;
    const actor = currentActor(view);
    if (!actor || actor.side !== 'party' || !canUse(view, skill)) return;
    busyRef.current = true;
    setBusy(true);

    // 전투3 최종 커맨드 「내 이름을 말한다」 — 승패 구분 없이 수렴.
    if (isSpecial && unravel.finalReady) {
      playSfx(skill.sfx, sfxVolume);
      setSubtitle({ who: '???', text: skill.name });
      setClosing(true);
      await wait(FADEOUT_MS);
      onResolve(true);
      return;
    }

    const res = applySkill(def, view, skill, rngRef.current);
    await playTurn(res, def.enemy.name);
    let s = res.state;
    setView(s);

    const nextUnravel = isSpecial ? await runUnravelStep(unravel) : unravel;

    if (!s.outcome) {
      s = endTurn(def, s).state;
      setView(s);
      // 박리 2단계부터는 히로인이 화면에 없으므로 적 턴도 멈춘다("셋은 처음부터 여기에 없었다").
      if (!(isSpecial && nextUnravel.stripLevel >= 2)) {
        s = await runEnemyTurns(s);
        setView(s);
      }
    }

    if (s.outcome) {
      finish(s.outcome);
      return;
    }
    busyRef.current = false;
    setBusy(false);
  }

  const actor = currentActor(view);
  const actorDef = actor ? def.party.find((u) => u.id === actor.id) : undefined;
  const skills = actorDef?.skills ?? def.party[0].skills;
  const enemy = view.units.find((u) => u.side === 'enemy')!;
  const enemyLabel = isSpecial && stripLevel >= 1 ? '???' : def.enemy.name;
  const partyVisible = !(isSpecial && stripLevel >= 2);

  return (
    <div
      className="battle-screen"
      data-fx={screenFx ?? undefined}
      data-strip={isSpecial ? stripLevel : undefined}
      data-ui-state={isSpecial && stripLevel >= 1 ? 'unravel' : undefined}
    >
      <header className="battle-header">
        <h1 className="battle-title">{def.name}</h1>
        <p className="battle-enemy-label">
          {enemyLabel}
          {!isSpecial && ` · ${view.round}/${def.roundLimit}턴`}
        </p>
      </header>

      <div className="battle-panel">
        <div className="battle-turn-rail" aria-label="턴 순서">
          {view.order.map((id) => {
            const u = view.units.find((x) => x.id === id)!;
            if (u.side === 'party' && !partyVisible) return null;
            return (
              <span
                key={id}
                className="battle-turn-chip"
                data-side={u.side}
                data-active={actor?.id === id ? 'true' : undefined}
                data-down={!isAlive(u) ? 'true' : undefined}
              >
                {u.side === 'enemy' ? '검' : u.name.slice(1, 2)}
              </span>
            );
          })}
        </div>

        <div className="battle-hp-list">
          {partyVisible &&
            def.party.map((p) => {
              const u = view.units.find((x) => x.id === p.id)!;
              return (
                <div className="battle-hp-row" key={p.id} data-down={!isAlive(u) ? 'true' : undefined}>
                  <span className="battle-hp-name">{p.name}</span>
                  <div className="battle-hp-track">
                    <div
                      className="battle-hp-fill"
                      data-tier={hpTier(u.hp, u.maxHp)}
                      style={{ width: `${Math.max(0, (u.hp / u.maxHp) * 100)}%` }}
                    />
                  </div>
                  <span className="battle-hp-num">
                    {u.hp}/{u.maxHp}
                  </span>
                </div>
              );
            })}

          {stripLevel < 1 && (
            <div className="battle-hp-row battle-hp-row--enemy">
              <span className="battle-hp-name">검열 강도</span>
              <div className="battle-hp-track">
                <div
                  className="battle-hp-fill"
                  data-tier={hpTier(enemy.hp, enemy.maxHp)}
                  style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }}
                />
              </div>
              <span className="battle-hp-num">
                {enemy.hp}/{enemy.maxHp}
              </span>
            </div>
          )}

          <div className="battle-gauge-row">
            <span className="battle-hp-name">게이지</span>
            <div className="battle-hp-track battle-gauge-track">
              <div className="battle-gauge-fill" style={{ width: `${(view.gauge / GAUGE_MAX) * 100}%` }} />
            </div>
            <span className="battle-hp-num">
              {view.gauge}/{GAUGE_MAX}
            </span>
          </div>
        </div>

        <div className="battle-stage">
          <div className="battle-enemy" data-shape={def.enemyShape} data-hit={hitIds.includes(enemy.id) ? 'true' : undefined}>
            <span className="battle-enemy-glitch" aria-hidden="true" />
            <span className="battle-enemy-core" aria-hidden="true" />
          </div>

          {partyVisible && (
            <div className="battle-party">
              {def.party.map((p) => {
                const u = view.units.find((x) => x.id === p.id)!;
                const manifest = manifests[p.id];
                return (
                  <div
                    key={p.id}
                    className="battle-party-slot"
                    data-hit={hitIds.includes(p.id) ? 'true' : undefined}
                    data-down={!isAlive(u) ? 'true' : undefined}
                    data-active={actor?.id === p.id ? 'true' : undefined}
                    data-victory={result === 'win' ? 'true' : undefined}
                  >
                    {manifest ? (
                      <SpritePlayer
                        sheet={p.sheet}
                        manifest={manifest}
                        action={animUnitId === p.id ? 'attack' : 'idle'}
                        scale={0.75}
                      />
                    ) : (
                      <div className="sprite-player sprite-player--empty" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {subtitle && (
          <p className="battle-subtitle">
            <span className="battle-subtitle-who">{subtitle.who}</span>
            {subtitle.text}
          </p>
        )}
        {note && <p className="battle-note">{note}</p>}

        {!result && (
          <div className="battle-command-menu">
            {skills.map((skill, i) => {
              const locked = isSpecial && unravel.finalReady && skill.id !== 'ultimate';
              const disabled = busy || locked || !canUse(view, skill) || !actor;
              return (
                <button
                  key={skill.id}
                  type="button"
                  className="battle-command-btn"
                  disabled={disabled}
                  onClick={() => handleCommand(skill)}
                  title={locked ? '—' : skill.cost > 0 ? `게이지 ${skill.cost}` : undefined}
                >
                  <span className="battle-command-num">{String(i + 1).padStart(2, '0')}</span>
                  {locked ? '—' : skill.name}
                  {!locked && skill.cost > 0 && <span className="battle-command-cost">{skill.cost}</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* 박리 2단계 이후로는 히로인이 없으므로 턴 안내도 지운다("셋은 처음부터 여기에 없었다"). */}
        {!result && actor && partyVisible && <p className="battle-actor-hint">{actor.name}의 턴</p>}

        {result && (
          <div className="battle-result">
            <p className="battle-result-label" data-outcome={result}>
              {result === 'win' ? '잔상 재생 완주' : '잔상이 끊겼다'}
            </p>
            <button type="button" className="menu-btn" onClick={() => onResolve(result === 'win')}>
              계속하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
