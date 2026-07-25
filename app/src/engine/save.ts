// localStorage 세이브/로드 — 슬롯 0~9(0=오토세이브, 1~9=수동) + miyensi:global.
// 각 세이브에 ver 필드를 둬서 향후 스키마 변경 시 마이그레이션 체인으로 흡수한다.
// §2.2: "로드는 커서 리플레이 없이 스냅샷 hydrate + 에셋 재로드만."

import type { CharId, Expr, StagePos } from './types';
import type { DialogueLine, Settings, VisibleChoiceItem } from './interpreter';
import { DEFAULT_SETTINGS } from './interpreter';

export const SAVE_VERSION = 2; // v2: mcName 필드 추가(nameInput 커맨드, §0 엔진 델타)

export interface SaveStageActor {
  who: CharId;
  expr: Expr;
  pos: StagePos;
}

export interface SaveSlotData {
  ver: number;
  sceneId: string;
  sceneTitle: string;
  cursor: number;
  flags: Record<string, number | boolean>;
  stage: SaveStageActor[];
  speaker: CharId | null;
  dialogue: DialogueLine | null;
  choice: VisibleChoiceItem[] | null;
  bg: string | null;
  bgm: string | null;
  cg: string | null;
  cgUnlocked: string[];
  settings: Settings;
  mcName: string | null; // nameInput 확정값(ver 2+). 이전 세이브 마이그레이션 시 null로 채움
  savedAt: string; // ISO timestamp
}

export interface GlobalData {
  ver: number;
  endings: string[]; // 해금된 엔딩 id 목록
  cgGallery: string[]; // 전 플레이스루 CG 해금 키 (세이브 슬롯과 분리된 영속 데이터)
  settings: Settings;
  mcName: string | null; // miyensi:global.mcName — nameInput 확정값의 영속 미러(ver 2+)
}

const SLOT_PREFIX = 'miyensi:save:';
const GLOBAL_KEY = 'miyensi:global';

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function migrateSlot(raw: unknown): SaveSlotData | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<SaveSlotData> & { ver?: number };
  // ver 1 → 2: mcName 필드 추가(누락 시 null). ver 2 → 현재 최신.
  // 향후 버전이 올라가면 여기 체인에 단계별 업그레이드를 추가한다.
  if (typeof r.ver !== 'number' || r.ver < 1) return null;
  return {
    ver: SAVE_VERSION,
    sceneId: r.sceneId ?? '',
    sceneTitle: r.sceneTitle ?? '',
    cursor: r.cursor ?? 0,
    flags: r.flags ?? {},
    stage: r.stage ?? [],
    speaker: r.speaker ?? null,
    dialogue: r.dialogue ?? null,
    choice: r.choice ?? null,
    bg: r.bg ?? null,
    bgm: r.bgm ?? null,
    cg: r.cg ?? null,
    cgUnlocked: r.cgUnlocked ?? [],
    settings: { ...DEFAULT_SETTINGS, ...(r.settings ?? {}) },
    mcName: r.mcName ?? null,
    savedAt: r.savedAt ?? new Date().toISOString(),
  };
}

function migrateGlobal(raw: unknown): GlobalData | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<GlobalData> & { ver?: number };
  if (typeof r.ver !== 'number' || r.ver < 1) return null;
  return {
    ver: SAVE_VERSION,
    endings: r.endings ?? [],
    cgGallery: r.cgGallery ?? [],
    settings: { ...DEFAULT_SETTINGS, ...(r.settings ?? {}) },
    mcName: r.mcName ?? null,
  };
}

export function saveSlot(slot: number, data: Omit<SaveSlotData, 'ver' | 'savedAt'>): void {
  if (!hasStorage()) return;
  if (slot < 0 || slot > 9) throw new Error(`invalid save slot: ${slot}`);
  const payload: SaveSlotData = { ...data, ver: SAVE_VERSION, savedAt: new Date().toISOString() };
  window.localStorage.setItem(`${SLOT_PREFIX}${slot}`, JSON.stringify(payload));
}

export function loadSlot(slot: number): SaveSlotData | null {
  if (!hasStorage()) return null;
  const raw = window.localStorage.getItem(`${SLOT_PREFIX}${slot}`);
  if (!raw) return null;
  try {
    return migrateSlot(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function deleteSlot(slot: number): void {
  if (!hasStorage()) return;
  window.localStorage.removeItem(`${SLOT_PREFIX}${slot}`);
}

export function listSlots(): (SaveSlotData | null)[] {
  const slots: (SaveSlotData | null)[] = [];
  for (let i = 0; i <= 9; i++) slots.push(loadSlot(i));
  return slots;
}

export function loadGlobal(): GlobalData {
  if (!hasStorage()) {
    return { ver: SAVE_VERSION, endings: [], cgGallery: [], settings: DEFAULT_SETTINGS, mcName: null };
  }
  const raw = window.localStorage.getItem(GLOBAL_KEY);
  if (!raw) return { ver: SAVE_VERSION, endings: [], cgGallery: [], settings: DEFAULT_SETTINGS, mcName: null };
  try {
    const migrated = migrateGlobal(JSON.parse(raw));
    return migrated ?? { ver: SAVE_VERSION, endings: [], cgGallery: [], settings: DEFAULT_SETTINGS, mcName: null };
  } catch {
    return { ver: SAVE_VERSION, endings: [], cgGallery: [], settings: DEFAULT_SETTINGS, mcName: null };
  }
}

export function saveGlobal(data: Omit<GlobalData, 'ver'>): void {
  if (!hasStorage()) return;
  const payload: GlobalData = { ...data, ver: SAVE_VERSION };
  window.localStorage.setItem(GLOBAL_KEY, JSON.stringify(payload));
}

export function unlockEnding(endingId: string): GlobalData {
  const g = loadGlobal();
  const endings = g.endings.includes(endingId) ? g.endings : [...g.endings, endingId];
  const next = { ...g, endings };
  saveGlobal(next);
  return next;
}

export function unlockCgGallery(keys: string[]): GlobalData {
  const g = loadGlobal();
  const merged = Array.from(new Set([...g.cgGallery, ...keys]));
  const next = { ...g, cgGallery: merged };
  saveGlobal(next);
  return next;
}
