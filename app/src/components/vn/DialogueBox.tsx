'use client';

// 타이핑 이펙트(문자당 20~35ms 가변), 클릭 시 즉시 완성→다음, 화자 네임플레이트(캐릭터 컬러).
// §2.3 DialogueBox 스펙.

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { CharId } from '@/engine/types';
import { getCharacterMeta } from '@/data/characters';
import { getHeroineSkin } from './heroineSkin';

export interface DialogueBoxProps {
  who: CharId | null;
  text: string;
  textSpeedMs: number;
  skip: boolean; // SKIP 모드 — 즉시 완성 상태로 렌더
  onAdvance: () => void; // 완성된 상태에서 클릭 시 다음으로
  onTypingComplete?: () => void; // 타이핑이 끝난 시점(AUTO/SKIP 타이머 트리거용)
}

export default function DialogueBox({
  who,
  text,
  textSpeedMs,
  skip,
  onAdvance,
  onTypingComplete,
}: DialogueBoxProps) {
  const [shownLen, setShownLen] = useState(skip ? text.length : 0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textRef = useRef(text);
  const firedRef = useRef(false);

  useEffect(() => {
    // text(prop)가 바뀔 때 타이핑 진행도를 리셋하는 파생 상태 동기화.
    textRef.current = text;
    firedRef.current = false;
    if (skip) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShownLen(text.length);
      return;
    }
    setShownLen(0);
  }, [text, skip]);

  useEffect(() => {
    if (skip) return;
    if (shownLen >= textRef.current.length) return;
    timerRef.current = setTimeout(() => {
      setShownLen((n) => n + 1);
    }, textSpeedMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [shownLen, textSpeedMs, skip]);

  useEffect(() => {
    if (shownLen >= text.length && !firedRef.current) {
      firedRef.current = true;
      onTypingComplete?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownLen, text]);

  const complete = shownLen >= text.length;
  const meta = who ? getCharacterMeta(who) : null;
  const name = meta?.name ?? (who === 'mc' ? '나' : null);
  const skin = getHeroineSkin(who);

  function handleClick() {
    if (!complete) {
      setShownLen(text.length);
      return;
    }
    onAdvance();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <div
      className="dialogue-box"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={complete ? '다음 대사로' : '대사 즉시 표시'}
    >
      {name && (
        <div
          className="dialogue-nameplate"
          style={skin ? { background: skin.bg, color: skin.text } : undefined}
        >
          {name}
        </div>
      )}
      <div className="dialogue-textplate">
        <p className={`dialogue-text ${!name ? 'dialogue-text--narration' : ''}`}>
          {text.slice(0, shownLen)}
        </p>
      </div>
      {complete && (
        <div className="dialogue-caret" aria-hidden="true">
          ▼
        </div>
      )}
    </div>
  );
}
