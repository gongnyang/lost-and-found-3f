'use client';

// 타이핑 이펙트(문자당 20~35ms 가변), 클릭 시 즉시 완성→다음, 화자 네임플레이트(캐릭터 컬러).
// §2.3 DialogueBox 스펙. 네임플레이트 표기 규칙(???/mcName/검열자)은 data/characters의
// resolveNameplate가 단일 소스 — 여기서는 그 결과만 렌더한다. 대사 텍스트 안의 {mcName}
// 템플릿도 여기서 실제 값(또는 미확정 시 '???')으로 치환한다.

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { CharId } from '@/engine/types';
import { resolveNameplate } from '@/data/characters';
import { getHeroineSkin } from './heroineSkin';

export interface DialogueBoxProps {
  who: CharId | null;
  text: string;
  textSpeedMs: number;
  skip: boolean; // SKIP 모드 — 즉시 완성 상태로 렌더
  nameRevealed: boolean; // flags.name_revealed — 하람 네임플레이트 「???」→ 실명 분기
  mcName: string | null; // 확정된 주인공 이름(nameInput 확정 전엔 null)
  onAdvance: () => void; // 완성된 상태에서 클릭 시 다음으로
  onTypingComplete?: () => void; // 타이핑이 끝난 시점(AUTO/SKIP 타이머 트리거용)
}

export default function DialogueBox({
  who,
  text,
  textSpeedMs,
  skip,
  nameRevealed,
  mcName,
  onAdvance,
  onTypingComplete,
}: DialogueBoxProps) {
  const resolvedText = text.replace(/\{mcName\}/g, mcName ?? '???');
  const [shownLen, setShownLen] = useState(skip ? resolvedText.length : 0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textRef = useRef(resolvedText);
  const firedRef = useRef(false);

  useEffect(() => {
    // resolvedText(파생값)가 바뀔 때 타이핑 진행도를 리셋하는 파생 상태 동기화.
    textRef.current = resolvedText;
    firedRef.current = false;
    if (skip) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShownLen(resolvedText.length);
      return;
    }
    setShownLen(0);
  }, [resolvedText, skip]);

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
    if (shownLen >= resolvedText.length && !firedRef.current) {
      firedRef.current = true;
      onTypingComplete?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownLen, resolvedText]);

  const complete = shownLen >= resolvedText.length;
  const name = resolveNameplate(who, { nameRevealed, mcName });
  const skin = getHeroineSkin(who);

  function handleClick() {
    if (!complete) {
      setShownLen(resolvedText.length);
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
          {resolvedText.slice(0, shownLen)}
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
