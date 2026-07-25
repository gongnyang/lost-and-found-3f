'use client';

// AUTO(완성 후 1.5s+글자수 비례), SKIP(토글), 세이브/로드, 백로그, 설정(텍스트 속도·볼륨).
// §2.3 QuickMenu 스펙. AUTO/SKIP 타이머 자체는 /play 페이지에서 settings를 구독해 돌리고,
// 이 컴포넌트는 토글 버튼과 모달 오픈 트리거만 제공한다.
// §5 DESIGN-SYSTEM 아이콘 바 + 유휴 3초 후 감쇠(--qm-idle-opacity)는 여기서 로컬 타이머로 구현.

import { useEffect, useRef, useState, type ReactNode } from 'react';
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

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const ICONS = {
  auto: (
    <Icon>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6.5v3.5l2.4 1.4" />
    </Icon>
  ),
  skip: (
    <Icon>
      <path d="M4.5 5v10l6-5-6-5Z" strokeLinejoin="round" />
      <path d="M11.5 5v10l6-5-6-5Z" strokeLinejoin="round" />
    </Icon>
  ),
  backlog: (
    <Icon>
      <path d="M4 5h12M4 10h12M4 15h8" />
    </Icon>
  ),
  save: (
    <Icon>
      <rect x="4" y="4" width="12" height="12" rx="1.5" />
      <path d="M7 4v4h6V4M7 12h6" />
    </Icon>
  ),
  load: (
    <Icon>
      <path d="M3 6.5h5l1.5 2H17V15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6.5Z" strokeLinejoin="round" />
    </Icon>
  ),
  settings: (
    <Icon>
      <circle cx="10" cy="10" r="2.4" />
      <path d="M10 3.5v2M10 14.5v2M4.6 6l1.7 1M13.7 13l1.7 1M15.4 6l-1.7 1M6.3 13l-1.7 1" />
    </Icon>
  ),
};

export default function QuickMenu({
  settings,
  onToggleAuto,
  onToggleSkip,
  onOpenSave,
  onOpenLoad,
  onOpenBacklog,
  onOpenSettings,
}: QuickMenuProps) {
  const [idle, setIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function wake() {
      setIdle(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIdle(true), 3000);
    }
    wake();
    window.addEventListener('pointermove', wake);
    window.addEventListener('pointerdown', wake);
    window.addEventListener('keydown', wake);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
    };
  }, []);

  return (
    <div className={`quick-menu ${idle ? 'quick-menu--idle' : ''}`}>
      <button
        type="button"
        className={`quick-btn ${settings.auto ? 'quick-btn--active' : ''}`}
        onClick={onToggleAuto}
        aria-pressed={settings.auto}
        title="AUTO"
      >
        {ICONS.auto}
        <span className="quick-btn-label">AUTO</span>
      </button>
      <button
        type="button"
        className={`quick-btn ${settings.skip ? 'quick-btn--active' : ''}`}
        onClick={onToggleSkip}
        aria-pressed={settings.skip}
        title="SKIP"
      >
        {ICONS.skip}
        <span className="quick-btn-label">SKIP</span>
      </button>
      <button type="button" className="quick-btn" onClick={onOpenBacklog} title="백로그">
        {ICONS.backlog}
        <span className="quick-btn-label">백로그</span>
      </button>
      <button type="button" className="quick-btn" onClick={onOpenSave} title="세이브">
        {ICONS.save}
        <span className="quick-btn-label">세이브</span>
      </button>
      <button type="button" className="quick-btn" onClick={onOpenLoad} title="로드">
        {ICONS.load}
        <span className="quick-btn-label">로드</span>
      </button>
      <button type="button" className="quick-btn" onClick={onOpenSettings} title="설정">
        {ICONS.settings}
        <span className="quick-btn-label">설정</span>
      </button>
    </div>
  );
}
