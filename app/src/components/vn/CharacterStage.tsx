'use client';

// 표정 배리언트 크로스페이드 스왑(120ms opacity), CSS 호흡(translateY 사인파 1~2px/4s 무한),
// 깜빡임(눈감음 배리언트 있으면 랜덤 2~6s 인터벌 80ms 스왑), 발화자 강조(비발화자 brightness
// 0.75), 등장 트랜지션. §2.3 CharacterStage 스펙.

import { useEffect, useState } from 'react';
import type { StageActor } from '@/engine/interpreter';
import type { CharId, StagePos } from '@/engine/types';
import { getCharacterMeta, standingSrc } from '@/data/characters';

const POS_LEFT_PCT: Record<StagePos, number> = {
  offL: -20,
  left: 22,
  center: 50,
  right: 78,
  offR: 120,
};

interface CharacterSpriteProps {
  who: CharId;
  expr: StageActor['expr'];
  pos: StagePos;
  dim: boolean;
}

function CharacterSprite({ who, expr, pos, dim }: CharacterSpriteProps) {
  const meta = getCharacterMeta(who);
  const src = standingSrc(who, expr);
  const [prevSrc, setPrevSrc] = useState<string | null>(null);
  const [currSrc, setCurrSrc] = useState(src);
  const [mounted, setMounted] = useState(false);
  const [blinkOn, setBlinkOn] = useState(false);

  // 표정 크로스페이드: src(prop에서 파생)가 바뀌면 이전 이미지를 잠깐 겹쳐 두고 120ms 후
  // 제거한다. "바뀐 prop에 맞춰 파생 상태를 동기화"하는 표준 useEffect 용례.
  useEffect(() => {
    if (src === currSrc) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrevSrc(currSrc);
    setCurrSrc(src);
    const t = setTimeout(() => setPrevSrc(null), 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // 등장 트랜지션: 마운트 다음 프레임에 진입 클래스 해제
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // 깜빡임: 눈감음(closed) 배리언트가 있는 캐릭터에서만 동작.
  useEffect(() => {
    if (!meta?.hasBlinkVariant) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = 2000 + Math.random() * 4000;
      timer = setTimeout(() => {
        setBlinkOn(true);
        setTimeout(() => setBlinkOn(false), 80);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [meta?.hasBlinkVariant]);

  const leftPct = POS_LEFT_PCT[pos];

  return (
    <div
      className="char-slot"
      style={{
        left: `${leftPct}%`,
        transform: `translateX(-50%) translateX(${mounted ? 0 : -40}px)`,
        opacity: mounted ? 1 : 0,
        filter: dim ? 'brightness(0.75)' : 'brightness(1)',
      }}
    >
      <div className="char-breathe">
        {prevSrc && <img className="char-img char-img--under" src={prevSrc} alt="" draggable={false} />}
        <img
          className="char-img"
          src={blinkOn && meta?.hasBlinkVariant ? standingSrc(who, 'closed') : currSrc}
          alt={meta?.name ?? who}
          draggable={false}
        />
      </div>
    </div>
  );
}

export interface CharacterStageProps {
  stage: StageActor[];
  speaker: CharId | null;
}

export default function CharacterStage({ stage, speaker }: CharacterStageProps) {
  return (
    <div className="character-stage">
      {stage.map((actor) => (
        <CharacterSprite
          key={actor.who}
          who={actor.who}
          expr={actor.expr}
          pos={actor.pos}
          dim={speaker !== null && speaker !== actor.who}
        />
      ))}
    </div>
  );
}
