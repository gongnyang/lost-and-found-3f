// 전투 레지스트리 — 씬 스크립트의 `battle` 커맨드 id → BattleDef 해석 단일 소스.

import type { BattleDef } from './battle01';
import { battle01 } from './battle01';
import { btl_common01 } from './btl_common01';
import { btl_sea02 } from './btl_sea02';
import { btl_riw02 } from './btl_riw02';
import { btl_yun02 } from './btl_yun02';
import { btl_true03 } from './btl_true03';

export const BATTLES: Record<string, BattleDef> = {
  battle01,
  btl_common01,
  btl_sea02,
  btl_riw02,
  btl_yun02,
  btl_true03,
};

/** 스토리에 실제로 등장하는 일반 전투 3종(밸런싱 대상). 전투3은 수치 무관이라 제외. */
export const BALANCED_BATTLE_IDS = ['btl_common01', 'btl_sea02', 'btl_riw02', 'btl_yun02'] as const;

export function getBattle(id: string): BattleDef | null {
  return BATTLES[id] ?? null;
}
