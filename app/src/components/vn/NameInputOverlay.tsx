'use client';

// 이름 입력 오버레이 — Command{t:'nameInput'} 실행 시 표시(§0/true1s05 브리프).
// 폴라로이드 카드 모티프(.dialogue-box와 동일 톤의 종이질감·미세 회전) + 빈 사진칸.
// placeholder로 "흐리게 들어있는 기본값" 표기를 구현하고, 빈 채로 확정해도 그 기본값이 채택된다.

import { useState, type FormEvent } from 'react';

export interface NameInputOverlayProps {
  onConfirm: (name: string) => void;
}

const DEFAULT_NAME = '정하람';

export default function NameInputOverlay({ onConfirm }: NameInputOverlayProps) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onConfirm(value.trim() || DEFAULT_NAME);
  }

  return (
    <div className="modal-overlay">
      <form className="nameinput-panel" onSubmit={handleSubmit}>
        <div className="nameinput-photo" aria-hidden="true" />
        <p className="nameinput-caption">이름을 입력해 주세요.</p>
        <input
          className="nameinput-field"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={DEFAULT_NAME}
          maxLength={12}
          autoFocus
        />
        <button type="submit" className="nameinput-confirm">
          확정
        </button>
      </form>
    </div>
  );
}
