// 히로인 네임플레이트 개인색 매핑 — docs/DESIGN-SYSTEM.md §2 "히로인 개인 컬러".
// CharId(engine/types.ts)가 실제 이름(sea/riwon/yunseul)으로 마이그레이션 완료됨에 따라
// 이 매핑도 실명 키로 직결.

import type { CharId } from '@/engine/types';

export interface HeroineSkin {
  bg: string; // 네임플레이트 배경 = 히로인 개인색 CSS 변수
  text: string; // 대비 규칙(§2): 밝은/중간 톤 → --ink-strong, 어두운 톤 → --paper-inner
}

const HEROINE_SKIN: Partial<Record<CharId, HeroineSkin>> = {
  sea: { bg: 'var(--heroine-sea)', text: 'var(--ink-strong)' }, // 세아 · 웜 코랄피치
  riwon: { bg: 'var(--heroine-riwon)', text: 'var(--ink-strong)' }, // 리원 · 더스티 페리윙클블루
  yunseul: { bg: 'var(--heroine-yunseul)', text: 'var(--paper-inner)' }, // 윤슬 · 딥 와인플럼
};

export function getHeroineSkin(who: CharId | null): HeroineSkin | null {
  if (!who) return null;
  return HEROINE_SKIN[who] ?? null;
}
