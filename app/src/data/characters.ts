// 캐릭터 메타 — 표정 목록, 네임플레이트 색상, 스탠딩 오프셋.
// 실제 캐릭터 아트 적재 완료: 문세아(sea)/백리원(riwon)/강윤슬(yunseul), 표정 9종
// (neutral/smile/laugh/blush/sad/worry/surprise/serious/closed) 1024x1536 webp.
// closed는 화면에 직접 표시되지 않고 CharacterStage의 랜덤 깜빡임 스왑 전용.
// 화면 기본 표시는 base.webp가 아니라 expr_neutral.webp — base는 참조/원화 용도.

import type { CharId, Expr } from '@/engine/types';

export interface CharacterMeta {
  id: CharId;
  name: string;
  color: string; // 네임플레이트/발화 강조 색
  exprs: Expr[]; // 실제 이미지 파일이 존재하는 표정 목록
  hasBlinkVariant: boolean; // 눈감음 배리언트 존재 여부
  standingOffset: { x: number; y: number }; // 스탠딩 이미지 앵커 보정치 (px, 임시값)
  standingBasePath: string; // /assets/char/{id}/
  spriteSheetPath: string; // /assets/sd/{id}/sheet.webp (전투용)
  spriteManifestPath: string; // /assets/sd/{id}/manifest.app.json (SpritePlayer 소비 형식)
}

export const CHARACTERS: Record<'sea' | 'riwon' | 'yunseul', CharacterMeta> = {
  sea: {
    id: 'sea',
    name: '문세아',
    color: '#E8916B',
    exprs: ['neutral', 'smile', 'laugh', 'blush', 'sad', 'worry', 'surprise', 'serious', 'closed'],
    hasBlinkVariant: true,
    standingOffset: { x: 0, y: 0 },
    standingBasePath: '/assets/char/sea/',
    spriteSheetPath: '/assets/sd/sea/sheet.webp',
    spriteManifestPath: '/assets/sd/sea/manifest.app.json',
  },
  riwon: {
    id: 'riwon',
    name: '백리원',
    color: '#7C8FB0',
    exprs: ['neutral', 'smile', 'laugh', 'blush', 'sad', 'worry', 'surprise', 'serious', 'closed'],
    hasBlinkVariant: true,
    standingOffset: { x: 0, y: 0 },
    standingBasePath: '/assets/char/riwon/',
    spriteSheetPath: '/assets/sd/riwon/sheet.webp',
    spriteManifestPath: '/assets/sd/riwon/manifest.app.json',
  },
  yunseul: {
    id: 'yunseul',
    name: '강윤슬',
    color: '#6B3A4B',
    exprs: ['neutral', 'smile', 'laugh', 'blush', 'sad', 'worry', 'surprise', 'serious', 'closed'],
    hasBlinkVariant: true,
    standingOffset: { x: 0, y: 0 },
    standingBasePath: '/assets/char/yunseul/',
    spriteSheetPath: '/assets/sd/yunseul/sheet.webp',
    spriteManifestPath: '/assets/sd/yunseul/manifest.app.json',
  },
};

export function getCharacterMeta(id: CharId): CharacterMeta | null {
  if (id === 'sea' || id === 'riwon' || id === 'yunseul') return CHARACTERS[id];
  return null; // haram/censor/mob은 현재 스탠딩 에셋 없음 (지문 화자로만 사용)
}

/** 스탠딩 이미지가 없는 대사 전용 화자 메타 — CharacterStage에는 등장하지 않는다. */
export const NARRATOR_META: Partial<Record<CharId, { color: string }>> = {
  haram: { color: '#8A8F98' }, // 무채 회청 — STORY.md §2
  censor: { color: '#1A1A1A' }, // 먹 — STORY.md §2
};

export interface NameplateOptions {
  nameRevealed: boolean;
  mcName: string | null;
}

/**
 * 화자 네임플레이트 표기 규칙 (STORY.md §0/§2 정본).
 * - haram: name_revealed===false 인 동안 「???」, true가 되면 확정된 mcName.
 * - censor: 항상 「검열자」.
 * - 그 외: CHARACTERS 메타의 실제 이름, 메타가 없으면 null(네임플레이트 미표시 = 지문 취급).
 */
export function resolveNameplate(who: CharId | null, opts: NameplateOptions): string | null {
  if (!who) return null;
  if (who === 'haram') return opts.nameRevealed ? opts.mcName ?? '???' : '???';
  if (who === 'censor') return '검열자';
  return getCharacterMeta(who)?.name ?? null;
}

/** 표정 이미지 경로. exprs에 없는 표정이 요청되면 neutral로 폴백. 기본 표시는 expr_neutral(base는 참조용). */
export function standingSrc(id: CharId, expr: Expr): string {
  const meta = getCharacterMeta(id);
  if (!meta) return '';
  const safeExpr = meta.exprs.includes(expr) ? expr : 'neutral';
  return `${meta.standingBasePath}expr_${safeExpr}.webp`;
}
