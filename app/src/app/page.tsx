'use client';

// 타이틀 — 새 게임·이어하기·갤러리·엔딩 리스트. §2.3.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlayStore } from '@/engine/state';
import { loadSlot, loadGlobal } from '@/engine/save';

export default function TitlePage() {
  const router = useRouter();
  const newGame = usePlayStore((s) => s.newGame);
  const loadFromSlot = usePlayStore((s) => s.loadFromSlot);
  const [hasAutoSave, setHasAutoSave] = useState(false);
  const [endingCount, setEndingCount] = useState(0);

  useEffect(() => {
    // 마운트 시 1회, localStorage(외부 시스템)를 읽어 클라이언트 전용으로 hydrate.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasAutoSave(loadSlot(0) !== null);
    setEndingCount(loadGlobal().endings.length);
  }, []);

  function handleNewGame() {
    newGame();
    router.push('/play');
  }

  function handleContinue() {
    if (!loadFromSlot(0)) return;
    router.push('/play');
  }

  return (
    <div className="screen">
      <h1 className="screen-title">miyensi</h1>
      <p className="screen-subtitle">기억과 상실 · 웹 비주얼노벨 데모</p>
      <div className="menu-col">
        <button type="button" className="menu-btn" onClick={handleNewGame}>
          새 게임
        </button>
        <button type="button" className="menu-btn" onClick={handleContinue} disabled={!hasAutoSave}>
          이어하기
        </button>
        <Link className="menu-btn" href="/gallery">
          갤러리
        </Link>
      </div>
      <p className="menu-btn-link">엔딩 {endingCount}개 해금</p>
      <Link className="menu-btn-link" href="/battle">
        전투 프리뷰(스텁)
      </Link>
    </div>
  );
}
