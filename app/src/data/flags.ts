// 플래그·호감도 키 상수 — 오타 방지 단일 소스. 모든 씬 스크립트는 이 상수를 통해서만
// 플래그 키를 참조한다 (문자열 리터럴 직접 타이핑 금지).
// STORY.md §5 "플래그 설계"의 정본 키 이름을 그대로 등록한다. §5 외 키 신규 생성 금지.
// (g_cg_* 는 STORY.md §5.6에서도 CG 카탈로그 키에 따라 동적으로 늘어나는 패턴 키라 여기 고정 상수로 두지 않는다.)

export const FLAGS = {
  // §5.1 호감도 (세이브 슬롯, number, init 0)
  AFF_SEA: 'aff_sea',
  AFF_RIWON: 'aff_riwon',
  AFF_YUNSEUL: 'aff_yunseul',

  // §5.2 분기 보조 (세이브 슬롯, number, init 0)
  LAST_CHOICE: 'last_choice',
  ROUTE_ID: 'route_id',
  UI_STRIP_LEVEL: 'ui_strip_level',

  // §5.3 진행 (세이브 슬롯, boolean, init false)
  CH1_DONE: 'ch1_done',
  CH2_DONE: 'ch2_done',
  BATTLE01_WON: 'battle01_won',
  BATTLE02_WON: 'battle02_won',
  BATTLE03_DONE: 'battle03_done',
  ROUTE_CH1_DONE: 'route_ch1_done',
  ROUTE_CH2_DONE: 'route_ch2_done',
  OPENED_BOX_COMMON: 'opened_box_common',
  BOND_SEA: 'bond_sea',
  BOND_RIWON: 'bond_riwon',
  BOND_YUNSEUL: 'bond_yunseul',
  FRAG_SEA: 'frag_sea',
  FRAG_RIWON: 'frag_riwon',
  FRAG_YUNSEUL: 'frag_yunseul',

  // §5.4 단서·인지 (세이브 슬롯, boolean, init false)
  CLUE_NOSEBLEED: 'clue_nosebleed',
  CLUE_NOSOUND: 'clue_nosound',
  CLUE_CCTV: 'clue_cctv',
  CLUE_HOSPITAL: 'clue_hospital',
  CLUE_CENSOR_LIMIT: 'clue_censor_limit',
  CLUE_LASTSECOND: 'clue_lastsecond',
  CLUE_NOMENTION: 'clue_nomention',
  CLUE_SCAR: 'clue_scar',
  CLUE_ALBUM: 'clue_album',
  CLUE_FLOWERBED: 'clue_flowerbed',
  CLUE_NO_RETURN: 'clue_no_return',
  CLUE_YS_SIGN: 'clue_ys_sign',
  CLUE_RECORDER_3Y: 'clue_recorder_3y',
  CLUE_NOTEBOOK: 'clue_notebook',
  CLUE_MINUTES_GAP: 'clue_minutes_gap',
  CLUE_BLANK_NAME: 'clue_blank_name',

  // §5.5 연출 (세이브 슬롯, boolean)
  NAME_REVEALED: 'name_revealed', // true1s05 이름 확정 시 true. 하람 네임플레이트 「???」→ 실명
  BGM_TRUE_THEME: 'bgm_true_theme',

  // §5.6 글로벌 영속 슬롯(miyensi:global, 세이브와 분리).
  // mcName 자체는 FlagOp(number|boolean 전용)로 못 담아 VNState.mcName 전용 필드로 다룬다(§0 델타) —
  // g_mc_name은 그 값의 글로벌 미러 키(문자열)로만 등록해 둔다.
  G_CLEAR_SEA: 'g_clear_sea',
  G_CLEAR_RIWON: 'g_clear_riwon',
  G_CLEAR_YUNSEUL: 'g_clear_yunseul',
  G_FRAG_SEA: 'g_frag_sea',
  G_FRAG_RIWON: 'g_frag_riwon',
  G_FRAG_YUNSEUL: 'g_frag_yunseul',
  G_TRUE_UNLOCKED: 'g_true_unlocked',
  G_TRUE_CLEARED: 'g_true_cleared',
  G_MC_NAME: 'g_mc_name',
  G_OPT_CALL_MODE: 'g_opt_call_mode',

  // 데모 진행 플래그 (P0~P2 데모 씬 전용, 실 스토리 플래그와 별개로 유지)
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
