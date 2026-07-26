'use client';

// 크레딧 오버레이 — 타이틀에서 진입. BGM이 CC-BY 4.0(Kevin MacLeod)이라 표기가 의무다.
// 원본 대장: pipeline/audio/LICENSES.md (문구를 그대로 옮긴다 — 임의 축약 금지).

import { useEffect, useRef, type KeyboardEvent } from 'react';

export interface CreditsOverlayProps {
  onClose: () => void;
}

export default function CreditsOverlay({ onClose }: CreditsOverlayProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="credits-panel"
        role="dialog"
        aria-modal="true"
        aria-label="크레딧"
        tabIndex={-1}
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <span>크레딧</span>
          <button type="button" className="modal-close" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="credits-body">
          <section className="credits-section">
            <h2 className="credits-heading">제작</h2>
            <p className="credits-line">
              엔진 자작(Next.js · React · TypeScript) · 이미지 gpt-image-2 · 전투 SD 스프라이트 sprite-gen
            </p>
          </section>

          <section className="credits-section">
            <h2 className="credits-heading">음악 — Creative Commons BY 4.0</h2>
            <pre className="credits-block">{`Music: "Carefree", "Fluffing a Duck", "Gymnopedie No 1", "Frost Waltz",
"Long Note Two", "8bit Dungeon Boss", "Heartbreaking"
by Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0
https://creativecommons.org/licenses/by/4.0/`}</pre>
          </section>

          <section className="credits-section">
            <h2 className="credits-heading">효과음</h2>
            <p className="credits-line">
              Pixabay Content License · CC0 1.0 (OpenGameArt, Freesound) · 일부 자체 합성.
              항목별 출처는 저장소의 <code>pipeline/audio/LICENSES.md</code>에 기록되어 있다.
            </p>
          </section>

          <section className="credits-section">
            <h2 className="credits-heading">서체</h2>
            <p className="credits-line">Pretendard · 나눔명조 (SIL Open Font License 1.1)</p>
          </section>
        </div>
      </div>
    </div>
  );
}
