'use client';

// AUTO(완성 후 1.5s+글자수 비례), SKIP(토글), 세이브/로드, 백로그, 설정(텍스트 속도·볼륨).
// §2.3 QuickMenu 스펙. AUTO/SKIP 타이머 자체는 /play 페이지에서 settings를 구독해 돌리고,
// 이 컴포넌트는 토글 버튼과 모달 오픈 트리거만 제공한다.

import type { Settings } from '@/engine/interpreter';

export interface QuickMenuProps {
  settings: Settings;
  onToggleAuto: () => void;
  onToggleSkip: () => void;
  onOpenSave: () => void;
  onOpenLoad: () => void;
  onOpenBacklog: () => void;
  onOpenSettings: () => void;
}

export default function QuickMenu({
  settings,
  onToggleAuto,
  onToggleSkip,
  onOpenSave,
  onOpenLoad,
  onOpenBacklog,
  onOpenSettings,
}: QuickMenuProps) {
  return (
    <div className="quick-menu">
      <button
        type="button"
        className={`quick-btn ${settings.auto ? 'quick-btn--active' : ''}`}
        onClick={onToggleAuto}
      >
        AUTO
      </button>
      <button
        type="button"
        className={`quick-btn ${settings.skip ? 'quick-btn--active' : ''}`}
        onClick={onToggleSkip}
      >
        SKIP
      </button>
      <button type="button" className="quick-btn" onClick={onOpenBacklog}>
        백로그
      </button>
      <button type="button" className="quick-btn" onClick={onOpenSave}>
        세이브
      </button>
      <button type="button" className="quick-btn" onClick={onOpenLoad}>
        로드
      </button>
      <button type="button" className="quick-btn" onClick={onOpenSettings}>
        설정
      </button>
    </div>
  );
}
