// 씬 레지스트리 — 씬 간 jump(cmd.t === 'jump')를 처리할 때 store가 조회하는 단일 소스.
// P3A: 35씬 전량 등록(docs/STORY.md §3). 데모 씬(ch01_common/ch02_branch)은 _demo/로 격리.

import type { Scene } from '@/engine/types';
import { c1s01 } from './c1s01';
import { c1s02 } from './c1s02';
import { c1s03 } from './c1s03';
import { c1s04 } from './c1s04';
import { c1s05 } from './c1s05';
import { c1s06 } from './c1s06';
import { c2s01 } from './c2s01';
import { c2s02 } from './c2s02';
import { c2s03 } from './c2s03';
import { c2s04 } from './c2s04';
import { c2s05 } from './c2s05';
import { sea1s01 } from './sea1s01';
import { sea1s02 } from './sea1s02';
import { sea1s03 } from './sea1s03';
import { sea2s01 } from './sea2s01';
import { sea2s02 } from './sea2s02';
import { seaGE } from './seaGE';
import { riw1s01 } from './riw1s01';
import { riw1s02 } from './riw1s02';
import { riw1s03 } from './riw1s03';
import { riw2s01 } from './riw2s01';
import { riw2s02 } from './riw2s02';
import { riwGE } from './riwGE';
import { yun1s01 } from './yun1s01';
import { yun1s02 } from './yun1s02';
import { yun1s03 } from './yun1s03';
import { yun2s01 } from './yun2s01';
import { yun2s02 } from './yun2s02';
import { yunGE } from './yunGE';
import { true1s01 } from './true1s01';
import { true1s02 } from './true1s02';
import { true1s03 } from './true1s03';
import { true1s04 } from './true1s04';
import { true1s05 } from './true1s05';
import { trueEnd } from './trueEnd';

export const SCENES: Record<string, Scene> = {
  c1s01,
  c1s02,
  c1s03,
  c1s04,
  c1s05,
  c1s06,
  c2s01,
  c2s02,
  c2s03,
  c2s04,
  c2s05,
  sea1s01,
  sea1s02,
  sea1s03,
  sea2s01,
  sea2s02,
  seaGE,
  riw1s01,
  riw1s02,
  riw1s03,
  riw2s01,
  riw2s02,
  riwGE,
  yun1s01,
  yun1s02,
  yun1s03,
  yun2s01,
  yun2s02,
  yunGE,
  true1s01,
  true1s02,
  true1s03,
  true1s04,
  true1s05,
  trueEnd,
};

export const START_SCENE_ID = 'c1s01';

export function getScene(id: string): Scene | null {
  return SCENES[id] ?? null;
}
