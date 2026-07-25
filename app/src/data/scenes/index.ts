// 씬 레지스트리 — 씬 간 jump(cmd.t === 'jump')를 처리할 때 store가 조회하는 단일 소스.

import type { Scene } from '@/engine/types';
import { ch01_common } from './ch01_common';
import { ch02_branch } from './ch02_branch';

export const SCENES: Record<string, Scene> = {
  ch01_common,
  ch02_branch,
};

export const START_SCENE_ID = 'ch01_common';

export function getScene(id: string): Scene | null {
  return SCENES[id] ?? null;
}
