// zustand 단일 스토어 — §2.2. { sceneId, cursor, flags, stage, bg, bgm, backlog, settings }
// 순수 interpreter(advance/selectChoice)를 감싸 씬 레지스트리 조회(jump 해결)와
// 세이브/로드 스냅샷 hydrate를 담당한다. 오디오 재생/라우팅은 React 바인딩(컴포넌트) 쪽 책임.

import { create } from 'zustand';
import {
  advance,
  consumeFxEvent,
  consumeSfxEvents,
  createInitialState,
  selectChoice,
  submitName as applyNameInput,
  DEFAULT_SETTINGS,
  type Settings,
  type VNState,
} from './interpreter';
import { getScene, START_SCENE_ID } from '@/data/scenes';
import {
  loadGlobal,
  loadSlot,
  saveGlobal,
  saveSlot,
  unlockEnding,
  type SaveSlotData,
} from './save';

/** pendingJump이 남아있는 동안 씬을 갈아타며 advance를 이어간다(레지스트리 조회는 여기서만). */
function resolveJumps(state: VNState): VNState {
  let s = state;
  let guard = 0;
  while (s.pendingJump && guard++ < 20) {
    const jump = s.pendingJump;
    const target = getScene(jump.scene);
    let cursor = 0;
    if (jump.label && target) {
      const idx = target.script.findIndex((c) => c.t === 'label' && c.id === jump.label);
      if (idx >= 0) cursor = idx;
    }
    s = { ...s, pendingJump: null, sceneId: jump.scene, sceneTitle: target?.title ?? jump.scene, cursor };
    s = advance(s, target?.script ?? []);
  }
  return s;
}

/** 현재 커서부터 다음 정지 지점까지 자동진행 후, 씬 간 jump까지 해소한 최종 상태. */
function runAdvance(state: VNState): VNState {
  const script = getScene(state.sceneId)?.script ?? [];
  return resolveJumps(advance(state, script));
}

function toSaveSlotData(vn: VNState): Omit<SaveSlotData, 'ver' | 'savedAt'> {
  return {
    sceneId: vn.sceneId,
    sceneTitle: vn.sceneTitle,
    cursor: vn.cursor,
    flags: vn.flags,
    stage: vn.stage,
    speaker: vn.speaker,
    dialogue: vn.dialogue,
    choice: vn.choice,
    bg: vn.bg,
    bgm: vn.bgm,
    cg: vn.cg,
    cgUnlocked: vn.cgUnlocked,
    settings: vn.settings,
    mcName: vn.mcName,
  };
}

function fromSaveSlotData(data: SaveSlotData): VNState {
  return {
    sceneId: data.sceneId,
    sceneTitle: data.sceneTitle,
    cursor: data.cursor,
    flags: data.flags,
    stage: data.stage,
    speaker: data.speaker,
    dialogue: data.dialogue,
    bg: data.bg,
    bgm: data.bgm,
    cg: data.cg,
    cgUnlocked: data.cgUnlocked,
    backlog: [],
    settings: data.settings,
    choice: data.choice,
    pendingJump: null,
    pendingBattle: null,
    ending: null,
    sfxEvents: [],
    fxEvent: null,
    done: false,
    mcName: data.mcName,
    nameInputPending: false,
  };
}

interface PlayStoreState {
  vn: VNState | null;
  newGame: () => void;
  advanceClick: () => void;
  chooseOption: (index: number) => void;
  submitName: (name: string) => void;
  saveToSlot: (slot: number) => void;
  loadFromSlot: (slot: number) => boolean;
  autoSave: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  consumeSfx: () => void;
  consumeFx: () => void;
  clearPendingBattle: () => void;
  finishEnding: () => void;
  resumeAfterBattle: (won: boolean) => void;
}

export const usePlayStore = create<PlayStoreState>((set, get) => ({
  vn: null,

  newGame: () => {
    const scene = getScene(START_SCENE_ID);
    if (!scene) return;
    const settings: Settings = { ...DEFAULT_SETTINGS, ...loadGlobal().settings };
    const initial = createInitialState(scene, settings);
    set({ vn: runAdvance(initial) });
  },

  advanceClick: () => {
    const vn = get().vn;
    if (!vn || vn.choice || vn.pendingBattle || vn.ending || vn.nameInputPending) return;
    set({ vn: runAdvance(vn) });
  },

  chooseOption: (index) => {
    const vn = get().vn;
    if (!vn || !vn.choice) return;
    const script = getScene(vn.sceneId)?.script ?? [];
    const afterChoice = selectChoice(vn, script, index);
    set({ vn: resolveJumps(afterChoice) });
  },

  submitName: (name) => {
    const vn = get().vn;
    if (!vn || !vn.nameInputPending) return;
    const script = getScene(vn.sceneId)?.script ?? [];
    const after = resolveJumps(applyNameInput(vn, script, name));
    if (after.mcName) {
      const g = loadGlobal();
      saveGlobal({ ...g, mcName: after.mcName });
    }
    set({ vn: after });
  },

  saveToSlot: (slot) => {
    const vn = get().vn;
    if (!vn || vn.choice || vn.nameInputPending) return; // 선택지/이름입력 도중 세이브는 막는다(복원 모호성 방지)
    saveSlot(slot, toSaveSlotData(vn));
  },

  loadFromSlot: (slot) => {
    const data = loadSlot(slot);
    if (!data) return false;
    set({ vn: fromSaveSlotData(data) });
    return true;
  },

  autoSave: () => {
    const vn = get().vn;
    if (!vn || vn.choice || vn.nameInputPending) return;
    saveSlot(0, toSaveSlotData(vn));
  },

  updateSettings: (patch) => {
    const vn = get().vn;
    if (!vn) return;
    const settings = { ...vn.settings, ...patch };
    const g = loadGlobal();
    saveGlobal({ ...g, settings });
    set({ vn: { ...vn, settings } });
  },

  consumeSfx: () => {
    const vn = get().vn;
    if (!vn) return;
    set({ vn: consumeSfxEvents(vn) });
  },

  consumeFx: () => {
    const vn = get().vn;
    if (!vn) return;
    set({ vn: consumeFxEvent(vn) });
  },

  clearPendingBattle: () => {
    const vn = get().vn;
    if (!vn) return;
    set({ vn: { ...vn, pendingBattle: null } });
  },

  finishEnding: () => {
    const vn = get().vn;
    if (!vn || !vn.ending) return;
    unlockEnding(vn.ending);
    set({ vn: { ...vn, ending: null } });
  },

  resumeAfterBattle: (won) => {
    const vn = get().vn;
    if (!vn || !vn.pendingBattle) return;
    const label = won ? vn.pendingBattle.onWin : vn.pendingBattle.onLose;
    const script = getScene(vn.sceneId)?.script ?? [];
    const idx = script.findIndex((c) => c.t === 'label' && c.id === label);
    let s: VNState = { ...vn, pendingBattle: null, cursor: idx >= 0 ? idx : vn.cursor };
    s = runAdvance(s);
    set({ vn: s });
  },
}));
