// 플래그·호감도 키 상수 — 오타 방지 단일 소스. 모든 씬 스크립트는 이 상수를 통해서만
// 플래그 키를 참조한다 (문자열 리터럴 직접 타이핑 금지).

export const FLAGS = {
  AFF_SEA: 'aff_sea',
  AFF_RIWON: 'aff_riwon',
  AFF_YUNSEUL: 'aff_yunseul',

  // 데모 진행 플래그
  DEMO_MET_RIWON: 'demo_met_riwon',
  DEMO_CHOSE_KIND: 'demo_chose_kind',
  DEMO_ROOFTOP_UNLOCKED: 'demo_rooftop_unlocked',
  DEMO_REMEMBERED: 'demo_remembered',

  // 엔딩 메타 플래그 (글로벌 영속 슬롯에 기록)
  ENDING_DEMO_SEEN: 'ending_demo_seen',
} as const;

export type FlagKey = (typeof FLAGS)[keyof typeof FLAGS];

/** 호감도 키 초기값 — 새 게임 시작 시 flags에 병합. */
export const INITIAL_AFFECTION: Record<string, number> = {
  [FLAGS.AFF_SEA]: 0,
  [FLAGS.AFF_RIWON]: 0,
  [FLAGS.AFF_YUNSEUL]: 0,
};
