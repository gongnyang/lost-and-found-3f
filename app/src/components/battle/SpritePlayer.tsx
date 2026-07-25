'use client';

// SpritePlayer(~50줄) — §3 스텁. manifest `{ actions: { idle: { frames:[{x,y,w,h}], fps, loop } } }`
// 을 소비해 background-position + rAF 누적시간으로 프레임을 계산한다. onComplete로 시퀀서 연결.
// 실제 SD 시트(sea/riwon/yunseul)도 idle/attack 두 액션만 존재, hit/victory 등은 P3C에서 추가
// (없는 액션은 기존 CSS 폴백 유지).

import { useEffect, useRef, useState } from 'react';

export interface FrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ActionDef {
  frames: FrameRect[];
  fps: number;
  loop: boolean;
}

export interface SpriteManifest {
  actions: Record<string, ActionDef>;
}

export interface SpritePlayerProps {
  sheet: string;
  manifest: SpriteManifest;
  action: string;
  scale?: number;
  onComplete?: () => void;
}

export default function SpritePlayer({ sheet, manifest, action, scale = 1, onComplete }: SpritePlayerProps) {
  const [frameIdx, setFrameIdx] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const firedCompleteRef = useRef(false);

  const def = manifest.actions[action];

  useEffect(() => {
    // action(prop)이 바뀔 때 애니메이션을 처음부터 다시 시작 — 파생 상태 리셋.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFrameIdx(0);
    firedCompleteRef.current = false;
    startRef.current = performance.now();
    if (!def || def.frames.length === 0) return;

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const frameDur = 1000 / def.fps;
      let idx = Math.floor(elapsed / frameDur);
      if (idx >= def.frames.length) {
        if (def.loop) {
          idx = idx % def.frames.length;
        } else {
          idx = def.frames.length - 1;
          if (!firedCompleteRef.current) {
            firedCompleteRef.current = true;
            onComplete?.();
          }
        }
      }
      setFrameIdx(idx);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, def]);

  if (!def || def.frames.length === 0) {
    return <div className="sprite-player sprite-player--empty" />;
  }
  const frame = def.frames[frameIdx] ?? def.frames[0];

  return (
    <div
      className="sprite-player"
      style={{
        width: frame.w * scale,
        height: frame.h * scale,
        backgroundImage: `url(${sheet})`,
        backgroundPosition: `${-frame.x * scale}px ${-frame.y * scale}px`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `auto`,
        imageRendering: 'pixelated',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
      }}
    />
  );
}
