'use client';

// 타이틀 — 게임의 첫인상을 만드는 히어로 화면. §2.3 + docs/DESIGN-SYSTEM.md v1.0.
//
// 구성: 키 비주얼(bg_title_dark, 아주 느린 돌리인) + 필름 그레인·비네트 + 명조 대형 로크업
//       + '분실물 선반' 모티프 메뉴(새 게임/이어하기/갤러리/크레딧) + 하단 BGM 크레딧 라인.
// 라우팅·세이브 로직(newGame/loadFromSlot/슬롯0 존재 여부/엔딩 카운트)과 크레딧 오버레이는
// 개편 전 동작 그대로 보존한다 — 바뀐 건 조판과 연출뿐이다.

import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlayStore } from '@/engine/state';
import { loadSlot, loadGlobal } from '@/engine/save';
import { clearGalleryFromPlay } from '@/engine/navFlags';
import CreditsOverlay from '@/components/CreditsOverlay';

// 빛기둥에 떠 있는 먼지. 광원(좌상단) 아래쪽에 몰아 8개만 — 과하지 않게.
const DUST = [
  { left: '17%', top: '62%', size: 3, dur: 19, delay: 0, drift: 14 },
  { left: '24%', top: '78%', size: 2, dur: 26, delay: 4, drift: -10 },
  { left: '31%', top: '54%', size: 4, dur: 23, delay: 9, drift: 18 },
  { left: '38%', top: '84%', size: 2, dur: 30, delay: 2, drift: -16 },
  { left: '46%', top: '70%', size: 3, dur: 21, delay: 12, drift: 9 },
  { left: '55%', top: '88%', size: 2, dur: 28, delay: 6, drift: -12 },
  { left: '63%', top: '60%', size: 3, dur: 24, delay: 15, drift: 12 },
  { left: '72%', top: '80%', size: 2, dur: 32, delay: 10, drift: -8 },
] as const;

export default function TitlePage() {
  const router = useRouter();
  const newGame = usePlayStore((s) => s.newGame);
  const loadFromSlot = usePlayStore((s) => s.loadFromSlot);
  const [hasAutoSave, setHasAutoSave] = useState(false);
  const [endingCount, setEndingCount] = useState(0);
  const [creditsOpen, setCreditsOpen] = useState(false);

  useEffect(() => {
    // 마운트 시 1회, localStorage(외부 시스템)를 읽어 클라이언트 전용으로 hydrate.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasAutoSave(loadSlot(0) !== null);
    setEndingCount(loadGlobal().endings.length);
    // 타이틀까지 나왔으면 '갤러리 → 게임으로 돌아가기' 맥락은 끝난 것으로 본다.
    clearGalleryFromPlay();
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
    <main className="title-screen">
      <div className="title-bg" aria-hidden="true" />
      <div className="title-glow" aria-hidden="true" />
      <div className="title-dust" aria-hidden="true">
        {DUST.map((d, i) => (
          <span
            key={i}
            style={
              {
                left: d.left,
                top: d.top,
                width: `${d.size}px`,
                height: `${d.size}px`,
                '--dust-dur': `${d.dur}s`,
                '--dust-delay': `${d.delay}s`,
                '--dust-drift': `${d.drift}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="grain-layer" aria-hidden="true" />
      <div className="vignette-layer" aria-hidden="true" />
      <div className="title-scrim" aria-hidden="true" />

      <div className="title-stage">
        <header className="title-lockup">
          <p className="title-kicker" style={{ '--i': 0 } as CSSProperties}>
            <span className="title-kicker-rule" aria-hidden="true" />
            한서고등학교 본관 3층
            <span className="title-kicker-rule" aria-hidden="true" />
          </p>

          <h1 className="title-logo">
            <span className="title-logo-line" style={{ '--i': 1 } as CSSProperties}>
              분실물 보관소,
            </span>
            <span className="title-logo-line" style={{ '--i': 2 } as CSSProperties}>
              3층 <em className="title-logo-accent">D</em>열
            </span>
          </h1>

          <p className="title-tagline" style={{ '--i': 3 } as CSSProperties}>
            잊고 싶은 일이 있으면 그 일과 얽힌 물건을 3층 D열에 맡겨라.
            <br />
            다음 날이면 잊게 된다.
          </p>
        </header>

        <nav className="title-menu" aria-label="타이틀 메뉴">
          <button
            type="button"
            className="title-menu-item"
            style={{ '--i': 4 } as CSSProperties}
            onClick={handleNewGame}
          >
            <span className="title-menu-label">새 게임</span>
            <span className="title-menu-note">처음부터</span>
          </button>

          <button
            type="button"
            className="title-menu-item"
            style={{ '--i': 5 } as CSSProperties}
            onClick={handleContinue}
            disabled={!hasAutoSave}
          >
            <span className="title-menu-label">이어하기</span>
            <span className="title-menu-note">{hasAutoSave ? '오토세이브' : '기록 없음'}</span>
          </button>

          <Link className="title-menu-item" style={{ '--i': 6 } as CSSProperties} href="/gallery">
            <span className="title-menu-label">갤러리</span>
            <span className="title-menu-note">CG · 엔딩</span>
          </Link>

          <button
            type="button"
            className="title-menu-item"
            style={{ '--i': 7 } as CSSProperties}
            onClick={() => setCreditsOpen(true)}
          >
            <span className="title-menu-label">크레딧</span>
            <span className="title-menu-note">제작 · 라이선스</span>
          </button>
        </nav>

        <p className="title-meta" style={{ '--i': 8 } as CSSProperties}>
          엔딩 {endingCount}개 해금
        </p>
      </div>

      <footer className="title-footer">
        Music by Kevin MacLeod (incompetech.com) · Licensed under CC BY 4.0
      </footer>

      {creditsOpen && <CreditsOverlay onClose={() => setCreditsOpen(false)} />}
    </main>
  );
}
