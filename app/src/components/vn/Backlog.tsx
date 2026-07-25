'use client';

// 최근 200줄, 반투명 오버레이. §2.3 Backlog 스펙. interpreter가 이미 200줄로 잘라서
// 넘겨주므로(state.backlog.slice(-200)) 여기선 그대로 렌더만 한다.

import type { CSSProperties } from 'react';
import type { BacklogEntry } from '@/engine/interpreter';
import { getCharacterMeta } from '@/data/characters';
import { getHeroineSkin } from './heroineSkin';

export interface BacklogProps {
  entries: BacklogEntry[];
  onClose: () => void;
}

export default function Backlog({ entries, onClose }: BacklogProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="backlog-panel" onClick={(e) => e.stopPropagation()}>
        <div className="grain-layer" style={{ '--grain-opacity': 'var(--backlog-grain-opacity)' } as CSSProperties} />
        <div className="modal-header">
          <span>백로그</span>
          <button type="button" className="modal-close" onClick={onClose}>
            닫기
          </button>
        </div>
        <div className="backlog-list">
          {entries.length === 0 && <p className="backlog-empty">아직 대사가 없습니다.</p>}
          {entries.map((e, i) => {
            const meta = e.who ? getCharacterMeta(e.who) : null;
            const skin = getHeroineSkin(e.who);
            return (
              <p key={i} className="backlog-line">
                {meta && (
                  <span className="backlog-name" style={skin ? { color: skin.bg } : undefined}>
                    {meta.name}
                  </span>
                )}
                <span className="backlog-text">{e.text}</span>
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
