'use client';

// /battle — 씬 스크립트의 `battle` 커맨드로 진입하는 턴제 전투 화면.
// 여기서는 pendingBattle.id → BattleDef 해석과 승패 확정 후 /play 복귀 배관만 맡고,
// 전투 로직은 engine/battle.ts, 연출은 components/battle/BattleScreen.tsx가 담당한다.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlayStore } from '@/engine/state';
import { DEFAULT_SETTINGS } from '@/engine/interpreter';
import BattleScreen from '@/components/battle/BattleScreen';
import { getBattle } from '@/data/battles';

export default function BattlePage() {
  const router = useRouter();
  const pendingBattle = usePlayStore((s) => s.vn?.pendingBattle ?? null);
  const sfxVolume = usePlayStore((s) => s.vn?.settings.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume);
  const resumeAfterBattle = usePlayStore((s) => s.resumeAfterBattle);

  // ?id=btl_* — 스토리 진행 없이 특정 전투를 열어보는 QA용 경로(pipeline/scripts/qa_battle.mjs).
  // useSearchParams는 정적 프리렌더에 Suspense 경계를 요구하므로 마운트 후 location에서 읽는다.
  const [previewId, setPreviewId] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewId(new URLSearchParams(window.location.search).get('id'));
  }, []);

  const def = pendingBattle ? getBattle(pendingBattle.id) : previewId ? getBattle(previewId) : null;

  // 진행 중인 전투인데 정의를 못 찾으면 플레이어를 붙잡아두지 않고 승리로 흘려보낸다.
  useEffect(() => {
    if (pendingBattle && !def) {
      resumeAfterBattle(true);
      router.push('/play');
    }
  }, [pendingBattle, def, resumeAfterBattle, router]);

  function handleResolve(won: boolean) {
    resumeAfterBattle(won);
    router.push('/play');
  }

  if (!def) {
    return (
      <div className="battle-screen">
        <header className="battle-header">
          <h1 className="battle-title">전투 대기</h1>
          <p className="battle-enemy-label">진행 중인 전투가 없습니다 — 씬 스크립트의 battle 커맨드로 진입합니다.</p>
        </header>
        <Link className="menu-btn-link" href="/">
          타이틀로
        </Link>
      </div>
    );
  }

  return <BattleScreen def={def} sfxVolume={sfxVolume} onResolve={handleResolve} />;
}
