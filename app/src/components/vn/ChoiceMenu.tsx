'use client';

// 선택지 버튼, if 조건 미충족 항목 숨김. §2.3 ChoiceMenu 스펙.

import { useRef, useState, type CSSProperties } from 'react';
import type { VisibleChoiceItem } from '@/engine/interpreter';

export interface ChoiceMenuProps {
  items: VisibleChoiceItem[];
  onSelect: (index: number) => void;
}

export default function ChoiceMenu({ items, onSelect }: ChoiceMenuProps) {
  // 확정 시 손글씨 언더라인 스트로크 피드백(§5) — dur-base(220ms) 동안 보여준 뒤 실제 선택 확정.
  const [confirming, setConfirming] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSelect(i: number) {
    if (confirming !== null) return;
    setConfirming(i);
    timerRef.current = setTimeout(() => onSelect(i), 220);
  }

  let visibleIndex = 0;
  return (
    <div className="choice-menu">
      {items.map((item, i) => {
        if (!item.visible) return null;
        const order = visibleIndex++;
        return (
          <button
            key={i}
            type="button"
            className={`choice-btn ${confirming === i ? 'choice-btn--confirming' : ''}`}
            style={{ '--i': order } as CSSProperties}
            onClick={() => handleSelect(i)}
            disabled={confirming !== null}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
