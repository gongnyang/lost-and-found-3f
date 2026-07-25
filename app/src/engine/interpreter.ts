// 커맨드 실행기 — React 비의존 순수 함수. §2.3: "인터프리터는 React 비의존 순수 함수
// step(state, cmd) → state'". 여기서는 그 핵심 위에 씬 단위 자동진행 루프(advance)와
// 선택지 확정(selectChoice)을 얹는다. 어느 함수도 DOM/전역상태를 건드리지 않는다.

import type { Command, Cond, Expr, FlagOp, StagePos, CharId, Scene } from './types';

export type Flags = Record<string, number | boolean>;

export interface StageActor {
  who: CharId;
  expr: Expr;
  pos: StagePos;
}

export interface DialogueLine {
  who: CharId | null;
  text: string;
  expr?: Expr;
}

export interface BacklogEntry {
  who: CharId | null;
  text: string;
}

export interface Settings {
  textSpeedMs: number; // 문자당 ms (20~35 권장)
  autoBaseDelayMs: number; // AUTO 완성 후 기본 대기
  autoPerCharMs: number; // AUTO 글자수 비례 가중치
  bgmVolume: number; // 0~1
  sfxVolume: number; // 0~1
  skip: boolean;
  auto: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  textSpeedMs: 28,
  autoBaseDelayMs: 1500,
  autoPerCharMs: 40,
  bgmVolume: 0.7,
  sfxVolume: 0.8,
  skip: false,
  auto: false,
};

export interface VisibleChoiceItem {
  label: string;
  goto: string;
  set?: FlagOp[];
  if?: Cond;
  visible: boolean;
}

export interface VNState {
  sceneId: string;
  sceneTitle: string;
  cursor: number;
  flags: Flags;
  stage: StageActor[];
  speaker: CharId | null;
  dialogue: DialogueLine | null;
  bg: string | null;
  bgm: string | null;
  cg: string | null;
  cgUnlocked: string[];
  backlog: BacklogEntry[];
  settings: Settings;
  choice: VisibleChoiceItem[] | null;
  pendingJump: { scene: string; label?: string } | null;
  pendingBattle: { id: string; onWin: string; onLose: string } | null;
  ending: string | null;
  sfxEvents: string[];
  fxEvent: { kind: 'shake' | 'flash' | 'blurMemory' | 'wait' | 'uiStrip'; dur?: number } | null;
  done: boolean;
  mcName: string | null; // FlagOp(number|boolean)로 못 담는 문자열 필드 — nameInput 확정 시 세팅
  nameInputPending: boolean; // true인 동안 이름 입력 오버레이가 진행을 막는다
}

export function createInitialState(scene: Scene, settings: Settings = DEFAULT_SETTINGS): VNState {
  return {
    sceneId: scene.id,
    sceneTitle: scene.title,
    cursor: 0,
    flags: {},
    stage: [],
    speaker: null,
    dialogue: null,
    bg: null,
    bgm: null,
    cg: null,
    cgUnlocked: [],
    backlog: [],
    settings,
    choice: null,
    pendingJump: null,
    pendingBattle: null,
    ending: null,
    sfxEvents: [],
    fxEvent: null,
    done: false,
    mcName: null,
    nameInputPending: false,
  };
}

export function resolveLabels(script: Command[]): Record<string, number> {
  const map: Record<string, number> = {};
  script.forEach((cmd, i) => {
    if (cmd.t === 'label') map[cmd.id] = i;
  });
  return map;
}

export function evalCond(cond: Cond, flags: Flags): boolean {
  if ('all' in cond) return cond.all.every((c) => evalCond(c, flags));
  if ('any' in cond) return cond.any.some((c) => evalCond(c, flags));
  const v = flags[cond.key];
  switch (cond.cmp) {
    case 'eq':
      return v === cond.value;
    case 'gte':
      return typeof v === 'number' && typeof cond.value === 'number' && v >= cond.value;
    case 'lte':
      return typeof v === 'number' && typeof cond.value === 'number' && v <= cond.value;
    default:
      return false;
  }
}

