// 히로인 네임플레이트 개인색 매핑 — docs/DESIGN-SYSTEM.md §2 "히로인 개인 컬러".
//
// 주의: 엔진 스키마(engine/types.ts CharId)와 씬 데이터(data/scenes/*)는 아직 초기
// placeholder 코드네임(aoi/haru/sena)을 쓰고 있고, 실제 스토리(docs/STORY.md)의
// 히로인은 세아·리원·윤슬이다. 이 파일은 순수 스킨(마크업/스타일) 레이어이고
// engine/·data/의 CharId 리네이밍은 범위 밖이므로, 등장 순서(§2 표 순서 = ch01
// 등장 순서: 세아→리원→윤슬 / aoi→haru→sena)로 1:1 대응해 시각 스킨만 적용한다.
// CharId가 실제 이름으로 마이그레이션되면 이 매핑 테이블만 교체하면 된다.

import type { CharId } from '@/engine/types';

export interface HeroineSkin {
  bg: string; // 네임플레이트 배경 = 히로인 개인색 CSS 변수
  text: string; // 대비 규칙(§2): 밝은/중간 톤 → --ink-strong, 어두운 톤 → --paper-inner
}

const HEROINE_SKIN: Partial<Record<CharId, HeroineSkin>> = {
  aoi: { bg: 'var(--heroine-sea)', text: 'var(--ink-strong)' }, // 세아 · 웜 코랄피치
  haru: { bg: 'var(--heroine-riwon)', text: 'var(--ink-strong)' }, // 리원 · 더스티 페리윙클블루
  sena: { bg: 'var(--heroine-yunseul)', text: 'var(--paper-inner)' }, // 윤슬 · 딥 와인플럼
};

export function getHeroineSkin(who: CharId | null): HeroineSkin | null {
  if (!who) return null;
  return HEROINE_SKIN[who] ?? null;
}
