// 캐릭터 메타 — 표정 목록, 네임플레이트 색상, 스탠딩 오프셋.
// 지금은 placeholder SVG 실루엣이라 표정 배리언트는 4종만 실제 파일 존재(neutral/smile/
// surprise/sad). 데모 씬은 이 exprs 목록 안에서만 표정을 사용한다.

import type { CharId, Expr } from '@/engine/types';

export interface CharacterMeta {
  id: CharId;
  name: string;
  color: string; // 네임플레이트/발화 강조 색
  exprs: Expr[]; // 실제 이미지 파일이 존재하는 표정 목록
  hasBlinkVariant: boolean; // 눈감음 배리언트 존재 여부 (placeholder 단계엔 없음 = false)
  standingOffset: { x: number; y: number }; // 스탠딩 이미지 앵커 보정치 (px, 임시값)
  standingBasePath: string; // /assets/char/{id}/
  spriteSheetPath: string; // /assets/sd/{id}/sheet.svg (전투용 placeholder)
  spriteManifestPath: string; // /assets/sd/{id}/manifest.json
}

export const CHARACTERS: Record<'aoi' | 'haru' | 'sena', CharacterMeta> = {
  aoi: {
    id: 'aoi',
    name: 'Aoi',
    color: '#7fb8ff',
    exprs: ['neutral', 'smile', 'surprise', 'sad'],
    hasBlinkVariant: false,
    standingOffset: { x: 0, y: 0 },
    standingBasePath: '/assets/char/aoi/',
    spriteSheetPath: '/assets/sd/aoi/sheet.svg',
    spriteManifestPath: '/assets/sd/aoi/manifest.json',
  },
  haru: {
    id: 'haru',
    name: 'Haru',
    color: '#ffb3c6',
    exprs: ['neutral', 'smile', 'surprise', 'sad'],
    hasBlinkVariant: false,
    standingOffset: { x: 0, y: 0 },
    standingBasePath: '/assets/char/haru/',
    spriteSheetPath: '/assets/sd/haru/sheet.svg',
    spriteManifestPath: '/assets/sd/haru/manifest.json',
  },
  sena: {
    id: 'sena',
    name: 'Sena',
    color: '#c9a7ff',
    exprs: ['neutral', 'smile', 'surprise', 'sad'],
    hasBlinkVariant: false,
    standingOffset: { x: 0, y: 0 },
    standingBasePath: '/assets/char/sena/',
    spriteSheetPath: '/assets/sd/sena/sheet.svg',
    spriteManifestPath: '/assets/sd/sena/manifest.json',
  },
};

export function getCharacterMeta(id: CharId): CharacterMeta | null {
  if (id === 'aoi' || id === 'haru' || id === 'sena') return CHARACTERS[id];
  return null; // mc/mob은 현재 스탠딩 에셋 없음 (지문 화자로만 사용)
}

/** 표정 이미지 경로. exprs에 없는 표정이 요청되면 neutral로 폴백. */
export function standingSrc(id: CharId, expr: Expr): string {
  const meta = getCharacterMeta(id);
  if (!meta) return '';
  const safeExpr = meta.exprs.includes(expr) ? expr : 'neutral';
  const file = safeExpr === 'neutral' ? 'base' : `expr_${safeExpr}`;
  return `${meta.standingBasePath}${file}.svg`;
}
