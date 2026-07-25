// 씬 단위 에셋 프리로더 — §2.4. Scene.assets 힌트 기반으로 이미지를 미리 디코드해
// 전환 시 깜빡임을 줄인다. next/image는 쓰지 않는다(사전 최적화 webp를 <img>로 직접).

import type { CharId, Scene } from './types';
import { getCharacterMeta, standingSrc } from '@/data/characters';

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !src) {
      resolve();
      return;
    }
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // 로딩 실패해도 진행을 막지 않음(플레이스홀더 단계)
    img.src = src;
  });
}

/** 캐릭터 등장 시점에 그 캐릭터의 전 표정을 일괄 프리로드. */
export function preloadCharacter(id: CharId): Promise<void[]> {
  const meta = getCharacterMeta(id);
  if (!meta) return Promise.resolve([]);
  return Promise.all(meta.exprs.map((expr) => preloadImage(standingSrc(id, expr))));
}

/** 씬 전환 시 assets 힌트에 있는 배경·CG·캐릭터 표정을 모두 프리로드. */
export async function preloadScene(scene: Scene): Promise<void> {
  const tasks: Promise<unknown>[] = [];
  for (const bg of scene.assets.bgs ?? []) tasks.push(preloadImage(bg));
  for (const cg of scene.assets.cgs ?? []) tasks.push(preloadImage(cg));
  for (const charId of scene.assets.chars ?? []) tasks.push(preloadCharacter(charId));
  await Promise.all(tasks);
}

/**
 * 800ms 초과 시에만 로딩 오버레이를 보여주기 위한 헬퍼.
 * onSlow 콜백은 프리로드가 800ms를 넘길 때 한 번 호출된다.
 */
export async function preloadSceneWithSlowSignal(scene: Scene, onSlow: () => void): Promise<void> {
  let done = false;
  const timer = setTimeout(() => {
    if (!done) onSlow();
  }, 800);
  try {
    await preloadScene(scene);
  } finally {
    done = true;
    clearTimeout(timer);
  }
}
