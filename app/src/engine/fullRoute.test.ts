// P3A 스모크 테스트 — 인터프리터 레벨에서 c1s01 → 각 엔딩 4종(ge_sea/ge_riwon/ge_yunseul/
// te_homyeong) 도달 가능성을 검증한다. usePlayStore(상태 스토어)를 실제 프로덕션 경로(
// newGame/chooseOption/resumeAfterBattle/submitName/advanceClick) 그대로 구동한다 — 씬
// 스크립트를 흉내 낸 목이 아니라 app/src/data/scenes의 실제 35씬을 그대로 태운다.
//
// 전투는 항상 승리로 시뮬레이션한다(패배 경로는 각 씬 내부에서 동일 목적지로 수렴하므로
// "도달 가능성" 검증에는 승리 경로 1개면 충분). 트루 루트는 실제 진입점(true1s01)에서
// 바로 시작한다 — 타이틀 화면의 3루트 클리어 해금 게이트는 씬 스크립트 밖(UI) 관심사라
// 이 스모크의 범위 밖이다.

import { describe, expect, it } from 'vitest';
import { usePlayStore } from './state';
import { createInitialState, DEFAULT_SETTINGS } from './interpreter';
import { getScene } from '@/data/scenes';

function startFresh(): void {
  usePlayStore.getState().newGame();
}

function startAt(sceneId: string): void {
  const scene = getScene(sceneId);
  if (!scene) throw new Error(`씬을 찾을 수 없음: ${sceneId}`);
  usePlayStore.setState({ vn: createInitialState(scene, DEFAULT_SETTINGS) });
  usePlayStore.getState().advanceClick();
}

/**
 * 도달까지 자동 구동. heroIndex(0=세아/1=리원/2=윤슬)가 주어지면 3지 선택지(CH-01~04)에서
 * 해당 인덱스를 고른다. 그 외 선택지(2지·1지)는 항상 0번을 고른다 — 어느 쪽을 골라도
 * 다음 라벨에서 합류하므로 결과(도달 엔딩)에 영향 없음. 전투는 항상 승리로 재개한다.
 */
function driveToEnding(heroIndex: number | null, maxSteps = 5000): string {
  for (let i = 0; i < maxSteps; i++) {
    const vn = usePlayStore.getState().vn;
    if (!vn) throw new Error('vn 상태가 없음 — 플레이스루 중 스토어가 초기화되지 않음');
    if (vn.ending) return vn.ending;
    if (vn.choice) {
      const idx = heroIndex !== null && vn.choice.length === 3 ? heroIndex : 0;
      usePlayStore.getState().chooseOption(idx);
      continue;
    }
    if (vn.pendingBattle) {
      usePlayStore.getState().resumeAfterBattle(true);
      continue;
    }
    if (vn.nameInputPending) {
      usePlayStore.getState().submitName('테스트');
      continue;
    }
    usePlayStore.getState().advanceClick();
  }
  const vn = usePlayStore.getState().vn;
  throw new Error(`${maxSteps}스텝 내에 엔딩 도달 실패 (마지막 sceneId=${vn?.sceneId}, cursor=${vn?.cursor})`);
}

describe('c1s01 → 엔딩 4종 도달 가능성 (인터프리터 완주 스모크)', () => {
  it('CH-01~04 전부 세아 선택 → ge_sea 도달', () => {
    startFresh();
    expect(driveToEnding(0)).toBe('ge_sea');
  });

  it('CH-01~04 전부 리원 선택 → ge_riwon 도달', () => {
    startFresh();
    expect(driveToEnding(1)).toBe('ge_riwon');
  });

  it('CH-01~04 전부 윤슬 선택 → ge_yunseul 도달', () => {
    startFresh();
    expect(driveToEnding(2)).toBe('ge_yunseul');
  });

  it('true1s01부터 시작 → te_homyeong(트루엔딩) 도달', () => {
    startAt('true1s01');
    expect(driveToEnding(null)).toBe('te_homyeong');
  });
});
