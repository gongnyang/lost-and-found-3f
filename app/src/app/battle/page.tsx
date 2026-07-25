'use client';

// /battle — 전투 화면 스텁. §3: "지금은 SpritePlayer 스텁만". 실제 턴제 시퀀서·HPBar·
// BattleLog·EffectLayer는 P3C 범위. 여기서는 manifest 소비 로직(SpritePlayer)이 실제로
// 동작하는 것과, VN 스크립트의 battle 커맨드 → 승/패 라벨 복귀 배관만 검증한다.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlayStore } from '@/engine/state';
import SpritePlayer, { type SpriteManifest } from '@/components/battle/SpritePlayer';
import { battle01 } from '@/data/battles/battle01';

export default function BattlePage() {
  const router = useRouter();
  const vn = usePlayStore((s) => s.vn);
  const resumeAfterBattle = usePlayStore((s) => s.resumeAfterBattle);
  const [action, setAction] = useState<'idle' | 'attack'>('idle');
  const [manifest, setManifest] = useState<SpriteManifest | null>(null);

  const unit = battle01.party[0]; // 문세아(sea) — 실제 SD 시트+manifest.app.json 로딩 검증용

  useEffect(() => {
    fetch(unit.manifest)
      .then((r) => r.json())
      .then(setManifest)
      .catch(() => setManifest(null));
  }, [unit.manifest]);

  function handleResolve(won: boolean) {
    if (vn?.pendingBattle) {
      resumeAfterBattle(won);
      router.push('/play');
    }
  }

  return (
    <div className="battle-screen">
      <h1 className="screen-title">전투 프리뷰 (스텁)</h1>
      <p className="screen-subtitle">
        {vn?.pendingBattle
          ? `씬 스크립트의 battle 커맨드로 진입함 (id: ${vn.pendingBattle.id})`
          : '직접 진입 — 실제 턴제 로직은 P3C에서 구현'}
      </p>

      <div className="battle-panel">
        <div className="battle-hp-list">
          {battle01.party.map((p) => (
            <div className="battle-hp-row" key={p.id}>
              <span className="battle-hp-name">{p.name}</span>
              <div className="battle-hp-track">
                <div className="battle-hp-fill" data-tier="ok" style={{ width: '100%' }} />
              </div>
              <span className="battle-hp-num">{p.maxHp}/{p.maxHp}</span>
            </div>
          ))}
          <div className="battle-hp-row battle-hp-row--enemy">
            <span className="battle-hp-name">{battle01.enemy.name}</span>
            <div className="battle-hp-track">
              <div className="battle-hp-fill" data-tier="warn" style={{ width: '68%' }} />
            </div>
            <span className="battle-hp-num">177/{battle01.enemy.maxHp}</span>
          </div>
        </div>

        <div className="battle-stage">
          {manifest ? (
            <SpritePlayer sheet={unit.sheet} manifest={manifest} action={action} scale={2} />
          ) : (
            <p>manifest 로딩 중...</p>
          )}
        </div>

        <div className="battle-command-menu">
          {unit.skills.map((skill, i) => {
            const wired = skill.id === 'attack';
            return (
              <button
                key={skill.id}
                type="button"
                className="battle-command-btn"
                disabled={!wired}
                onClick={wired ? () => setAction('attack') : undefined}
                title={wired ? undefined : 'P3C 턴제 시퀀서 구현 전까지 비활성'}
              >
                <span className="battle-command-num">{String(i + 1).padStart(2, '0')}</span>
                {skill.name}
              </button>
            );
          })}
          <button type="button" className="battle-command-btn battle-command-btn--idle" onClick={() => setAction('idle')}>
            <span className="battle-command-num">00</span>
            대기
          </button>
        </div>
      </div>

      {vn?.pendingBattle && (
        <div className="battle-controls">
          <button type="button" className="menu-btn" onClick={() => handleResolve(true)}>
            승리 처리 → onWin
          </button>
          <button type="button" className="menu-btn" onClick={() => handleResolve(false)}>
            패배 처리 → onLose
          </button>
        </div>
      )}

      {!vn?.pendingBattle && (
        <Link className="menu-btn-link" href="/">
          타이틀로
        </Link>
      )}
    </div>
  );
}