export function applyFlagOps(flags: Flags, ops: FlagOp[]): Flags {
  const next: Flags = { ...flags };
  for (const op of ops) {
    if (op.op === 'set') {
      next[op.key] = op.value;
    } else {
      const cur = typeof next[op.key] === 'number' ? (next[op.key] as number) : 0;
      const add = typeof op.value === 'number' ? op.value : 0;
      next[op.key] = cur + add;
    }
  }
  return next;
}

function findActorIndex(stage: StageActor[], who: CharId): number {
  return stage.findIndex((a) => a.who === who);
}

export interface StepResult {
  state: VNState;
  blocking: boolean; // true → 자동진행 루프 정지, 사용자 입력/외부 처리 대기
  jumpToLabel?: string; // 같은 씬 내 라벨 점프 (choice.goto, if.then/else)
  jumpToScene?: { scene: string; label?: string }; // 씬 간 이동 (jump 커맨드)
}

/** 단일 커맨드 실행 — 순수 함수, 부수효과 없음. */
export function step(state: VNState, cmd: Command): StepResult {
  switch (cmd.t) {
    case 'say': {
      let stage = state.stage;
      if (cmd.who && cmd.expr) {
        const i = findActorIndex(stage, cmd.who);
        if (i >= 0) stage = stage.map((a, idx) => (idx === i ? { ...a, expr: cmd.expr as Expr } : a));
      }
      const backlog = [...state.backlog, { who: cmd.who, text: cmd.text }].slice(-200);
      return {
        state: {
          ...state,
          stage,
          speaker: cmd.who,
          dialogue: { who: cmd.who, text: cmd.text, expr: cmd.expr },
          backlog,
        },
        blocking: true,
      };
    }
    case 'show': {
      const i = findActorIndex(state.stage, cmd.who);
      const actor: StageActor = { who: cmd.who, expr: cmd.expr, pos: cmd.pos };
      const stage = i >= 0 ? state.stage.map((a, idx) => (idx === i ? actor : a)) : [...state.stage, actor];
      return { state: { ...state, stage }, blocking: false };
    }
    case 'expr': {
      const i = findActorIndex(state.stage, cmd.who);
      if (i < 0) return { state, blocking: false };
      const stage = state.stage.map((a, idx) => (idx === i ? { ...a, expr: cmd.expr } : a));
      return { state: { ...state, stage }, blocking: false };
    }
    case 'move': {
      const i = findActorIndex(state.stage, cmd.who);
      if (i < 0) return { state, blocking: false };
      const stage = state.stage.map((a, idx) => (idx === i ? { ...a, pos: cmd.pos } : a));
      return { state: { ...state, stage }, blocking: false };
    }
    case 'hide': {
      const stage = state.stage.filter((a) => a.who !== cmd.who);
      return { state: { ...state, stage }, blocking: false };
    }
    case 'bg':
      return { state: { ...state, bg: cmd.src }, blocking: false };
    case 'cg': {
      const cgUnlocked = state.cgUnlocked.includes(cmd.unlock)
        ? state.cgUnlocked
        : [...state.cgUnlocked, cmd.unlock];
      return { state: { ...state, cg: cmd.src, cgUnlocked }, blocking: false };
    }
    case 'cgHide':
      return { state: { ...state, cg: null }, blocking: false };
    case 'bgm':
      return { state: { ...state, bgm: cmd.src }, blocking: false };
    case 'sfx':
      return { state: { ...state, sfxEvents: [...state.sfxEvents, cmd.src] }, blocking: false };
    case 'fx':
      return { state: { ...state, fxEvent: { kind: cmd.kind, dur: cmd.dur } }, blocking: cmd.kind === 'wait' };
    case 'choice': {
      const items: VisibleChoiceItem[] = cmd.items.map((it) => ({
        ...it,
        visible: it.if ? evalCond(it.if, state.flags) : true,
      }));
      return { state: { ...state, choice: items }, blocking: true };
    }
    case 'set':
      return { state: { ...state, flags: applyFlagOps(state.flags, cmd.ops) }, blocking: false };
    case 'nameInput':
      return { state: { ...state, nameInputPending: true }, blocking: true };
    case 'if': {
      const target = evalCond(cmd.cond, state.flags) ? cmd.then : cmd.else;
      if (!target) return { state, blocking: false };
      return { state, jumpToLabel: target, blocking: false };
    }
    case 'label':
      return { state, blocking: false };
    case 'jump':
      return { state, jumpToScene: { scene: cmd.scene, label: cmd.label }, blocking: true };
    case 'battle':
      return {
        state: { ...state, pendingBattle: { id: cmd.id, onWin: cmd.onWin, onLose: cmd.onLose } },
        blocking: true,
      };
    case 'ending':
      return { state: { ...state, ending: cmd.id }, blocking: true };
    default:
      return { state, blocking: false };
  }
}

