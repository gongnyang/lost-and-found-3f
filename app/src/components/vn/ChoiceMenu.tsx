'use client';

// 선택지 버튼, if 조건 미충족 항목 숨김. §2.3 ChoiceMenu 스펙.

import type { VisibleChoiceItem } from '@/engine/interpreter';

export interface ChoiceMenuProps {
  items: VisibleChoiceItem[];
  onSelect: (index: number) => void;
}

export default function ChoiceMenu({ items, onSelect }: ChoiceMenuProps) {
  return (
    <div className="choice-menu">
      {items.map((item, i) =>
        item.visible ? (
          <button key={i} type="button" className="choice-btn" onClick={() => onSelect(i)}>
            {item.label}
          </button>
        ) : null,
      )}
    </div>
  );
}
