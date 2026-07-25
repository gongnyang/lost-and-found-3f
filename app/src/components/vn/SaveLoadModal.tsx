'use client';

// 슬롯별 챕터명·일시·위치. §2.3 SaveLoadModal 스펙.
// 슬롯 0 = 오토세이브(로드 전용), 1~9 = 수동 세이브(저장 가능).

import { useEffect, useState } from 'react';
import { listSlots, type SaveSlotData } from '@/engine/save';

export interface SaveLoadModalProps {
  mode: 'save' | 'load';
  onClose: () => void;
  onSave: (slot: number) => void;
  onLoad: (slot: number) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SaveLoadModal({ mode, onClose, onSave, onLoad }: SaveLoadModalProps) {
  const [slots, setSlots] = useState<(SaveSlotData | null)[]>([]);

  useEffect(() => {
    // 마운트 시 1회, localStorage(외부 시스템)를 읽어 hydrate.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlots(listSlots());
  }, []);

  function handleSlotClick(slot: number) {
    if (mode === 'save') {
      if (slot === 0) return; // 오토세이브 슬롯은 수동 저장 불가
      onSave(slot);
      setSlots(listSlots());
      return;
    }
    if (!slots[slot]) return;
    onLoad(slot);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="saveload-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>{mode === 'save' ? '세이브' : '로드'}</span>
          <button type="button" className="modal-close" onClick={onClose}>
            닫기
          </button>
        </div>
        <div className="saveload-grid">
          {Array.from({ length: 10 }, (_, slot) => {
            const data = slots[slot];
            const disabled = mode === 'save' ? slot === 0 : !data;
            return (
              <button
                key={slot}
                type="button"
                className="saveload-slot"
                disabled={disabled}
                onClick={() => handleSlotClick(slot)}
              >
                <div className="saveload-slot-title">{slot === 0 ? '오토세이브' : `슬롯 ${slot}`}</div>
                {data ? (
                  <>
                    <div className="saveload-slot-chapter">{data.sceneTitle}</div>
                    <div className="saveload-slot-time">{formatDate(data.savedAt)}</div>
                  </>
                ) : (
                  <div className="saveload-slot-empty">비어 있음</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