const MAX_STEPS_PER_ADVANCE = 5000;

/**
 * 현재 커서부터 다음 "정지" 지점(say/choice/jump/battle/ending 또는 스크립트 끝)까지
 * 논블로킹 커맨드를 자동으로 실행한다. 순수 함수 — 씬의 script 배열만 참조.
 */
export function advance(state: VNState, script: Command[]): VNState {
  let s = state;
  const labels = resolveLabels(script);
  let guard = 0;
  while (guard++ < MAX_STEPS_PER_ADVANCE) {
    if (s.cursor >= script.length) {
      return { ...s, done: true };
    }
    const cmd = script[s.cursor];
    const result = step(s, cmd);
    s = result.state;

    if (result.jumpToScene) {
      return { ...s, pendingJump: result.jumpToScene };
    }

    if (result.jumpToLabel !== undefined) {
      const idx = labels[result.jumpToLabel];
      s = { ...s, cursor: idx !== undefined ? idx : s.cursor + 1 };
    } else {
      s = { ...s, cursor: s.cursor + 1 };
    }

    if (result.blocking) return s;
  }
  return s;
}

/** 선택지 확정: 플래그 적용 후 goto 라벨부터 자동진행 재개. */
export function selectChoice(state: VNState, script: Command[], index: number): VNState {
  const items = state.choice;
  if (!items || !items[index] || !items[index].visible) return state;
  const item = items[index];
  let s: VNState = { ...state, choice: null };
  if (item.set) s = { ...s, flags: applyFlagOps(s.flags, item.set) };
  const labels = resolveLabels(script);
  const target = labels[item.goto];
  s = { ...s, cursor: target !== undefined ? target : s.cursor + 1 };
  return advance(s, script);
}

/**
 * 이름 입력 확정: nameInputPending 상태가 아니면 no-op. 공백만 입력하면 no-op(미확정 유지).
 * mcName 저장 + name_revealed=true 세팅 후 커서 위치(이미 nameInput 커맨드 다음으로 진행됨)부터
 * 자동진행을 재개한다 — selectChoice와 달리 goto 라벨이 없어 순차 진행만 한다.
 */
export function submitName(state: VNState, script: Command[], name: string): VNState {
  if (!state.nameInputPending) return state;
  const trimmed = name.trim();
  if (!trimmed) return state;
  const s: VNState = {
    ...state,
    nameInputPending: false,
    mcName: trimmed,
    flags: applyFlagOps(state.flags, [{ key: 'name_revealed', op: 'set', value: true }]),
  };
  return advance(s, script);
}

/** 자동진행 이벤트(스텝 소비형 사이드채널) 비우기 — sfx/fx는 1회성 신호. */
export function consumeSfxEvents(state: VNState): VNState {
  if (state.sfxEvents.length === 0) return state;
  return { ...state, sfxEvents: [] };
}

export function consumeFxEvent(state: VNState): VNState {
  if (!state.fxEvent) return state;
  return { ...state, fxEvent: null };
}
