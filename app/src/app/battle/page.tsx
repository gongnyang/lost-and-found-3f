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

  const unit = battle01.party[0]; // aoi — placeholder 시트가 있는 유일한 유닛

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

      <div className="battle-stage">
        {manifest ? (
          <SpritePlayer sheet={unit.sheet} manifest={manifest} action={action} scale={2} />
        ) : (
          <p>manifest 로딩 중...</p>
        )}
      </div>

      <div className="battle-controls">
        <button type="button" className="menu-btn" onClick={() => setAction('idle')}>
          idle
        </button>
        <button type="button" className="menu-btn" onClick={() => setAction('attack')}>
          attack
        </button>
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
